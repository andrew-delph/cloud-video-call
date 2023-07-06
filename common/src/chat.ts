import Client from 'ioredis';
import moment from 'moment';

export function redisChatRoomKey(user1Id: string, user2Id: string): string {
  if (user1Id > user2Id) {
    return redisChatRoomKey(user2Id, user1Id);
  }
  return `chat_room:${user1Id}:${user2Id}`;
}

export function redisRecentChatKey(userId: string): string {
  return `recent_chat:${userId}`;
}

export function redisReadChatKey(userId: string): string {
  return `read_chat:${userId}`;
}

export async function appendChat(
  redisClient: Client,
  source: string,
  target: string,
  message: string,
  system: boolean,
): Promise<ChatMessage> {
  // construct object
  const chatObj: ChatMessage = {
    timestamp: `${moment()}`,
    source,
    target,
    message,
    system,
  };

  // push message to chat room
  await redisClient.rpush(
    redisChatRoomKey(source, target),
    JSON.stringify(chatObj),
  );

  // update recent chat table for source
  await redisClient.zadd(
    redisRecentChatKey(source),
    moment().valueOf(),
    target,
  );

  // update recent chat table for target
  await redisClient.zadd(
    redisRecentChatKey(target),
    moment().valueOf(),
    source,
  );

  return chatObj;
}

export async function setChatRead(
  redisClient: Client,
  source: string,
  target: string,
  read: boolean,
): Promise<void> {
  await redisClient.hset(redisReadChatKey(target), source, read ? 1 : 0);
}

export async function getChatRead(
  redisClient: Client,
  source: string,
  target: string,
): Promise<boolean> {
  const readValue = await redisClient.hget(redisReadChatKey(source), target);

  return readValue == `1`;
}

export async function getRecentChats(
  redisClient: Client,
  source: string,
): Promise<ChatRoom[]> {
  const readValue = await redisClient.zrange(
    redisRecentChatKey(source),
    0,
    -1,
    `WITHSCORES`,
  );

  const recentChats: ChatRoom[] = [];
  for (let i = 0; i < readValue.length; i += 2) {
    const target: string = readValue[i];
    const score: string = readValue[i + 1];
    const latestChat: string = `${moment(parseInt(score))}`;
    const read: boolean = await getChatRead(redisClient, source, target);
    recentChats.push({ source, target, latestChat, read });
  }

  return recentChats;
}

export async function retrieveChat(
  redisClient: Client,
  user1Id: string,
  user2Id: string,
  startIndex: number,
  limit: number,
): Promise<ChatMessage[]> {
  const key = redisChatRoomKey(user1Id, user2Id);

  // if startId is null start from beginging.
  // else start from startId

  const rawMessages: string[] = await redisClient.lrange(
    key,
    -(startIndex + limit),
    -startIndex - 1,
  );

  const chatMessages: ChatMessage[] = rawMessages.map((msg) => JSON.parse(msg));

  return chatMessages;
}

export type ChatMessage = {
  source: string;
  target: string;
  timestamp: string;
  message: string;
  system: boolean;
};

export type ChatRoom = {
  source: string;
  target: string;
  latestChat: string;
  read: boolean;
};
