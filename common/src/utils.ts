import { getLogger } from './logger';
import { getAuth } from 'firebase-admin/auth';

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
