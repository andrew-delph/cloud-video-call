import moment from 'moment';

import Client from 'ioredis';

export function redisChatKey(user1Id: string, user2Id: string): string {
  if (user1Id > user2Id) {
    return redisChatKey(user2Id, user1Id);
  }
  return `chat:${user1Id}:${user2Id}`;
}

export async function persistChat(
  redisClient: Client,
  source: string,
  target: string,
  message: string,
): Promise<ChatMessage> {
  const key = redisChatKey(source, target);

  const timestamp: string = `${moment()}`;

  // construct object
  const chatObj: ChatMessage = {
    timestamp,
    source,
    target,
    message,
  };

  // add to redis...
  await redisClient.rpush(key, JSON.stringify(chatObj));
  return chatObj;
}

export async function retrieveChat(
  redisClient: Client,
  user1Id: string,
  user2Id: string,
  startIndex: number,
  limit: number,
): Promise<ChatMessage[]> {
  const key = redisChatKey(user1Id, user2Id);

  // if startId is null start from beginging.
  // else start from startId

  const rawMessages: string[] = await redisClient.lrange(
    key,
    -startIndex,
    -(startIndex + limit),
  );

  const chatMessages: ChatMessage[] = rawMessages.map((msg) => JSON.parse(msg));

  return chatMessages;
}

type ChatMessage = {
  source: string;
  target: string;
  timestamp: string;
  message: string;
};
