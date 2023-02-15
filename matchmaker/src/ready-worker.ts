import { connect, ConsumeMessage } from 'amqplib';
import * as common from 'react-video-call-common';
import { v4 as uuid } from 'uuid';
import * as neo4j from 'neo4j-driver';
import { Redis } from 'ioredis';

const serverID = uuid();

let mainRedisClient: Redis;
let subRedisClient: Redis;

const driver = neo4j.driver(
  `neo4j://neo4j:7687`,
  neo4j.auth.basic(`neo4j`, `password`),
);

export const startReadyConsumer = async () => {
  const connection = await connect(`amqp://rabbitmq`);
  const channel = await connection.createChannel();
  await channel.assertQueue(common.readyQueueName, {
    durable: true,
  });
  console.log(`rabbit connected`);

  mainRedisClient = new Redis({
    host: `${process.env.REDIS_HOST || `redis`}`,
  });

  subRedisClient = new Redis({
    host: `${process.env.REDIS_HOST || `redis`}`,
  });

  // channel.prefetch(10);
  console.log(` [x] Awaiting RPC requests`);

  channel.consume(
    common.readyQueueName,
    async (msg: ConsumeMessage | null) => {
      if (msg == null) {
        console.log(`msg is null.`);
        return;
      }

      const msgContent: [string] = JSON.parse(msg.content.toString());

      const socketId = msgContent[0];
      if (!socketId) {
        console.error(`socketId is null`);
        channel.ack(msg);
      }

      try {
        console.log(`socketId ${socketId}`);
      } catch (e) {
        console.log(`readyEvent severid= ${serverID} error=` + e);
      } finally {
        channel.ack(msg);
      }
    },
    {
      noAck: false,
    },
  );
};

class AckError extends Error {
  constructor(message: string) {
    super(message);
  }
}

const getSocketChannel = (socketId: string) => {
  return `matchmacker${socketId}`;
};

const matchmakerFlow = async (socketId: string) => {
  if (!subRedisClient.smismember(common.readySetName, socketId)) {
    throw new AckError(`socketId is not longer ready`);
  }

  subRedisClient.subscribe(getSocketChannel(socketId), (err, count) => {
    if (err) {
      console.error(`Failed to subscribe: %s`, err.message);
    } else {
      console.log(
        `Subscribed successfully! This client is currently subscribed to ${count} channels.`,
      );
    }
  });

  subRedisClient.on(`message`, (channel, message) => {
    if (channel == getSocketChannel(socketId)) {
      console.log(`socketId=${socketId} got a message=${message}`);
    }
  });

  const readySet = new Set(await mainRedisClient.smembers(common.readySetName));
  readySet.delete(socketId);

  if (readySet.size == 0) throw new AckError(`ready set is 0`);

  const relationShipScores = await getRelationshipScores(socketId, readySet);

  // select the otherId
  let otherId: string;
  if (relationShipScores.length == 0) {
    otherId = readySet.entries().next().value[0];
  } else {
    otherId = relationShipScores.reduce((a, b) => (b[1] > a[1] ? b : a))[0];
  }
  console.log(`otherId`, otherId);
};

const getRealtionshipScoreCacheKey = (socketId: string, otherId: string) => {
  return `relationship-score-${socketId}-${otherId}`;
};

const getRelationshipScores = async (
  socketId: string,
  readyset: Set<string>,
) => {
  const relationshipScoresMap = new Map<string, number>();

  // get values that are in cache
  // pop from the readySet if in cache
  readyset.forEach(async (otherId) => {
    const relationshipScore = parseInt(
      (await mainRedisClient.get(
        getRealtionshipScoreCacheKey(socketId, otherId),
      )) as string,
    );
    if (!relationshipScore) return;
    readyset.delete(otherId);
    relationshipScoresMap.set(otherId, relationshipScore);
  });

  // get relationship scores from neo4j
  const session = driver.session();
  const result = await session.run(
    `
    UNWIND $otherIds AS otherId
    MATCH (a { name: $socketId })-[r:KNOWS]->(b { name: otherId })
    RETURN r.score, a.name, b.name
    `,
    { socketId, otherIds: readyset },
  );
  await session.close();

  // write them to the cache
  // store them in map
  result.records.forEach(async (record) => {
    const score: number = record.get(`r.score`).properties.score;
    const a = record.get(`a.name`);
    const b = record.get(`b.name`);
    const cacheKey = getRealtionshipScoreCacheKey(a, b);
    await mainRedisClient.set(cacheKey, score, `EX`, 60);
    relationshipScoresMap.set(b, score);
  });

  return Array.from(relationshipScoresMap.entries());
};
