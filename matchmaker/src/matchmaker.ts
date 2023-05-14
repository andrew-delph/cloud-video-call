import { connect, ConsumeMessage } from 'amqplib';
import * as common from 'common';
import Client from 'ioredis';
import Redlock, { ResourceLockedError, ExecutionError } from 'redlock';
import amqp from 'amqplib';

import express from 'express';

import {
  createNeo4jClient,
  GetRelationshipScoresRequest,
  GetRelationshipScoresResponse,
  CheckUserFiltersRequest,
  CheckUserFiltersResponse,
  CreateUserResponse,
  CreateUserRequest,
  GetUserPerferencesRequest,
  GetUserPerferencesResponse,
  readyQueueName,
  matchQueueName,
  matchmakerQueueName,
  maxPriority,
  ReadyMessage,
  delayExchange,
  readyRoutingKey,
} from 'common-messaging';
import { listenGlobalExceptions, RelationshipScoreType } from 'common';
import {
  parseMatchmakerMessage,
  parseReadyMessage,
  sendMatchmakerQueue,
  sendMatchQueue,
  sendReadyQueue,
} from 'common-messaging/src/message_helper';

const logger = common.getLogger();

listenGlobalExceptions(async () => {
  logger.debug(`clean up matchmaker`);
});

const port = 80;
const app = express();
app.get(`/health`, (req, res) => {
  logger.debug(`got health check`);
  res.send(`Health is good.`);
});
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

const neo4jRpcClient = createNeo4jClient();

let mainRedisClient: Client;
let subRedisClient: Client;
let pubRedisClient: Client;
let lockRedisClient: Client;

let rabbitConnection: amqp.Connection;
let rabbitChannel: amqp.Channel;

const prefetch = 2;

const relationshipFilterCacheEx = 60 * 2;
const realtionshipScoreCacheEx = 60;

const maxCooldownAttemps = 20;
const cooldownScalerValue = 1.25;
const maxDelaySeconds = 10;

const stripUserId = (userId: string): string => {
  const split = userId.split(`_`);
  const val = split.pop()!;
  return val;
};

const connectRabbit = async () => {
  [rabbitConnection, rabbitChannel] = await common.createRabbitMQClient();

  await rabbitChannel.assertQueue(matchQueueName, {
    durable: true,
  });

  await rabbitChannel.assertQueue(readyQueueName, {
    durable: true,
    maxPriority: maxPriority,
  });

  await rabbitChannel.assertExchange(delayExchange, `x-delayed-message`, {
    durable: true,
    arguments: { 'x-delayed-type': `direct` },
  });

  await rabbitChannel.bindQueue(readyQueueName, delayExchange, readyRoutingKey);

  logger.info(`rabbit connected`);
};

const neo4jGetUser = (userId: string) => {
  const getUserPerferencesRequest = new GetUserPerferencesRequest();
  getUserPerferencesRequest.setUserId(userId);
  return new Promise<GetUserPerferencesResponse>(async (resolve, reject) => {
    try {
      neo4jRpcClient.getUserPerferences(
        getUserPerferencesRequest,
        (error: any, response: GetUserPerferencesResponse) => {
          if (error) {
            reject(error);
          } else {
            resolve(response);
          }
        },
      );
    } catch (e) {
      reject(e);
    }
  });
};

const matchmakerChannelPrefix = `matchmaker`;

