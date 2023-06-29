import { getLogger } from './logger';
import { activeSetName, recentlyActiveUserSet } from './variables';
import amqp from 'amqplib';
import { getAuth } from 'firebase-admin/auth';
import Client from 'ioredis';
import moment from 'moment';
import * as prom from 'prom-client';

const logger = getLogger();

export function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
export function isTestUser(userId: string) {
  return userId.startsWith(`k6`);
}

export async function getUserId(auth: string) {
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
    throw err;
  });
  rabbitConnection.on(`error`, (err) => {
    logger.error(`Connection error: ${err.message}`);
    throw err;
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

// depredicated
export function relationshipProbabilityKey(
  userId1: string,
  userId2: string,
): string {
  if (userId1 > userId2) return relationshipProbabilityKey(userId2, userId1);
  return `relationshipProbability-${userId1}-${userId2}`;
}

// depredicated
export const getRedisRelationshipProbability = async (
  redisClient: Client,
  userId1: string,
  userId2: string,
): Promise<number | null> => {
  const val = await redisClient.get(
    relationshipProbabilityKey(userId1, userId2),
  );
  return val != null ? parseFloat(val) : null;
};

// depredicated
export const writeRedisRelationshipProbability = async (
  redisClient: Client,
  key: string,
  probability: number,
  expire: number,
): Promise<void> => {
  await redisClient.set(key, probability, `EX`, expire);
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
  const deltaTime = moment().subtract(minutes, `minutes`).valueOf();
  const recentlyActiveList = [];

  if (includeActive) {
    recentlyActiveList.push(...(await getActiveUsers(redisClient)));
  }

  recentlyActiveList.push(
    ...(await redisClient.zrangebyscore(
      recentlyActiveUserSet,
      deltaTime,
      `+inf`,
    )),
  );

  return new Set(recentlyActiveList);
};

export function userEmbeddingsKey(userId: string): string {
  return `userEmbeddingsKey-${userId}`;
}

export const getRedisUserEmbeddings = async (
  redisClient: Client,
  userId: string,
): Promise<number[] | null> => {
  const val = await redisClient.get(userEmbeddingsKey(userId));
  return val != null ? JSON.parse(val) : null;
};

export const writeRedisUserEmbeddings = async (
  redisClient: Client,
  userId: string,
  embedding: number[],
  expire: number = 60 * 10,
): Promise<void> => {
  await redisClient.set(
    userEmbeddingsKey(userId),
    JSON.stringify(embedding),
    `EX`,
    expire,
  );
};

export function userPriorityKey(userId: string): string {
  return `userPriorityKey-${userId}`;
}

export const getRedisUserPriority = async (
  redisClient: Client,
  userId: string,
): Promise<number | null> => {
  const val = await redisClient.get(userPriorityKey(userId));
  return val != null ? JSON.parse(val) : null;
};

export const writeRedisUserPriority = async (
  redisClient: Client,
  userId: string,
  priority: number,
  expire: number = 60 * 10,
): Promise<void> => {
  await redisClient.set(
    userPriorityKey(userId),
    JSON.stringify(priority),
    `EX`,
    expire,
  );
};

const defaultLabels = { pod: process.env.HOSTNAME };
prom.register.setDefaultLabels(defaultLabels);

const pushGateway = new prom.Pushgateway(
  `http://loki-prometheus-pushgateway.monitoring:9091`,
);

export class PromClient {
  interval: NodeJS.Timer | undefined;
  jobName: string;

  constructor(jobName: string) {
    this.jobName = jobName;
  }

  startPush(delay: number = 5000) {
    this.interval = setInterval(async () => {
      await this.manualPush();
    }, delay);
  }

  async manualPush() {
    await pushGateway
      .pushAdd({ jobName: this.jobName })
      .then(({ resp, body }) => {
        logger.debug(`pushGateway successful`);
      })
      .catch((err) => {
        logger.error(`pushGateway error: ${err}`);
      });
  }

  async stop() {
    if (this.interval) {
      clearInterval(this.interval);
      await this.manualPush();
    }
  }
}

export function killSigint() {
  process.kill(process.pid, `SIGINT`);
}

export async function ratelimit(
  redisClient: Client,
  key: string,
  auth: string,
  RPM: number,
) {
  const rateLimitRedisKey = `ratelimit:${key}:${auth}`;

  const deltaTime = moment().subtract(1, `minutes`).valueOf();
  const currentRPM = await redisClient.zcount(
    rateLimitRedisKey,
    deltaTime,
    `+inf`,
  );

  if (currentRPM >= RPM) {
    const errorMsg = `RateLimit overflow: key=${key} auth=${auth} RPM=${RPM} currentRPM=${currentRPM}`;
    logger.error(errorMsg);
    throw Error(errorMsg);
  }
  const now = moment().valueOf();
  await redisClient.zadd(rateLimitRedisKey, now, `${auth}:${now}`);
  return currentRPM;
}

export function shuffleArray(array: any[]) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

export function tryParseInt(value: any, defaultValue: number) {
  const parsedValue = parseInt(value, 10);
  return isNaN(parsedValue) ? defaultValue : parsedValue;
}
