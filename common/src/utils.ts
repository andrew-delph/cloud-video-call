import { getLogger } from './logger';
import { getAuth } from 'firebase-admin/auth';
import Client from 'ioredis';
import amqp from 'amqplib';

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
