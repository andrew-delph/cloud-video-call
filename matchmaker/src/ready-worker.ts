import { connect, ConsumeMessage } from 'amqplib';
import * as common from 'react-video-call-common';
import { v4 as uuid } from 'uuid';
import Client from 'ioredis';
import Redlock, { ResourceLockedError, ExecutionError } from 'redlock';
import amqp from 'amqplib';

import {
  Neo4jClient,
  grpc,
  CreateUserRequest,
  CreateMatchRequest,
  UpdateMatchRequest,
  CreateMatchResponse,
  CreateUserResponse,
} from 'neo4j-grpc-common';

const neo4jRpcClientHost =
  process.env.NEO4J_GRPC_SERVER_HOST || `neo4j-grpc-server:8080`;

const neo4jRpcClient = new Neo4jClient(
  neo4jRpcClientHost,
  grpc.credentials.createInsecure(),
);

const serverID = uuid();

let mainRedisClient: Client;
let subRedisClient: Client;
let pubRedisClient: Client;
let lockRedisClient: Client;

let rabbitConnection: amqp.Connection;
let rabbitChannel: amqp.Channel;

const connectRabbit = async () => {
  rabbitConnection = await amqp.connect(`amqp://rabbitmq`);
  rabbitChannel = await rabbitConnection.createChannel();
  await rabbitChannel.assertQueue(common.matchQueueName, { durable: true });
  console.log(`rabbit connected`);
};

const matchmakerChannelPrefix = `matchmaker`;

export const startReadyConsumer = async () => {
  await connectRabbit();

  mainRedisClient = new Client({
    host: `${process.env.REDIS_HOST || `redis`}`,
  });

  subRedisClient = new Client({
    host: `${process.env.REDIS_HOST || `redis`}`,
  });

  pubRedisClient = new Client({
    host: `${process.env.REDIS_HOST || `redis`}`,
  });

  lockRedisClient = new Client({
    host: `${process.env.REDIS_HOST}`,
  });

  await subRedisClient.psubscribe(`${matchmakerChannelPrefix}*`);

  rabbitChannel.prefetch(1);
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

      const cleanup: (() => void)[] = [];
      try {
        await matchmakerFlow(socketId, 1, cleanup);
        rabbitChannel.ack(msg);
      } catch (e: any) {
        if (e instanceof CompleteError) {
          // console.log(`CompleteError:\t ${e.message}`);
          rabbitChannel.ack(msg);
        } else if (e instanceof RetryError) {
          console.log(`RetryError: \t ${socketId} \t ${e.message}`);

          // TODO change to delay with rabbitmq
          await common.delay(5000); // hold 5 seconds before retry
          rabbitChannel.nack(msg);
        } else {
          console.log(`!!!!!!!!!!!!!!!!!!!!!!!!!!!!`);
          console.error(`Unknown error: ${e}`);
          console.error(e.stack);
          process.exit(1);
        }
      } finally {
        cleanup.forEach((cleanupFunc) => {
          cleanupFunc();
        });
      }
    },
    {
      noAck: false,
    },
  );
};

class CompleteError extends Error {
  constructor(message: string) {
    super(message);
  }
}

class RetryError extends Error {
  constructor(message: string) {
    super(message);
  }
}

class RetrySignal {
  signal = ``;
  setSignal(msg: string) {
    this.signal = msg;
  }
  checkSignal() {
    if (this.signal) throw new RetryError(this.signal);
  }
}

const getSocketChannel = (socketId: string) => {
  return `${matchmakerChannelPrefix}${socketId}`;
};

