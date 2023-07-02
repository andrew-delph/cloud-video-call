import {
  ReadyMessage,
  MatchmakerMessage,
  MatchMessage,
  UserSocketMessage,
} from './gen/proto/rabbitmq_pb';
import { messageToBuffer } from './utils';
import { bufferToUint8Array } from './utils';
import {
  delayExchange,
  matchQueueName,
  matchmakerQueueName,
  maxPriority,
  readyRoutingKey,
  userMessageQueue,
} from './variables';
import amqp from 'amqplib';

export async function sendMatchmakerQueue(
  rabbitChannel: amqp.Channel,
  userId: string,
  cooldown_attempts: number = 0,
) {
  const matchmakerMessage: MatchmakerMessage = new MatchmakerMessage();

  matchmakerMessage.setUserId(userId);
  matchmakerMessage.setCooldownAttempts(cooldown_attempts);

  await rabbitChannel.sendToQueue(
    matchmakerQueueName,
    messageToBuffer(matchmakerMessage),
    {},
  );
}

export function parseMatchmakerMessage(buffer: Buffer) {
  return MatchmakerMessage.deserializeBinary(bufferToUint8Array(buffer));
}

export async function sendReadyQueue(
  rabbitChannel: amqp.Channel,
  userId: string,
  priority: number,
  delay: number,
  cooldown_attempts: number,
) {
  const readyMessage: ReadyMessage = new ReadyMessage();

  readyMessage.setUserId(userId);
  readyMessage.setPriority(priority);
  readyMessage.setCooldownAttempts(cooldown_attempts);

  await rabbitChannel.publish(
    delayExchange,
    readyRoutingKey,
    messageToBuffer(readyMessage),
    {
      headers: { 'x-delay': delay },
      priority: Math.max(maxPriority * priority, 0),
    },
  );
}

export function parseReadyMessage(buffer: Buffer) {
  return ReadyMessage.deserializeBinary(bufferToUint8Array(buffer));
}

export async function sendMatchQueue(
  rabbitChannel: amqp.Channel,
  userId1: string,
  userId2: string,
  score: number,
) {
  const matchMesage: MatchMessage = new MatchMessage();

  matchMesage.setUserId1(userId1);
  matchMesage.setUserId2(userId2);
  matchMesage.setScore(score);

  await rabbitChannel.sendToQueue(matchQueueName, messageToBuffer(matchMesage));
}

export function parseMatchMessage(buffer: Buffer) {
  return MatchMessage.deserializeBinary(bufferToUint8Array(buffer));
}

export async function sendUserNotification(
  rabbitChannel: amqp.Channel,
  userId: string,
  eventName: string,
  data: any,
) {
  const userNotificationMessage: UserSocketMessage = new UserSocketMessage();

  userNotificationMessage.setUserId(userId);
  userNotificationMessage.setEventName(eventName);
  userNotificationMessage.setJsonData(JSON.stringify(data));

  await rabbitChannel.sendToQueue(
    userMessageQueue,
    messageToBuffer(userNotificationMessage),
  );
}

export function parseUserNotification(buffer: Buffer) {
  return UserSocketMessage.deserializeBinary(bufferToUint8Array(buffer));
}
