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
} from 'neo4j-grpc-common';

const logger = common.getLogger();

const neo4jRpcClient = createNeo4jClient();

import { connect, Channel, ConsumeMessage, Connection } from 'amqplib';
import { MatchMessage, ReadyMessage } from 'common';

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
  rabbitChannel.on(`error`, (err) => {
    logger.error(`Publisher error: ${err.message}`);
  });
  rabbitConnection.on(`error`, (err) => {
    logger.error(`Connection error: ${err.message}`);
  });

  await rabbitChannel.assertQueue(common.matchQueueName, {
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
    common.matchQueueName,
    async (msg: ConsumeMessage | null) => {
      if (msg == null) {
        logger.error(`msg is null.`);
        return;
      }

      let userId1: string = ``;
      let userId2: string = ``;

      try {
        const msgContent: MatchMessage = JSON.parse(msg.content.toString());
        userId1 = msgContent.userId1;
        userId2 = msgContent.userId2;

        await match(msgContent);
      } catch (e) {
        logger.debug(`matchEvent error=` + e); // TODO fix for types
        if (await mainRedisClient.sismember(common.activeSetName, userId1)) {
          await mainRedisClient.sadd(common.readySetName, userId1);

          await rabbitChannel.sendToQueue(
            common.matchmakerQueueName,
            Buffer.from(JSON.stringify({ userId: userId1 } as ReadyMessage)),
          );
        }
        if (await mainRedisClient.sismember(common.activeSetName, userId2)) {
          await mainRedisClient.sadd(common.readySetName, userId2);
          await rabbitChannel.sendToQueue(
            common.matchmakerQueueName,
            Buffer.from(JSON.stringify({ userId: userId2 } as ReadyMessage)),
          );
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
  if (!msgContent.userId1 || !msgContent.userId2 || msgContent.score == null) {
    logger.error(`MatchMessage is missing data ${JSON.stringify(msgContent)}`);
    throw Error(`MatchMessage is missing data ${JSON.stringify(msgContent)}`);
  }
  const userId1 = msgContent.userId1;
  const userId2 = msgContent.userId2;
  const score = msgContent.score;
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
    logger.error(`(!socket1 || !socket2 ${socket1} ${socket2}`);
    throw Error(`!socket1 || !socket2 ${socket1} ${socket2}`);
  }

  io.socketsLeave(`room-${socket1}`);
  io.socketsLeave(`room-${socket2}`);

  io.in(socket1).socketsJoin(`room-${socket2}`);
  io.in(socket2).socketsJoin(`room-${socket1}`);

  io.in(socket1).emit(`message`, `1pairing with ${socket2}`);
  io.in(socket2).emit(`message`, `2pairing with ${socket1}`);

  const matchPromiseChain = async (): Promise<any> => {
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

if (require.main === module) {
  matchConsumer();
}