const matchmakerFlow = async (
  socketId: string,
  priority: number,
  cleanup: (() => void)[],
) => {
  // TODO publish messages

  const retrySignal = new RetrySignal();

  if (!(await mainRedisClient.smismember(common.readySetName, socketId))[0]) {
    throw new CompleteError(`no longer ready: ${socketId}`);
  }

  const notifyListeners = async (targetId: string) => {
    const msg = { priority, owner: socketId };
    await pubRedisClient.publish(
      getSocketChannel(targetId),
      JSON.stringify(msg),
    );
  };

  const registerSubscriptionListener = (targetId: string) => {
    const listener = async (
      pattern: string,
      channel: string,
      message: string,
    ) => {
      if (channel == getSocketChannel(targetId)) {
        let msg;
        try {
          msg = JSON.parse(message);
        } catch (e) {
          console.error(e);
          return;
        }
        if (!msg.priority || !msg.owner) {
          console.error(`!msg.priority || !msg.owner`);
          return;
        }

        if (msg.owner == socketId) {
          // ignore messages from outself
          return;
        } else if (msg.priority > priority) {
          retrySignal.setSignal(`higher priority for ${targetId}`);
        } else if (msg.priority == priority && msg.owner > socketId) {
          retrySignal.setSignal(`higher priority for ${targetId}`);
        } else {
          await notifyListeners(targetId);
        }
      }
    };

    cleanup.push(() => {
      subRedisClient.off(`pmessage`, listener);
    });
    subRedisClient.on(`pmessage`, listener);
  };

  // listen and publish on socketID
  registerSubscriptionListener(socketId);
  await notifyListeners(socketId);

  const readySet = new Set(await mainRedisClient.smembers(common.readySetName));
  readySet.delete(socketId);

  if (readySet.size == 0) throw new RetryError(`ready set is 0`);

  const relationShipScores = await getRelationshipScores(socketId, readySet);

  // select the otherId
  let otherId: string;
  if (relationShipScores.length == 0) {
    const randomIndex = Math.floor(Math.random() * readySet.size);
    otherId = Array.from(readySet)[randomIndex];
  } else {
    otherId = relationShipScores.reduce((a, b) => (b[1] > a[1] ? b : a))[0];
  }
  // listen and publish on otherId
  registerSubscriptionListener(otherId);
  await notifyListeners(otherId);

  // await common.delay(1000); // Give tasks events 1 second

  const redlock = new Redlock([lockRedisClient]);
  const onError = (e: any) => {
    if (e instanceof ResourceLockedError) {
      throw new RetryError(e.message);
    } else if (e instanceof ExecutionError) {
      throw new RetryError(e.message);
    }
    throw e;
  };

  retrySignal.checkSignal();

  await redlock
    .using([socketId, otherId], 5000, async (signal) => {
      // make sure both are in the set
      if (
        !(await mainRedisClient.smismember(common.readySetName, socketId))[0]
      ) {
        throw new CompleteError(`socketId is no longer ready`);
      }
      if (
        !(await mainRedisClient.smismember(common.readySetName, otherId))[0]
      ) {
        throw new RetryError(`otherId is no longer ready`);
      }

      // remove both from ready set
      await mainRedisClient.srem(common.readySetName, socketId);
      await mainRedisClient.srem(common.readySetName, otherId);

      // send to matcher

      await rabbitChannel.sendToQueue(
        common.matchQueueName,
        Buffer.from(JSON.stringify([socketId, otherId])),
      );
    })
    .catch(onError);
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

  // TODO REPLACE WITH CLIENT CALL

  // const session = driver.session();
  // const result = await session.run(
  //   `
  //   UNWIND $otherIds AS otherId
  //   MATCH (a { name: $socketId })-[r:KNOWS]->(b { name: otherId })
  //   RETURN r.score, a.name, b.name
  //   `,
  //   { socketId, otherIds: readyset },
  // );
  // await session.close();

  // // write them to the cache
  // // store them in map
  // result.records.forEach(async (record) => {
  //   const score: number = record.get(`r.score`).properties.score;
  //   const a = record.get(`a.name`);
  //   const b = record.get(`b.name`);
  //   const cacheKey = getRealtionshipScoreCacheKey(a, b);
  //   await mainRedisClient.set(cacheKey, score, `EX`, 60);
  //   relationshipScoresMap.set(b, score);
  // });

  return Array.from(relationshipScoresMap.entries());
};

const errorTypes = [`unhandledRejection`, `uncaughtException`];
const signalTraps = [`SIGTERM`, `SIGINT`, `SIGUSR2`];

errorTypes.forEach((type) => {
  process.on(type, async () => {
    try {
      console.log(`process.on ${type}`);
      process.exit(0);
    } catch (_) {
      process.exit(1);
    }
  });
});

signalTraps.forEach((type) => {
  process.once(type, async () => {
    try {
    } finally {
      process.kill(process.pid, type);
    }
  });
});

if (require.main === module) {
  startReadyConsumer();
}
