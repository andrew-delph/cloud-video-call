import * as common from 'common';
import { credential } from 'firebase-admin';
import { initializeApp, getApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import moment from 'moment';

const logger = common.getLogger();

const serviceAccount = JSON.parse(
  Buffer.from(
    process.env.FIREBASE_SERVICE_ACCOUNT_KEY ?? `error`,
    `base64`,
  ).toString(`utf-8`),
);

const firebaseApp = initializeApp({
  credential: credential.cert(serviceAccount),
});

const firestore = getFirestore(firebaseApp);

const notificationsCollection = firestore.collection(`notifications`);

export async function addNotification(
  userId: string,
  title: string,
  description: string,
) {
  if (!userId || !title || !description) {
    throw Error(
      `addNotification !userId || !title || !description userId ${userId} title ${title} description ${description}`,
    );
  }
  if (common.isTestUser(userId)) {
    logger.debug(`ignoring notification for test user.`);
    return;
  }
  await notificationsCollection.add({
    userId,
    time: `${moment()}`,
    title,
    description,
    read: false,
    archive: false,
  });
}
