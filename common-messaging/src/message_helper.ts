import {
  ReadyMessage,
  MatchmakerMessage,
  MatchMessage,
  UserSocketMessage,
  UserNotificationMessage,
  ChatEventMessage,
} from './gen/proto/rabbitmq_pb';
import { messageToBuffer } from './utils';
import { bufferToUint8Array } from './utils';
import {
  chatEventQueue,
  delayExchange,
  matchQueueName,
  matchmakerQueueName,
  maxPriority,
  readyRoutingKey,
  userMessageQueue,
  userNotificationQueue,
} from './variables';
import amqp from 'amqplib';

export async function sendMatchmakerQueue(
  rabbitChannel: amqp.Channel,
  userId: string,
  cooldown_attempts: number = 0,
) {
  const matchmaker-eventMessage: MatchmakerMessage = new MatchmakerMessage();

  matchmaker-eventMessage.setUserId(userId);
  matchmaker-eventMessage.setCooldownAttempts(cooldown_attempts);

  await rabbitChannel.sendToQueue(
    matchmakerQueueName,
    messageToBuffer(matchmaker-eventMessage),
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

export async function sendUserMessage(
  rabbitChannel: amqp.Channel,
  userId: string,
  eventName: string,
  data: any,
) {
  const userSocketMessage: UserSocketMessage = new UserSocketMessage();

  userSocketMessage.setUserId(userId);
  userSocketMessage.setEventName(eventName);
  userSocketMessage.setJsonData(JSON.stringify(data));

  await rabbitChannel.sendToQueue(
    userMessageQueue,
    messageToBuffer(userSocketMessage),
  );
}

export async function sendUserNotification(
  rabbitChannel: amqp.Channel,
  userId: string,
  title: string,
  description: string,
) {
  const userNotificationMessage: UserNotificationMessage =
    new UserNotificationMessage();

  userNotificationMessage.setUserId(userId);
  userNotificationMessage.setTitle(title);
  userNotificationMessage.setDescription(description);

  await rabbitChannel.sendToQueue(
    userNotificationQueue,
    messageToBuffer(userNotificationMessage),
  );
}

export async function sendChatEventMessage(
  rabbitChannel: amqp.Channel,
  sourceId: string,
  targetId: string,
  message: string,
  system: boolean = false,
) {
  const userChatEventMessage: ChatEventMessage = new ChatEventMessage();

  userChatEventMessage.setSource(sourceId);
  userChatEventMessage.setTarget(targetId);
  userChatEventMessage.setMessage(message);
  userChatEventMessage.setSystem(system);

  await rabbitChannel.sendToQueue(
    chatEventQueue,
    messageToBuffer(userChatEventMessage),
  );
}

export function parseUserSocketMessage(buffer: Buffer) {
  return UserSocketMessage.deserializeBinary(bufferToUint8Array(buffer));
}

export function parseUserNotificationMessage(buffer: Buffer) {
  return UserNotificationMessage.deserializeBinary(bufferToUint8Array(buffer));
}

export function parseChatEventMessage(buffer: Buffer) {
  return ChatEventMessage.deserializeBinary(bufferToUint8Array(buffer));
}
