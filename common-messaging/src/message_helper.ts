import amqp from 'amqplib';
import { ReadyMessage, MatchmakerMessage } from './gen/proto/rabbitmq_pb';
import {
  delayExchange,
  matchmakerQueueName,
  maxPriority,
  readyRoutingKey,
} from './variables';
import { messageToBuffer } from './utils';
import { bufferToUint8Array } from './utils';

export async function sendMatchmakerQueue(
  rabbitChannel: amqp.Channel,
  userId: string,
) {
  const matchmakerMessage: MatchmakerMessage = new MatchmakerMessage();

  matchmakerMessage.setUserId(userId);

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
) {
  const readyMesage: ReadyMessage = new ReadyMessage();

  readyMesage.setUserId(userId);

  await rabbitChannel.publish(
    delayExchange,
    readyRoutingKey,
    messageToBuffer(readyMesage),
    {
      headers: { 'x-delay': delay },
      priority: maxPriority * priority,
    },
  );
}

export function parseReadyMessage(buffer: Buffer) {
  return ReadyMessage.deserializeBinary(bufferToUint8Array(buffer));
}