export async function startReadyConsumer() {
  await connectRabbit();

  mainRedisClient = common.createRedisClient();
  subRedisClient = common.createRedisClient();
  pubRedisClient = common.createRedisClient();
  lockRedisClient = common.createRedisClient();

  await subRedisClient.psubscribe(`${matchmakerChannelPrefix}*`);

  rabbitChannel.prefetch(prefetch);
  logger.info(` [x] Awaiting RPC requests`);

  rabbitChannel.consume(
    matchmakerQueueName,
    async (msg: ConsumeMessage | null) => {
      if (msg == null) {
        logger.error(`msg is null.`);
        return;
      }

      const matchmakerMessage = parseMatchmakerMessage(msg.content);

      const userId = matchmakerMessage.getUserId();

      const cooldownAttempts = matchmakerMessage.getCooldownAttempts();

      const userRepsonse = await neo4jGetUser(userId);

      const priority =
        userRepsonse.getPriority() ||
        (await common.getRedisUserPriority(mainRedisClient, userId)) ||
        -1;

      const delaySeconds = Math.min(
        matchmakerMessage.getCooldownAttempts() ** cooldownScalerValue,
        maxDelaySeconds,
      );

      logger.debug(
        `userId=${stripUserId(userId)} priority=${priority.toFixed(
          2,
        )} redis=${await common.getRedisUserPriority(
          mainRedisClient,
          userId,
        )} cooldownAttempts=${cooldownAttempts} delaySeconds=${delaySeconds.toFixed(
          1,
        )}`,
      );

      await sendReadyQueue(
        rabbitChannel,
        userId,
        priority,
        delaySeconds * 1000,
        matchmakerMessage.getCooldownAttempts(),
      );

      rabbitChannel.ack(msg);
    },
    {
      noAck: false,
    },
  );

  rabbitChannel.consume(
    readyQueueName,
    async (msg: ConsumeMessage | null) => {
      if (msg == null) {
        logger.error(`msg is null.`);
        return;
      }

      const readyMessage = parseReadyMessage(msg.content);

      const userId = readyMessage.getUserId();

      logger.debug(`matching: ${userId}`);
      if (!userId) {
        logger.error(`recieved ready event has null userId`);
        rabbitChannel.ack(msg);
        return;
      }

      const cleanup: (() => void)[] = [];
      try {
        await matchmakerFlow(readyMessage, cleanup);
        rabbitChannel.ack(msg);
      } catch (e: any) {
        if (e instanceof CompleteError) {
          logger.debug(`CompleteError ${userId} ${e}`);
          rabbitChannel.ack(msg);
        } else if (e instanceof RetryError) {
          logger.debug(`RetryError ${userId} ${e}`);
          rabbitChannel.nack(msg);
        } else if (e instanceof CooldownRetryError) {
          logger.debug(`CooldownRetryError ${userId} ${e}`);
          await sendMatchmakerQueue(
            rabbitChannel,
            userId,
            readyMessage.getCooldownAttempts() + 1,
          );
          rabbitChannel.ack(msg);
        } else {
          logger.error(`Unknown error: ${e}`);
          logger.error(e.stack);
          // rabbitChannel.nack(msg);
          throw e;
        }
      } finally {
        cleanup.forEach((cleanupFunc) => {
          cleanupFunc();
        });
      }
    },
    {
      noAck: false,
    },
  );
}

class CompleteError extends Error {
  constructor(message: string) {
    super(message);
  }
}

class RetryError extends Error {
  constructor(message: string) {
    super(message);
  }
}

class CooldownRetryError extends Error {
  readyMessage: ReadyMessage;
  constructor(message: string, readyMessage: ReadyMessage) {
    super(message);
    this.readyMessage = readyMessage;
  }
}

class RetrySignal {
  signal = ``;
  setSignal(msg: string) {
    this.signal = msg;
  }
  checkSignal() {
    if (this.signal) throw new RetryError(this.signal);
  }
}

const getSocketChannel = (userId: string) => {
  return `${matchmakerChannelPrefix}${userId}`;
};

