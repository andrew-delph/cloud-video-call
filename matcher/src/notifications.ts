import { initializeApp, getApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import moment from 'moment';

initializeApp();
const firestore = getFirestore();

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
  await notificationsCollection.add({
    userId,
    time: `${moment()}`,
    title,
    description,
    read: false,
    archive: false,
  });
}
