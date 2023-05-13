import { createAdapter } from '@socket.io/redis-adapter';
import { createServer } from 'http';
import { Server } from 'socket.io';
import * as dotenv from 'dotenv';
import * as common from 'common';
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
  matchQueueName,
  matchmakerQueueName,
  MatchMessage,
} from 'common-messaging';
import express from 'express';

common.listenGlobalExceptions(async () => {
  logger.debug(`clean up matcher`);
});

const logger = common.getLogger();

const port = 80;
const app = express();
app.get(`/health`, (req, res) => {
  logger.debug(`got health check`);
  res.send(`Health is good.`);
});
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

const neo4jRpcClient = createNeo4jClient();

import { connect, Channel, ConsumeMessage, Connection } from 'amqplib';
import {
  parseMatchMessage,
  sendReadyQueue,
} from 'common-messaging/src/message_helper';

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
  [rabbitConnection, rabbitChannel] = await common.createRabbitMQClient();

  await rabbitChannel.assertQueue(matchQueueName, {
    durable: true,
  });
  logger.info(`rabbitmq connected`);

  mainRedisClient = common.createRedisClient();
  pubRedisClient = common.createRedisClient();
  subRedisClient = common.createRedisClient();

  logger.info(`redis connected.`);

  io.adapter(createAdapter(pubRedisClient, subRedisClient));

  logger.info(`socket io connected`);

  rabbitChannel.prefetch(40);
  rabbitChannel.consume(
    matchQueueName,
    async (msg: ConsumeMessage | null) => {
      if (msg == null) {
        logger.error(`msg is null.`);
        return;
      }

      let userId1: string = ``;
      let userId2: string = ``;

      try {
        const msgContent = parseMatchMessage(msg.content);
        userId1 = msgContent.getUserId1();
        userId2 = msgContent.getUserId2();

        await match(msgContent);
      } catch (e) {
        logger.debug(`matchEvent error=` + e); // TODO fix for types
        if (await mainRedisClient.sismember(common.activeSetName, userId1)) {
          await mainRedisClient.sadd(common.readySetName, userId1);

          await sendReadyQueue(rabbitChannel, userId1, 0, 0, 0);
        }
        if (await mainRedisClient.sismember(common.activeSetName, userId2)) {
          await mainRedisClient.sadd(common.readySetName, userId2);

          await sendReadyQueue(rabbitChannel, userId2, 0, 0, 0);
        }
      } finally {
        rabbitChannel.ack(msg);
      }
    },
    {
      noAck: false,
    },
  );
}

export const match = async (msgContent: MatchMessage) => {
  if (
    !msgContent.getUserId1() ||
    !msgContent.getUserId2() ||
    msgContent.getScore() == null
  ) {
    logger.error(`MatchMessage is missing data ${JSON.stringify(msgContent)}`);
    throw Error(`MatchMessage is missing data ${JSON.stringify(msgContent)}`);
  }
  const userId1 = msgContent.getUserId1();
  const userId2 = msgContent.getUserId2();
  const score = msgContent.getScore();
  logger.debug(`matching users: [${userId1}, ${userId2}] score: ${score}`);

  const socket1 = await mainRedisClient.hget(
    common.connectedAuthMapName,
    userId1,
  );
  const socket2 = await mainRedisClient.hget(
    common.connectedAuthMapName,
    userId2,
  );

  if (!socket1 || !socket2) {
    logger.error(`!socket1 || !socket2 ${socket1} ${socket2}`);
    throw Error(`!socket1 || !socket2 ${socket1} ${socket2}`);
  }

  io.socketsLeave(`room-${socket1}`);
  io.socketsLeave(`room-${socket2}`);

  io.in(socket1).socketsJoin(`room-${socket2}`);
  io.in(socket2).socketsJoin(`room-${socket1}`);

  io.in(socket1).emit(`message`, `1pairing with ${socket2}`);
  io.in(socket2).emit(`message`, `2pairing with ${socket1}`);

  const matchPromiseChain = async (): Promise<void> => {
    const request = new CreateMatchRequest();

    request.setUserId1(userId1);
    request.setUserId2(userId2);

    const matchResponse = await new Promise<CreateMatchResponse>(
      async (resolve: any, reject: any) => {
        try {
          await neo4jRpcClient.createMatch(request, (error, response) => {
            if (error) {
              logger.error(`neo4j create match error: ${error}`);
              reject(error);
            } else if (
              !response.getRelationshipId1() ||
              !response.getRelationshipId2()
            ) {
              reject(
                `!matchResponse.getRelationshipId1() || !matchResponse.getRelationshipId2()`,
              );
            } else {
              resolve(response);
            }
          });
        } catch (e) {
          reject(e);
        }
      },
    ).catch((error) => {
      logger.error(`createMatch: ${error}`);
      throw error;
    });

    const hostCallback = (resolve: any, reject: any) => {
      io.in(socket1)
        .timeout(matchTimeout)
        .emit(
          `match`,
          {
            role: `host`,
            feedback_id: matchResponse.getRelationshipId1(),
            other: userId2,
            score: score,
          },
          (err: any, response: any) => {
            if (err) {
              reject(`host: ${err.message}`);
            } else {
              resolve();
            }
          },
        );
    };

    const guestCallback = (resolve: any, reject: any) => {
      io.in(socket2)
        .timeout(matchTimeout)
        .emit(
          `match`,
          {
            role: `guest`,
            feedback_id: matchResponse.getRelationshipId2(),
            other: userId1,
            score: score,
          },
          (err: any, response: any) => {
            if (err) {
              reject(`guest: ${err.message}`);
            } else {
              resolve();
            }
          },
        );
    };

    return await new Promise(guestCallback).then(async () => {
      return await new Promise(hostCallback);
    });
  };

  return await matchPromiseChain()
    .catch(async (error: any) => {
      logger.debug(`pairing failed with: ${error}`);
      throw `pairing failed with: ${error}`;
    })
    .then(async () => {
      logger.debug(`match sucessful ${[userId1, userId2]}`);
    });
};

matchConsumer();
