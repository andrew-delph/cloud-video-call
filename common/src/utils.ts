import { getLogger } from './logger';
import { getAuth } from 'firebase-admin/auth';
import Client from 'ioredis';
import amqp from 'amqplib';
import { activeSetName, recentlyActiveUserSet } from './variables';
import moment from 'moment';

const logger = getLogger();

export function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function getUid(auth: string) {
  if (auth.startsWith(`k6`)) {
    return auth;
  } else {
    return await getAuth()
      .verifyIdToken(auth)
      .then(async (decodedToken: { uid: any }) => {
        return decodedToken.uid;
      });
  }
}

export function createRedisClient(): Client {
  const client = new Client({
    host: `${process.env.REDIS_HOST || `redis`}`,
  });

  client.on(`error`, (err) => {
    throw `REDIS: FAILED ${err}`;
  });

  return client;
}

export async function createRabbitMQClient(): Promise<
  [amqp.Connection, amqp.Channel]
> {
  let rabbitConnection = await amqp.connect(`amqp://rabbitmq`);
  let rabbitChannel = await rabbitConnection.createChannel();
  rabbitChannel.on(`error`, (err) => {
    logger.error(`Publisher error: ${err.message}`);
  });
  rabbitConnection.on(`error`, (err) => {
    logger.error(`Connection error: ${err.message}`);
  });

  return [rabbitConnection, rabbitChannel];
}

export const redisScanKeys = async (
  redisClient: Client,
  pattern = ``,
): Promise<Set<string>> => {
  let stream = redisClient.scanStream({
    match: pattern,
  });
  return new Promise((res, rej) => {
    let keysSet = new Set<string>();
    stream.on(`data`, async (keys: string[] = []) => {
      for (const key of keys) {
        keysSet.add(key);
      }
    });
    stream.on(`end`, () => {
      res(keysSet);
    });
  });
};

export const getActiveUsers = async (
  redisClient: Client,
): Promise<string[]> => {
  return await redisClient.smembers(activeSetName);
};

function relationshipProbabilityKey(userId1: string, userId2: string): string {
  if (userId1 > userId2) return relationshipProbabilityKey(userId2, userId1);
  return `relationshipProbability-${userId1}-${userId2}`;
}

export const getRedisRelationshipProbability = async (
  redisClient: Client,
  userId1: string,
  userId2: string,
): Promise<number> => {
  const val = await redisClient.get(
    relationshipProbabilityKey(userId1, userId2),
  );
  return val != null ? parseFloat(val) : -1;
};

export const writeRedisRelationshipProbability = async (
  redisClient: Client,
  userId1: string,
  userId2: string,
  probability: number,
): Promise<void> => {
  await redisClient.set(
    relationshipProbabilityKey(userId1, userId2),
    probability,
    `EX`,
    60 * 30,
  );
};

export const updateRecentlyActiveUser = async (
  redisClient: Client,
  userId: string,
) => {
  await redisClient.zadd(recentlyActiveUserSet, moment().valueOf(), userId);
};

export const getRecentlyActiveUsers = async (
  redisClient: Client,
  minutes: number,
  includeActive: boolean = true,
) => {
  const fiveMinutesAgo = moment().subtract(minutes, `minutes`).valueOf();

  const recentlyActiveList = await redisClient.zrangebyscore(
    recentlyActiveUserSet,
    fiveMinutesAgo,
    `+inf`,
  );

  if (includeActive) {
    recentlyActiveList.push(...(await getActiveUsers(redisClient)));
  }

  return [...new Set(recentlyActiveList)];
};
