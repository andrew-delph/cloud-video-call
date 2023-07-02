export function redisChatKey(user1Id: string, user2Id: string): string {
  if (user1Id > user2Id) {
    return redisChatKey(user2Id, user1Id);
  }
  return `chat:${user1Id}:${user2Id}`;
}

export function persistChat(
  redisClient: any,
  source: string,
  target: string,
  message: string,
) {
  const key = redisChatKey(source, target);

  // construct object

  // create id for each event?

  // add to redis...
}

export function retrieveChat(
  redisClient: any,
  user1Id: string,
  user2Id: string,
  limit: number,
  startId: string | null = null,
) {
  const key = redisChatKey(user1Id, user2Id);

  // if startId is null start from beginging.
  // else start from startId

  // only return the limit amount
}

// type ChatEvent{

// }
