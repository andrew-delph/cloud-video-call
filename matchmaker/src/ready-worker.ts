import { connect, ConsumeMessage } from 'amqplib';
import * as common from 'common';
import Client from 'ioredis';
import Redlock, { ResourceLockedError, ExecutionError } from 'redlock';
import amqp from 'amqplib';

import {
  createNeo4jClient,
  GetRelationshipScoresRequest,
  GetRelationshipScoresResponse,
  CheckUserFiltersRequest,
  CheckUserFiltersResponse,
} from 'neo4j-grpc-common';
import {
  listenGlobalExceptions,
  MatchMessage,
  ReadyMessage,
  RelationshipScoreType,
} from 'common';

const logger = common.getLogger();

const neo4jRpcClient = createNeo4jClient();

let mainRedisClient: Client;
let subRedisClient: Client;
let pubRedisClient: Client;
let lockRedisClient: Client;

let rabbitConnection: amqp.Connection;
let rabbitChannel: amqp.Channel;

const connectRabbit = async () => {
  [rabbitConnection, rabbitChannel] = await common.createRabbitMQClient();

  await rabbitChannel.assertQueue(common.matchQueueName, {
    durable: true,
  });
  logger.info(`rabbit connected`);
};

const matchmakerChannelPrefix = `matchmaker`;

export const startReadyConsumer = async () => {
  await connectRabbit();

  mainRedisClient = common.createRedisClient();
  subRedisClient = common.createRedisClient();
  pubRedisClient = common.createRedisClient();
  lockRedisClient = common.createRedisClient();

  await subRedisClient.psubscribe(`${matchmakerChannelPrefix}*`);

  await rabbitChannel.assertQueue(common.matchmakerQueueName, {
    durable: true,
  });

  await rabbitChannel.assertQueue(common.readyQueueName, {
    durable: true,
    maxPriority: 10,
  });

  rabbitChannel.prefetch(1);
  logger.info(` [x] Awaiting RPC requests`);

  rabbitChannel.consume(
    common.matchQueueName,
    async (msg: ConsumeMessage | null) => {
      if (msg == null) {
        logger.error(`msg is null.`);
        return;
      }

      await rabbitChannel.sendToQueue(common.readyQueueName, msg.content, {});

      rabbitChannel.ack(msg);
    },
    {
      noAck: false,
    },
  );

  rabbitChannel.consume(
    common.readyQueueName,
    async (msg: ConsumeMessage | null) => {
      if (msg == null) {
        logger.error(`msg is null.`);
        return;
      }

      if (msg.properties.priority == null) {
        logger.warn(`msg.properties.priority == null`);
      }

      const msgContent: ReadyMessage = JSON.parse(msg.content.toString());

      const userId = msgContent.userId;

      logger.debug(`matching: ${userId}`);
      if (!userId) {
        logger.error(`recieved ready event has null userId`);
        rabbitChannel.ack(msg);
        return;
      }

      const cleanup: (() => void)[] = [];
      try {
        await matchmakerFlow(userId, msg.properties.priority || 0, cleanup);
        rabbitChannel.ack(msg);
      } catch (e: any) {
        if (e instanceof CompleteError) {
          // logger.debug(`CompleteError ${userId} ${e}`);
          rabbitChannel.ack(msg);
        } else if (e instanceof RetryError) {
          // logger.debug(`RetryError ${userId} ${e}`);
          rabbitChannel.nack(msg);
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
};

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

const matchmakerFlow = async (
  userId: string,
  priority: number,
  cleanup: (() => void)[],
) => {
  // TODO publish messages

  const retrySignal = new RetrySignal();

  if (!(await mainRedisClient.smismember(common.readySetName, userId))[0]) {
    throw new CompleteError(`no longer ready: ${userId}`);
  }

  const notifyListeners = async (targetId: string) => {
    const msg = { priority, owner: userId };
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

        if (msg.owner == userId) {
          // ignore messages from outself
          return;
        } else if (msg.priority > priority) {
          retrySignal.setSignal(`higher priority for ${targetId}`);
        } else if (msg.priority == priority && msg.owner > userId) {
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
  registerSubscriptionListener(userId);
  await notifyListeners(userId);

  let readySet = new Set(await mainRedisClient.smembers(common.readySetName));

  readySet.delete(userId);

  readySet = await applyReadySetFilters(userId, readySet);

  if (readySet.size == 0) throw new RetryError(`ready set is 0`);

  const relationShipScores = await getRelationshipScores(userId, readySet);

  // select the otherId
  let otherId: string;
  let highestScore: common.RelationshipScoreType = {
    prob: -1,
    num_friends: -1,
  };

  if (relationShipScores.length == 0) {
    const randomIndex = Math.floor(Math.random() * readySet.size);
    otherId = Array.from(readySet)[randomIndex];
    logger.info(`select the otherId ... relationShipScores.length == 0`);
  } else {
    relationShipScores.sort((a, b) => {
      const a_score = a[1];
      const b_score = b[1];
      if (a_score.prob === b_score.prob) {
        return b_score.num_friends - a_score.num_friends;
      }
      return b_score.prob - a_score.prob;
    });
    otherId = relationShipScores[0][0];
    highestScore = relationShipScores[0][1];
    const lowestScore: common.RelationshipScoreType =
      relationShipScores[relationShipScores.length - 1][1];
    logger.info(
      `score highest:${highestScore} lowest:${lowestScore} otherId:${otherId} size: ${relationShipScores.length}`,
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
    .using([userId, otherId], 5000, async (signal) => {
      // make sure both are in the set
      if (!(await mainRedisClient.smismember(common.readySetName, userId))[0]) {
        throw new CompleteError(`userId is no longer ready`);
      }
      if (
        !(await mainRedisClient.smismember(common.readySetName, otherId))[0]
      ) {
        throw new RetryError(`otherId is no longer ready`);
      }

      // remove both from ready set
      await mainRedisClient.srem(common.readySetName, userId);
      await mainRedisClient.srem(common.readySetName, otherId);

      // send to matcher
      const matchMessage: MatchMessage = {
        userId1: userId,
        userId2: otherId,
        score: highestScore,
      };

      await rabbitChannel.sendToQueue(
        common.matchQueueName,
        Buffer.from(JSON.stringify(matchMessage)),
      );
    })
    .catch(onError);
};
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
    logger.error(`neo4j grpc error: ${e}`);
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
      30,
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
          logger.error(`getRelationshipScores error: ${e}`);
          reject(e);
        }
      },
    ).catch((e) => {
      logger.error(`neo4j grpc error: ${e}`);
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
    const num_friends = score.getNumbFriends();

    const score_obj = { prob, num_friends };

    await mainRedisClient.set(
      getRealtionshipScoreCacheKey(userId, scoreId),
      JSON.stringify(score_obj),
      `EX`,
      60 * 5,
    );

    relationshipScoresMap.set(scoreId, score_obj);
  }

  return Array.from(relationshipScoresMap.entries());
};

if (require.main === module) {
  listenGlobalExceptions(async () => {
    logger.debug(`clean up ready-worker`);
  });
  startReadyConsumer();
}
