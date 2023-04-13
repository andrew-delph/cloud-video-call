import { getLogger } from './logger';
import { getAuth } from 'firebase-admin/auth';
import Client from 'ioredis';

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

export function createRedisClient() {
  const client = new Client({
    host: `${process.env.REDIS_HOST || `redis`}`,
  });

  client.on(`error`, (err) => {
    throw `REDIS: FAILED ${err}`;
  });

  return client;
}
