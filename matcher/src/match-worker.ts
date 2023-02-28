import { createAdapter } from '@socket.io/redis-adapter';
import { createServer } from 'http';
import { Server } from 'socket.io';
import * as dotenv from 'dotenv';
import * as common from 'react-video-call-common';
import Client from 'ioredis';

import { v4 as uuid } from 'uuid';

import {
  Neo4jClient,
  grpc,
  CreateUserRequest,
  CreateMatchRequest,
  UpdateMatchRequest,
  CreateMatchResponse,
  CreateUserResponse,
  createNeo4jClient,
} from 'neo4j-grpc-common';

const logger = common.getLogger();

const neo4jRpcClient = createNeo4jClient();

const serverID = uuid();

import { connect, Channel, ConsumeMessage, Connection } from 'amqplib';

dotenv.config();

const matchTimeout = 5000;

let mainRedisClient: Client;
let pubRedisClient: Client;
let subRedisClient: Client;

const httpServer = createServer();
const io = new Server(httpServer, {});

let rabbitConnection: Connection;
let rabbitChannel: Channel;

export async function matchConsumer() {
  rabbitConnection = await connect(`amqp://rabbitmq`);
  rabbitChannel = await rabbitConnection.createChannel();
  await rabbitChannel.assertQueue(common.matchQueueName, {
    durable: true,
  });
  logger.info(`rabbitmq connected`);

  mainRedisClient = new Client({
    host: `${process.env.REDIS_HOST || `redis`}`,
  });
  pubRedisClient = new Client({
    host: `${process.env.REDIS_HOST || `redis`}`,
  });
  subRedisClient = new Client({
    host: `${process.env.REDIS_HOST || `redis`}`,
  });
  logger.info(`redis connected.`);

  io.adapter(createAdapter(pubRedisClient, subRedisClient));

  logger.info(`socket io connected`);

  rabbitChannel.prefetch(40);
  rabbitChannel.consume(
    common.matchQueueName,
    async (msg: ConsumeMessage | null) => {
      if (msg == null) {
        logger.error(`msg is null.`);
        return;
      }

      try {
        const msgContent: [string, string] = JSON.parse(msg.content.toString());

        const userId1 = msgContent[0];
        const userId2 = msgContent[1];

        logger.debug(`matching ${userId1} ${userId2}`);

        await match(userId1, userId2);
      } catch (e) {
        logger.debug(`matchEvent error=` + e);
      } finally {
        rabbitChannel.ack(msg);
      }
    },
    {
      noAck: false,
    },
  );
}

export const match = async (userId1: string, userId2: string) => {
  if (!userId1 || !userId2) {
    logger.error(`(!userId1 || !userId2) ${userId1} ${userId2}`);
    throw Error(`(!userId1 || !userId2) ${userId1} ${userId2}`);
  }
  logger.debug(`matching: ${userId1} ${userId2}`);

  const request = new CreateMatchRequest();

  request.setUserId1(userId1);
  request.setUserId2(userId2);

  const socket1 = await mainRedisClient.hget(
    common.connectedAuthMapName,
    userId1,
  );
  const socket2 = await mainRedisClient.hget(
    common.connectedAuthMapName,
    userId2,
  );

  if (!socket1 || !socket2) {
    logger.error(`(!socket1 || !socket2 ${socket1} ${socket2}`);
    throw Error(`!socket1 || !socket2 ${socket1} ${socket2}`);
  }

  io.socketsLeave(`room-${socket1}`);
  io.socketsLeave(`room-${socket2}`);

  io.in(socket1).socketsJoin(`room-${socket2}`);
  io.in(socket2).socketsJoin(`room-${socket1}`);

  io.in(socket1).emit(`message`, `pairing with ${socket2}`);
  io.in(socket2).emit(`message`, `pairing with ${socket1}`);

  const hostCallback = (resolve: any, reject: any) => {
    io.in(socket1)
      .timeout(matchTimeout)
      .emit(`match`, `host`, (err: any, response: any) => {
        if (err) {
          reject(`host: ${err.message}`);
        } else {
          resolve();
        }
      });
  };

  const guestCallback = (resolve: any, reject: any) => {
    io.in(socket2)
      .timeout(matchTimeout)
      .emit(`match`, `guest`, (err: any, response: any) => {
        if (err) {
          reject(`guest: ${err.message}`);
        } else {
          resolve();
        }
      });
  };

  return await new Promise(guestCallback)
    .then(() => {
      return new Promise(hostCallback);
    })
    .catch(async (error) => {
      logger.debug(`pairing failed with: ${error}`);
      if (await mainRedisClient.sismember(common.activeSetName, userId1)) {
        await mainRedisClient.sadd(common.readySetName, userId1);
        await rabbitChannel.sendToQueue(
          common.readyQueueName,
          Buffer.from(JSON.stringify([userId1])),
        );
      }
      if (await mainRedisClient.sismember(common.activeSetName, userId2)) {
        await mainRedisClient.sadd(common.readySetName, userId2);
        await rabbitChannel.sendToQueue(
          common.readyQueueName,
          Buffer.from(JSON.stringify([userId2])),
        );
      }
    })
    .then(async (data) => {
      // create match and supply feedback ids

      await neo4jRpcClient.createMatch(request, (error, response) => {
        if (error) {
          logger.error(`neo4j create match error: ${error}`);
          throw error;
        }
      });
    });
};

if (require.main === module) {
  matchConsumer();
}
