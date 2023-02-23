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

import { connect, Channel, ConsumeMessage } from 'amqplib';

dotenv.config();

const matchTimeout = 50000;

let pubRedisClient: Client;
let subRedisClient: Client;

const httpServer = createServer();
const io = new Server(httpServer, {});

export async function matchConsumer() {
  const connection = await connect(`amqp://rabbitmq`);
  const channel = await connection.createChannel();
  await channel.assertQueue(common.matchQueueName, {
    durable: true,
  });
  logger.info(`rabbitmq connected`);

  pubRedisClient = new Client({
    host: `${process.env.REDIS_HOST || `redis`}`,
  });
  subRedisClient = new Client({
    host: `${process.env.REDIS_HOST || `redis`}`,
  });
  logger.info(`redis connected.`);

  io.adapter(createAdapter(pubRedisClient, subRedisClient));

  logger.info(`socket io connected`);

  // channel.prefetch(500);
  channel.consume(
    common.matchQueueName,
    async (msg: ConsumeMessage | null) => {
      if (msg == null) {
        logger.error(`msg is null.`);
        return;
      }

      try {
        const msgContent: [string, string] = JSON.parse(msg.content.toString());

        const socket1 = msgContent[0];
        const socket2 = msgContent[1];

        await match(socket1, socket2);
      } catch (e) {
        logger.debug(`matchEvent error=` + e);
      } finally {
        channel.ack(msg);
      }
    },
    {
      noAck: false,
    },
  );
}

export const match = async (socket1: string, socket2: string) => {
  if (!socket1 || !socket2) {
    logger.error(`(!socket1 || !socket2) ${socket1} ${socket2}`);
    throw Error(`(!socket1 || !socket2) ${socket1} ${socket2}`);
  }
  logger.debug(`matching: ${socket1} ${socket2}`);

  const request = new CreateMatchRequest();

  request.setUserId1(socket1);
  request.setUserId2(socket2);

  await neo4jRpcClient.createMatch(request, (error, response) => {
    if (error) {
      logger.error(`neo4j create match error: ${error}`);
      throw error;
    }
  });

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
    .then(() => {
      // console.log(`match success: ${socket1} ${socket2}`);
    })
    .catch((error) => {
      logger.debug(`host paring failed: ${error}`);
      io.in(socket1).emit(`message`, `host paring: failed with ${error}`);
      io.in(socket2).emit(`message`, `guest paring: failed with ${error}`);
      throw `match failed with \t ${error}`;
    });
  // .finally(() => {
  //   console.log(`finally :)`);
  // });
};

if (require.main === module) {
  matchConsumer();
}
