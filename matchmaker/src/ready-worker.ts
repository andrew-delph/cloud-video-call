import { connect, ConsumeMessage } from 'amqplib';
import * as common from 'react-video-call-common';
import { v4 as uuid } from 'uuid';
import * as neo4j from 'neo4j-driver';
import Client from 'ioredis';
import Redlock, { ResourceLockedError } from 'redlock';
import amqp from 'amqplib';

const serverID = uuid();

let mainRedisClient: Client;
let subRedisClient: Client;
let lockRedisClient: Client;

const driver = neo4j.driver(
  `neo4j://neo4j:7687`,
  neo4j.auth.basic(`neo4j`, `password`),
);

let rabbitConnection: amqp.Connection;
let rabbitChannel: amqp.Channel;

const connectRabbit = async () => {
  rabbitConnection = await amqp.connect(`amqp://rabbitmq`);
  rabbitChannel = await rabbitConnection.createChannel();
  await rabbitChannel.assertQueue(common.matchQueueName, { durable: true });
  console.log(`rabbit connected`);
};

export const startReadyConsumer = async () => {
  await connectRabbit();

  mainRedisClient = new Client({
    host: `${process.env.REDIS_HOST || `redis`}`,
  });

  subRedisClient = new Client({
    host: `${process.env.REDIS_HOST || `redis`}`,
  });

  lockRedisClient = new Client({
    host: `${process.env.REDIS_HOST}`,
  });

  // rabbitChannel.prefetch(5);
  console.log(` [x] Awaiting RPC requests`);

  rabbitChannel.consume(
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
        rabbitChannel.ack(msg);
      }

      try {
        await matchmakerFlow(socketId);
        rabbitChannel.ack(msg);
      } catch (e: any) {
        if (e instanceof AckError) {
          rabbitChannel.ack(msg);
        } else if (e instanceof NackError) {
          rabbitChannel.ack(msg);
        } else {
          console.error(`Unknown error: ${e}`);
          console.error(e.stack);
          process.exit(1);
        }
      } finally {
        // rabbitChannel.ack(msg);
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

class NackError extends Error {
  constructor(message: string) {
    super(message);
  }
}

const getSocketChannel = (socketId: string) => {
  return `matchmacker${socketId}`;
};

const matchmakerFlow = async (socketId: string) => {
  // TODO publish messages
  // TODO add clean up functions as argument for try/finally

  if (!(await mainRedisClient.smismember(common.readySetName, socketId))[0]) {
    throw new AckError(`socketId is no longer ready`);
  }

  await subRedisClient.subscribe(getSocketChannel(socketId));

  subRedisClient.on(`message`, (channel, message) => {
    if (channel == getSocketChannel(socketId)) {
      console.log(`socketId=${socketId} got a message=${message}`);
    }
  });

  // TODO push socketID event

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
  // console.log(`otherId`, otherId);

  await subRedisClient.subscribe(getSocketChannel(otherId));

  subRedisClient.on(`message`, (channel, message) => {
    if (channel == getSocketChannel(otherId)) {
      console.log(`socketId=${socketId} got a message=${message}`);
    }
  });

  // TODO push otherId event

  const redlock = new Redlock([lockRedisClient]);
  // console.log(`before lock`, socketId, otherId);

  await redlock.using([socketId, otherId, `test`], 5000, async (signal) => {
    // make sure both are in the set
    if (!(await mainRedisClient.smismember(common.readySetName, socketId))[0]) {
      throw new AckError(`socketId is no longer ready`);
    }
    if (!(await mainRedisClient.smismember(common.readySetName, otherId))[0]) {
      throw new NackError(`otherId is no longer ready`);
    }

    // remove both from ready set
    await mainRedisClient.srem(common.readySetName, socketId);
    await mainRedisClient.srem(common.readySetName, otherId);

    // send to matcher

    await rabbitChannel.sendToQueue(
      common.matchQueueName,
      Buffer.from(JSON.stringify([socketId, otherId])),
    );
    await common.delay(10000);
  });
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