async function matchmakerFlow(
  readyMessage: ReadyMessage,
  cleanup: (() => void)[],
) {
  // TODO publish messages

  const retrySignal = new RetrySignal();

  if (
    !(
      await mainRedisClient.smismember(
        common.readySetName,
        readyMessage.getUserId(),
      )
    )[0]
  ) {
    throw new CompleteError(`no longer ready: ${readyMessage.getUserId()}`);
  }

  const notifyListeners = async (targetId: string) => {
    const msg = {
      priority: readyMessage.getPriority(),
      owner: readyMessage.getUserId(),
    };
    await pubRedisClient.publish(
      getSocketChannel(targetId),
      JSON.stringify(msg),
    );
  };

  const registerSubscriptionListener = (targetId: string) => {
    const listener = async (
      pattern: string,
      channel: string,
      message: string,
    ) => {
      if (channel == getSocketChannel(targetId)) {
        let msg;
        try {
          msg = JSON.parse(message);
        } catch (e) {
          logger.error(e);
          return;
        }
        if (msg.priority == null || msg.owner == null) {
          logger.error(
            `registerSubscriptionListener ... !msg.priority || !msg.owner `,
          );
          return;
        }

        if (msg.owner == readyMessage.getUserId()) {
          // ignore messages from outself
          return;
        } else if (msg.priority > readyMessage.getPriority()) {
          retrySignal.setSignal(`higher priority for ${targetId}`);
        } else if (
          msg.priority == readyMessage.getPriority() &&
          msg.owner > readyMessage.getUserId()
        ) {
          retrySignal.setSignal(`higher priority for ${targetId}`);
        } else {
          await notifyListeners(targetId);
        }
      }
    };

    cleanup.push(() => {
      subRedisClient.off(`pmessage`, listener);
    });
    subRedisClient.on(`pmessage`, listener);
  };

  // listen and publish on userId
  registerSubscriptionListener(readyMessage.getUserId());
  await notifyListeners(readyMessage.getUserId());

  let readySet = new Set(await mainRedisClient.smembers(common.readySetName));

  readySet.delete(readyMessage.getUserId());

  readySet = await applyReadySetFilters(readyMessage.getUserId(), readySet);

  if (readySet.size == 0) throw new RetryError(`ready set is 0`);

  const relationShipScores = await getRelationshipScores(
    readyMessage.getUserId(),
    readySet,
  );

  // select the otherId
  let otherId: string;
  let highestScore: common.RelationshipScoreType = {
    prob: -1,
    score: -1,
  };

  if (relationShipScores.length == 0) {
    const randomIndex = Math.floor(Math.random() * readySet.size);
    otherId = Array.from(readySet)[randomIndex];
    logger.info(`select the otherId ... relationShipScores.length == 0`);
    throw new RetryError(`relationShipScores.length == 0`);
  } else {
    relationShipScores.sort((a, b) => {
      const a_score = a[1];
      const b_score = b[1];
      if (a_score.prob != b_score.prob) {
        return b_score.prob - a_score.prob;
      }
      return b_score.score - a_score.score;
    });
    otherId = relationShipScores[0][0];
    highestScore = relationShipScores[0][1];

    const scoreThreshold =
      1 - (readyMessage.getCooldownAttempts() + 1) / maxCooldownAttemps;

    const highestScoreString = `highestScore={prob=${highestScore.prob.toFixed(
      2,
    )}, score=${highestScore.score.toFixed(2)}}`;

    const lowestScore = relationShipScores[relationShipScores.length - 1][1];
    const lowestScoreString = `lowestScore={prob=${lowestScore.prob.toFixed(
      2,
    )}, score=${lowestScore.score.toFixed(2)}}`;

    const matchedString = `matched=[${stripUserId(
      readyMessage.getUserId(),
    )},${stripUserId(otherId)}]`;

    if (highestScore.prob <= 0 && highestScore.score <= scoreThreshold) {
      if (
        readyMessage.getPriority() >= 0 &&
        readyMessage.getCooldownAttempts() <= maxCooldownAttemps
      ) {
        throw new CooldownRetryError(
          `userID=${readyMessage.getUserId()} priority=${readyMessage.getPriority()} cooldownAttempts=${readyMessage.getCooldownAttempts()}`,
          readyMessage,
        );
      } else {
        logger.warn(
          `no cooldown: priority=${readyMessage
            .getPriority()
            .toFixed(
              2,
            )} cooldownAttempts=${readyMessage.getCooldownAttempts()} priority=${readyMessage
            .getPriority()
            .toFixed(2)} ${matchedString}`,
        );
      }
    }

    logger.info(
      `${highestScoreString} scores=${
        relationShipScores.length
      } cooldownAttempts=${readyMessage.getCooldownAttempts()} priority=${readyMessage
        .getPriority()
        .toFixed(2)} scoreThreshold=${scoreThreshold.toFixed(
        2,
      )} ${matchedString}`,
    );
  }

  // listen and publish on otherId
  registerSubscriptionListener(otherId);
  await notifyListeners(otherId);

  // retrySignal.checkSignal();
  // await common.delay(1000); // Give tasks events 10 second
  retrySignal.checkSignal();

  const redlock = new Redlock([lockRedisClient]);
  const onError = (e: any) => {
    if (e instanceof ResourceLockedError) {
      throw new RetryError(e.message);
    } else if (e instanceof ExecutionError) {
      throw new RetryError(e.message);
    }
    throw e;
  };

  await redlock
    .using([readyMessage.getUserId(), otherId], 5000, async (signal) => {
      // make sure both are in the set
      if (
        !(
          await mainRedisClient.smismember(
            common.readySetName,
            readyMessage.getUserId(),
          )
        )[0]
      ) {
        throw new CompleteError(`userId is no longer ready`);
      }
      if (
        !(await mainRedisClient.smismember(common.readySetName, otherId))[0]
      ) {
        throw new RetryError(`otherId is no longer ready`);
      }

      // remove both from ready set
      await mainRedisClient.srem(common.readySetName, readyMessage.getUserId());
      await mainRedisClient.srem(common.readySetName, otherId);

      await sendMatchQueue(rabbitChannel, readyMessage.getUserId(), otherId, 1);
    })
    .catch(onError);
}
const getRelationshipFilterCacheKey = (
  userId1: string,
  userId2: string,
): string => {
  if (userId1 > userId2) return getRelationshipFilterCacheKey(userId2, userId1);
  return `relationship-filter-${userId1}-${userId2}`;
};

