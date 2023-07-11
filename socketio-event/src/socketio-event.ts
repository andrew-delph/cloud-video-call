import { iceServers, loadIceServers } from './iceservers';
import { addNotification } from './notifications';
import { createAdapter } from '@socket.io/redis-adapter';
import { connect, Channel, ConsumeMessage, Connection } from 'amqplib';
import axios from 'axios';
import * as common from 'common';
import {
  Neo4jClient,
  grpc,
  CreateUserRequest,
  CreateMatchRequest,
  CreateMatchResponse,
  CreateUserResponse,
  createNeo4jClient,
  matchQueueName,
  matchmakerQueueName,
  MatchMessage,
  userMessageQueue,
  userNotificationQueue,
  chatEventQueue,
  makeGrpcRequest,
  GetUserPerferencesRequest,
  GetUserPerferencesResponse,
  CheckUserFiltersResponse,
  CheckUserFiltersRequest,
  FilterObject,
} from 'common-messaging';
import {
  parseChatEventMessage,
  parseMatchMessage,
  parseUserNotificationMessage,
  parseUserSocketMessage,
  sendReadyQueue,
  sendUserNotification,
} from 'common-messaging/src/message_helper';
import * as dotenv from 'dotenv';
import express from 'express';
import { createServer } from 'http';
import Client from 'ioredis';
import { Server } from 'socket.io';
import { v4 as uuid } from 'uuid';

const prom = common.prom;
const logger = common.getLogger();

const promClient = new common.PromClient(`socketio-event`);

common.listenGlobalExceptions(async () => {
  logger.debug(`clean up socketio-event`);
  promClient.stop();
});

promClient.startPush();

dotenv.config();

const port = 80;
const app = express();

app.get(`/health`, (req, res) => {
  logger.debug(`got health check`);
  res.send(`Health is good.`);
});

