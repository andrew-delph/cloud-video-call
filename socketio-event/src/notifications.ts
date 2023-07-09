import * as common from 'common';
import { credential } from 'firebase-admin';
import { initializeApp, getApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import moment from 'moment';
import { Message, getMessaging } from 'firebase-admin/messaging';

const logger = common.getLogger();

const firebaseApp = initializeApp({
  credential: credential.cert(common.getFirebaseAdminServiceAccount()),
});

const firebaseMessaging = getMessaging(firebaseApp);

const firestore = getFirestore(firebaseApp);

const notificationsCollection = firestore.collection(`notifications`);
const usersCollection = firestore.collection(`users`);

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

  await usersCollection
    .doc(userId)
    .get()
    .then(async (userDoc) => {
      const userData = userDoc.data();
      if (!userData) {
        logger.warn(`No user data in firestore for notification`);
        return;
      }

      const fcmToken: string = userData[`fcmToken`];

      if (!fcmToken) {
        logger.warn(`fcmToken is not set.`);
        return;
      }
      let message: Message = {
        data: {},
        notification: {
          title: title,
          body: description,
        },
        token: fcmToken,
      };

      await firebaseMessaging
        .send(message)
        .then((response) => {
          logger.error(
            `Successfully sent message: ${JSON.stringify(response)}`,
          );
        })
        .catch((error) => {
          logger.error(`Error sending message: ${JSON.stringify(error)}`);
        });
    });
}
