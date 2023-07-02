import { initializeApp, getApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import moment from 'moment';

initializeApp();
const firestore = getFirestore();

const notificationsCollection = firestore.collection(`notifications`);

async function addNotification(
  userId: string,
  title: string,
  description: string,
) {
  await notificationsCollection.add({
    userId,
    time: `${moment()}`,
    title,
    description,
    read: false,
    archive: false,
  });
}