const neo4jRpcClient = createNeo4jClient();

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

  await rabbitChannel.assertQueue(userMessageQueue, {
    durable: true,
  });

  await rabbitChannel.assertQueue(userNotificationQueue, {
    durable: true,
  });

  await rabbitChannel.assertQueue(chatEventQueue, {
    durable: true,
  });

  logger.info(`rabbitmq connected`);

  mainRedisClient = common.createRedisClient();
  pubRedisClient = common.createRedisClient();
  subRedisClient = common.createRedisClient();

  logger.info(`redis connected.`);

  await loadIceServers();

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

  rabbitChannel.consume(
    userMessageQueue,
    async (msg: ConsumeMessage | null) => {
      if (msg == null) {
        logger.error(`msg is null.`);
        return;
      }

      let userId: string = ``;
      let eventName: string = ``;
      let jsonData: string = ``;

      try {
        const msgContent = parseUserSocketMessage(msg.content);
        userId = msgContent.getUserId();
        eventName = msgContent.getEventName();
        jsonData = msgContent.getJsonData();

        const socket = await mainRedisClient.hget(
          common.connectedAuthMapName,
          userId,
        );

        if (!userId || !eventName || !jsonData) {
          const msg = `!userId ${userId} || !eventName ${eventName}|| !jsonData ${jsonData}`;
          logger.error(msg);
          throw Error(
            `!userId ${userId} || !eventName ${eventName}|| !jsonData ${jsonData}`,
          );
        }

        if (!socket) {
          throw Error(`userId ${userId} socket is null`);
        }

        logger.debug(
          `UserSocketMessage: userid ${userId}, eventName: ${eventName}`,
        );

        io.in(socket).emit(eventName, JSON.parse(jsonData));
      } catch (e) {
        logger.debug(`userMessage error=` + e); // TODO fix for types
      } finally {
        rabbitChannel.ack(msg);
      }
    },
    {
      noAck: false,
    },
  );

  rabbitChannel.consume(
    userNotificationQueue,
    async (msg: ConsumeMessage | null) => {
      if (msg == null) {
        logger.error(`msg is null.`);
        return;
      }

      let userId: string = ``;
      let title: string = ``;
      let description: string = ``;

      try {
        const msgContent = parseUserNotificationMessage(msg.content);
        userId = msgContent.getUserId();
        title = msgContent.getTitle();
        description = msgContent.getDescription();

        logger.debug(
          `UserNotificationMessage ${userId}, ${title}, ${description}`,
        );

        await addNotification(userId, title, description);
      } catch (e) {
        logger.error(`userNotification error=` + e); // TODO fix for types
      } finally {
        rabbitChannel.ack(msg);
      }
    },
    {
      noAck: false,
    },
  );

  rabbitChannel.consume(
    chatEventQueue,
    async (msg: ConsumeMessage | null) => {
      if (msg == null) {
        logger.error(`msg is null.`);
        return;
      }

      let source: string;
      let target: string;
      let message: string;
      let system: boolean;

      try {
        const msgContent = parseChatEventMessage(msg.content);
        source = msgContent.getSource();
        target = msgContent.getTarget();
        message = msgContent.getMessage();
        system = msgContent.getSystem();

        logger.debug(
          `ChatEventMessage ${source}, ${target}, ${system}, ${message}`,
        );

        if (!message) {
          logger.debug(
            `UPDATE READ STATUS ${source}, ${target}, ${system}, ${message}`,
          );
          await common.setChatRead(mainRedisClient, source, target, true);
          return;
        }

        if (!system) {
          const checkUserFiltersRequest = new CheckUserFiltersRequest();

          const filter = new FilterObject();
          filter.setUserId1(source);
          filter.setUserId2(target);

          checkUserFiltersRequest.addFilters(filter);

          const checkUserFiltersResponse = await makeGrpcRequest<
            CheckUserFiltersRequest,
            CheckUserFiltersResponse
          >(
            neo4jRpcClient,
            neo4jRpcClient.checkUserFilters,
            checkUserFiltersRequest,
          );

          const filterResponse = checkUserFiltersResponse.getFiltersList()[0];

          if (!filterResponse.getFriends()) {
            logger.warn(
              `Message sent not friends: ${source}, ${target}, ${message} filterResponse= ${JSON.stringify(
                checkUserFiltersResponse.toObject(),
              )}`,
            );
            throw `not friends`;
          }
        }

        const chatMessage = await common.appendChat(
          mainRedisClient,
          source,
          target,
          message,
          system,
        );

        await mainRedisClient
          .hget(common.connectedAuthMapName, target)
          .then(async (targetSocket) => {
            if (!targetSocket) throw `targetSocket is null`;
            await io
              .in(targetSocket)
              .timeout(3000)
              .emitWithAck(`chat`, chatMessage);
            await common.setChatRead(mainRedisClient, target, source, true);
            io.in(targetSocket).socketsJoin(common.chatActivityRoom(source));
          })
          .catch(async (err) => {
            await common.setChatRead(mainRedisClient, target, source, false);
            if (!system) {
              await sendUserNotification(
                rabbitChannel,
                target,
                `Unread Message`,
                `Messages from ${target}`,
              );
            }
          });

        if (system) {
          await mainRedisClient
            .hget(common.connectedAuthMapName, source)
            .then(async (sourceSocket) => {
              if (!sourceSocket) throw `sourceSocket is null`;
              await io
                .in(sourceSocket)
                .timeout(3000)
                .emitWithAck(`chat`, chatMessage);
              await common.setChatRead(mainRedisClient, source, target, true);
              io.in(sourceSocket).socketsJoin(common.chatActivityRoom(target));
            })
            .catch(async (err) => {
              await common.setChatRead(mainRedisClient, source, target, false);
            });
        }
      } catch (e) {
        logger.error(`ChatEventMessage error=` + e); // TODO fix for types
      } finally {
        rabbitChannel.ack(msg);
      }
    },
    {
      noAck: false,
    },
  );

  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
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

    const matchResponse = await makeGrpcRequest<
      CreateMatchRequest,
      CreateMatchResponse
    >(neo4jRpcClient, neo4jRpcClient.createMatch, request).catch((error) => {
      logger.error(`createMatch: ${error}`);
      throw Error(error);
    });

    const hostApproval = (resolve: any, reject: any) => {
      io.in(socket1)
        .timeout(matchTimeout * 2)
        .emit(
          `match`,
          {
            approve: userId2,
          },
          (err: any, response: any[]) => {
            if (err) {
              reject(`Approval timeout.`);
            } else {
              const approved = response.length > 0 && response[0].approve;
              if (approved) {
                resolve();
              } else {
                reject(`Rejected.`);
              }
              logger.debug(
                `got approval from: ${userId2} response ${JSON.stringify(
                  response,
                )} approved ${approved}`,
              );
            }
          },
        );
    };

    const guestApproval = (resolve: any, reject: any) => {
      io.in(socket2)
        .timeout(matchTimeout * 2)
        .emit(
          `match`,
          {
            approve: userId1,
          },
          (err: any, response: any[]) => {
            if (err) {
              reject(`Approval timeout.`);
            } else {
              const approved = response.length > 0 && response[0].approve;
              if (approved) {
                resolve();
              } else {
                reject(`Rejected.`);
              }
              logger.debug(
                `got approval from: ${userId2} response ${JSON.stringify(
                  response,
                )} approved ${approved}`,
              );
            }
          },
        );
    };

    const hostCallback = (resolve: any, reject: any) => {
      io.in(socket1)
        .timeout(matchTimeout)
        .emit(
          `match`,
          {
            role: `host`,
            match_id: matchResponse.getMatchId1(),
            other: userId2,
            score: score,
            iceServers: iceServers,
          },
          (err: any, response: any) => {
            if (err) {
              reject(`Failed to initated match.`);
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
            match_id: matchResponse.getMatchId2(),
            other: userId1,
            score: score,
            iceServers: iceServers,
          },
          (err: any, response: any) => {
            if (err) {
              reject(`Failed to initated match.`);
            } else {
              resolve();
            }
          },
        );
    };

    return Promise.all([new Promise(hostApproval), new Promise(guestApproval)])
      .then(async () => {
        return await new Promise(guestCallback);
      })
      .then(async () => {
        return await new Promise(hostCallback);
      });
  };

  return await matchPromiseChain()
    .then(async () => {
      io.in(socket1).emit(`match`, { success: true });
      io.in(socket2).emit(`match`, { success: true });
    })
    .catch(async (error: any) => {
      const errorMsg = `${error}`;
      logger.debug(errorMsg);
      io.in(socket1).emit(`match`, { success: false, error_msg: errorMsg });
      io.in(socket2).emit(`match`, { success: false, error_msg: errorMsg });
      throw Error(errorMsg);
    });
};

matchConsumer();