const neo4jCheckUserFiltersRequest = (
  checkUserFiltersRequest: CheckUserFiltersRequest,
) => {
  return new Promise<CheckUserFiltersResponse>(async (resolve, reject) => {
    try {
      await neo4jRpcClient.checkUserFilters(
        checkUserFiltersRequest,
        (error: any, response: CheckUserFiltersResponse) => {
          if (error) {
            reject(error);
          } else {
            resolve(response);
          }
        },
      );
    } catch (e) {
      logger.error(`checkUserFiltersRequest error: ${e}`);
      reject(e);
    }
  }).catch((e) => {
    logger.error(`neo4jCheckUserFiltersRequest:`, e);
    throw new RetryError(e);
  });
};

const applyReadySetFilters = async (
  userId: string,
  readySet: Set<string>,
): Promise<Set<string>> => {
  const approved = new Set<string>();
  // check if exists in cache before making request for each id.
  for (let otherId of readySet) {
    const filter = await mainRedisClient.get(
      getRelationshipFilterCacheKey(userId, otherId),
    );
    if (filter == null) continue;
    if (filter == `1`) {
      approved.add(otherId);
    }
    readySet.delete(otherId);
  }

  // request filters and attributes for each userId
  // make comparisions to each userId
  // store in cache. 1 means passes filter. 0 means rejected

  for (const idToRequest of readySet) {
    const checkUserFiltersRequest = new CheckUserFiltersRequest();

    checkUserFiltersRequest.setUserId1(userId);
    checkUserFiltersRequest.setUserId2(idToRequest);

    const getUserAttributesFiltersResponse = await neo4jCheckUserFiltersRequest(
      checkUserFiltersRequest,
    );
    const passed = getUserAttributesFiltersResponse.getPassed();

    // set valid result
    await mainRedisClient.set(
      getRelationshipFilterCacheKey(userId, idToRequest),
      passed ? `1` : 0,
      `EX`,
      relationshipFilterCacheEx,
    );
    if (passed) {
      approved.add(idToRequest);
    } else {
    }
  }

  return approved;
};

const getRealtionshipScoreCacheKey = (userId: string, otherId: string) => {
  return `relationship-score-${userId}-${otherId}`;
};

const getRelationshipScores = async (userId: string, readyset: Set<string>) => {
  const relationshipScoresMap = new Map<string, RelationshipScoreType>();

  // get values that are in cache
  // pop from the readySet if in cache

  for (const otherId of readyset.values()) {
    const relationshipScore: RelationshipScoreType = JSON.parse(
      (await mainRedisClient.get(
        getRealtionshipScoreCacheKey(userId, otherId),
      )) || `0`,
    );

    if (!relationshipScore) continue;
    readyset.delete(otherId);
    relationshipScoresMap.set(otherId, relationshipScore);
  }

  logger.debug(`relationship scores in cache: ${relationshipScoresMap.size}`);

  if (readyset.size == 0) return Array.from(relationshipScoresMap.entries());

  // get relationship scores from neo4j
  const getRelationshipScoresRequest = new GetRelationshipScoresRequest();
  getRelationshipScoresRequest.setUserId(userId);
  getRelationshipScoresRequest.setOtherUsersList(Array.from(readyset));

  const getRelationshipScoresResponse =
    await new Promise<GetRelationshipScoresResponse>(
      async (resolve, reject) => {
        try {
          await neo4jRpcClient.getRelationshipScores(
            getRelationshipScoresRequest,
            (error: any, response: GetRelationshipScoresResponse) => {
              if (error) {
                reject(error);
              } else {
                resolve(response);
              }
            },
          );
        } catch (e) {
          reject(e);
        }
      },
    ).catch((e) => {
      logger.error(`getRelationshipScores`, e);
      throw new RetryError(e);
    });

  const getRelationshipScoresMap =
    getRelationshipScoresResponse.getRelationshipScoresMap();

  logger.debug(
    `relationship scores requested:${
      readyset.size
    } responded: ${getRelationshipScoresMap.getLength()}`,
  );

  // write them to the cache
  // store them in map
  for (const scoreEntry of getRelationshipScoresMap.entries()) {
    const scoreId = scoreEntry[0];
    const score = scoreEntry[1];
    const prob = score.getProb();
    const scoreVal = score.getScore();

    const score_obj = { prob, score: scoreVal };

    await mainRedisClient.set(
      getRealtionshipScoreCacheKey(userId, scoreId),
      JSON.stringify(score_obj),
      `EX`,
      realtionshipScoreCacheEx,
    );

    relationshipScoresMap.set(scoreId, score_obj);
  }

  return Array.from(relationshipScoresMap.entries());
};

startReadyConsumer();
