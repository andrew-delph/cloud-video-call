import {
  calcScoreThreshold,
  calcScoreZset,
  expireScoreZset,
  getRelationshipScores,
} from './relationship_calculations';
import { FilteredUserType, RelationshipScoreWrapper } from './types';
import { connect, ConsumeMessage } from 'amqplib';
import amqp from 'amqplib';
import * as common from 'common';
import { listenGlobalExceptions } from 'common';
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
  FilterObject,
  userNotificationQueue,
} from 'common-messaging';
import { message_helper } from 'common-messaging';
import express from 'express';
import Client from 'ioredis';
import moment from 'moment';
import Redlock, { ResourceLockedError, ExecutionError } from 'redlock';

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

export const neo4jRpcClient = createNeo4jClient();

export let mainRedisClient: Client;
let subRedisClient: Client;
let pubRedisClient: Client;
let lockRedisClient: Client;

let rabbitConnection: amqp.Connection;
let rabbitChannel: amqp.Channel;

const prefetch = 4;

export const realtionshipScoreCacheEx = 60 * 5;

const maxCooldownDelay = 20; // still can be longer because of priority delay
const cooldownScalerValue = 1.1;
const maxReadyDelaySeconds = 5;
const maxPriorityDelay = 0;
const maxCooldownAttemps = Math.floor(
  maxCooldownDelay ** (1 / cooldownScalerValue),
);

const lastMatchedCooldownMinutes = 0; // filter of last matches
const recentMatchesLowerScore = false;

const relationShipScoresSortFunc = (
  a: [string, RelationshipScoreWrapper],
  b: [string, RelationshipScoreWrapper],
) => {
  const a_score = a[1];
  const b_score = b[1];

  const score =
    a_score.prob != b_score.prob
      ? b_score.prob - a_score.prob
      : b_score.score - a_score.score;

  if (
    recentMatchesLowerScore &&
    Math.abs(score) <= 0.1 &&
    (a_score.latest_match != undefined || b_score.latest_match != undefined)
  ) {
    if (a_score.latest_match == undefined) return -1;
    if (b_score.latest_match == undefined) return 1;
    else if (a_score.latest_match == b_score.latest_match) return score;
    else return b_score.latest_match.isAfter(a_score.latest_match) ? -1 : 1;
  }
  return score;
};

const calcScorePercentile = (attempts: number) => {
  return 1 - (attempts + 1) / maxCooldownAttemps / 3;
};

export const stripUserId = (userId: string): string => {
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

  await rabbitChannel.assertQueue(userNotificationQueue, {
    durable: true,
  });

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
            logger.error(error);
            reject(error);
          } else {
            resolve(response);
          }
        },
      );
    } catch (e) {
      logger.error(e);
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

      const matchmakerMessage = message_helper.parseMatchmakerMessage(
        msg.content,
      );

      const userId = matchmakerMessage.getUserId();

      const cooldownAttempts = matchmakerMessage.getCooldownAttempts();

      // if (cooldownAttempts == 0) {
      //   await calcScoreZset(userId);
      // }
      // await expireScoreZset(userId, 60 * 5);

      const userRepsonse = await neo4jGetUser(userId);

      const priority = userRepsonse.getPriority();

      const priorityDelay =
        maxPriorityDelay - maxPriorityDelay * Math.min(priority, 0);

      const delaySeconds = Math.min(
        priorityDelay +
          matchmakerMessage.getCooldownAttempts() ** cooldownScalerValue,
        maxReadyDelaySeconds,
      );

      logger.debug(
        `userId=${stripUserId(userId)} priority=${priority.toFixed(
          2,
        )} redis=${await common.getRedisUserPriority(
          mainRedisClient,
          userId,
        )} attempt=${cooldownAttempts} delay=${delaySeconds.toFixed(1)}`,
      );

      await message_helper.sendReadyQueue(
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

      const readyMessage = message_helper.parseReadyMessage(msg.content);

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
          await message_helper.sendMatchmakerQueue(
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

export class CompleteError extends Error {
  constructor(message: string) {
    super(message);
  }
}

export class RetryError extends Error {
  constructor(message: string) {
    super(message);
  }
}

export class CooldownRetryError extends Error {
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

  const readySet = new Set(await mainRedisClient.smembers(common.readySetName));
  const activeSize = await mainRedisClient.scard(common.activeSetName);

  const filterSet: Set<FilteredUserType> = await createFilterSet(
    readyMessage.getUserId(),
    readySet,
  );

  logger.debug(
    `filterSet.size=${filterSet.size} readySet.size=${readySet.size}`,
  );

  const scorePercentile = calcScorePercentile(
    readyMessage.getCooldownAttempts(),
  );

  const scoreThreshold = await calcScoreThreshold(
    readyMessage.getUserId(),
    scorePercentile,
  );

  // send data here...
  await message_helper.sendUserNotification(
    rabbitChannel,
    readyMessage.getUserId(),
    `matchmakerProgess`,
    {
      readySize: readySet.size,
      filterSize: filterSet.size,
      activeSize: activeSize,
      scorePercentile,
      scoreThreshold,
      cooldownAttempt: readyMessage.getCooldownAttempts(),
    },
  );

  if (filterSet.size == 0) throw new RetryError(`filterSet is 0`);

  const relationShipScores = await getRelationshipScores(
    readyMessage.getUserId(),
    filterSet,
  );

  if (relationShipScores.length == 0) {
    throw new RetryError(`relationShipScores.length == 0`);
  }
  relationShipScores.sort(relationShipScoresSortFunc);

  const otherId: string = relationShipScores[0][0];
  const highestScore: RelationshipScoreWrapper = relationShipScores[0][1];

  const cooldownString = `priority=${readyMessage
    .getPriority()
    .toFixed(
      2,
    )} attempts=${readyMessage.getCooldownAttempts()}/${maxCooldownAttemps.toFixed(
    1,
  )}`;

  const scoreThreasholdString = `percentile=${scorePercentile.toFixed(
    2,
  )} threshold=${scoreThreshold.toFixed(2)}`;

  // const highestScoreString = `score=${highestScore.score.toFixed(
  //   2,
  // )} prob=${highestScore.prob.toFixed(2)}  lastMatchMins=${moment().diff(
  //   highestScore.latest_match,
  //   `minutes`,
  // )}`;

  // const lowestScore = relationShipScores[relationShipScores.length - 1][1];
  // const lowestScoreString = `lowestScore={prob=${lowestScore.prob.toFixed(
  //   2,
  // )}, score=${lowestScore.score.toFixed(2)}}`;

  const matchedString = `matched=[${stripUserId(
    readyMessage.getUserId(),
  )},${stripUserId(otherId)}]`;

  if (highestScore.prob <= 0 && highestScore.score <= scorePercentile) {
    //scoreThreshold
    if (
      readyMessage.getPriority() >= 0 &&
      readyMessage.getCooldownAttempts() < maxCooldownAttemps
    ) {
      throw new CooldownRetryError(
        `userID=${readyMessage.getUserId()} ${cooldownString} ${scoreThreasholdString}`,
        readyMessage,
      );
    } else {
      logger.debug(`no cooldown: ${cooldownString} ${matchedString}`);
    }
  }

  const matchedMsg = [
    `percentile=${scorePercentile.toFixed(2)}`,
    `score=${highestScore.score.toFixed(2)}`,
    `threshhold=${scoreThreshold.toFixed(2)}`,
    `priority=${readyMessage.getPriority()}`,
    `matched=[${stripUserId(readyMessage.getUserId())},${stripUserId(
      otherId,
    )}]`,
    `scores=${relationShipScores.length}`,
    `attempts=${
      readyMessage.getCooldownAttempts() >= maxCooldownAttemps
        ? `${readyMessage.getCooldownAttempts()}(max)`
        : readyMessage.getCooldownAttempts()
    }`,
  ];

  logger.info(matchedMsg.join(` `));

  // listen and publish on otherId
  registerSubscriptionListener(otherId);
  await notifyListeners(otherId);

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

      await message_helper.sendMatchQueue(
        rabbitChannel,
        readyMessage.getUserId(),
        otherId,
        1,
      );

      // remove both from ready set
      await mainRedisClient.srem(common.readySetName, readyMessage.getUserId());
      await mainRedisClient.srem(common.readySetName, otherId);
    })
    .catch(onError);
}

const neo4jCheckUserFiltersRequest = (
  checkUserFiltersRequest: CheckUserFiltersRequest,
) => {
  return new Promise<CheckUserFiltersResponse>(async (resolve, reject) => {
    try {
      neo4jRpcClient.checkUserFilters(
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
  });
};

export async function createFilterSet(
  userId: string,
  readySet: Set<string>,
): Promise<Set<FilteredUserType>> {
  readySet.delete(userId);

  const checkUserFiltersRequest = new CheckUserFiltersRequest();

  for (const idToRequest of readySet) {
    const filter = new FilterObject();
    filter.setUserId1(userId);
    filter.setUserId2(idToRequest);

    checkUserFiltersRequest.addFilters(filter);
  }

  const checkUserFiltersResponse = await neo4jCheckUserFiltersRequest(
    checkUserFiltersRequest,
  );

  return new Set<FilteredUserType>(
    checkUserFiltersResponse
      .getFiltersList()
      .filter((filter) => filter.getPassed())
      .map((filter) => {
        return {
          otherId: filter.getUserId2(),
          latest_match: !!filter.getLastMatchedTime()
            ? moment(filter.getLastMatchedTime())
            : moment(0),
        };
      })
      .filter((filterObj) => {
        return moment(filterObj.latest_match).isBefore(
          moment().subtract(lastMatchedCooldownMinutes, `minutes`),
        );
      }),
  );
}

startReadyConsumer();
