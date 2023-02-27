import { createAdapter } from '@socket.io/redis-adapter';
import * as dotenv from 'dotenv';
import express from 'express';
import { createServer } from 'http';
import Client from 'ioredis';
import { Server, Socket } from 'socket.io';
import { v4 as uuid } from 'uuid';
import * as common from 'react-video-call-common';
import { initializeApp } from 'firebase-admin/app';
import { throttle } from 'lodash';
import amqp from 'amqplib';

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
import { listenGlobalExceptions } from 'react-video-call-common';
import { auth_middleware } from './authentication';

const logger = common.getLogger();

const neo4jRpcClient = createNeo4jClient();

let rabbitConnection: amqp.Connection;
let rabbitChannel: amqp.Channel;

const connectRabbit = async () => {
  rabbitConnection = await amqp.connect(`amqp://rabbitmq`);
  rabbitChannel = await rabbitConnection.createChannel();
  await rabbitChannel.assertQueue(common.readyQueueName, { durable: true });
  logger.info(`rabbitmq connected`);
};

dotenv.config();

initializeApp();

const serverID = uuid();

let pubRedisClient: Client;
let subRedisClient: Client;
export let mainRedisClient: Client;

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: `*`,
    methods: [`GET`, `POST`],
  },
});

io.use(auth_middleware);

app.get(`/health`, (req, res) => {
  logger.debug(`got health check`);
  res.send(`Health is good.`);
});

io.on(`error`, (err) => {
  logger.error(`io err`, err);
});

io.on(`connection`, async (socket) => {
  const start_time = performance.now();
  logger.debug(
    `connected ${process.env.HOSTNAME} ${io.sockets.sockets.size} auth: ${socket.data.auth}`,
  );

  socket.on(`error`, (err) => {
    logger.error(`socket err`, err);
  });

  socket.on(`myping`, (arg, callback) => {
    try {
      if (callback != undefined) callback(arg);
    } catch (e) {
      logger.error(e);
    }
  });

  socket.on(`message`, (msg) => {
    console.log(`message:`, msg);
  });

  socket.on(`ready`, async (data, callback) => {
    //   await kafkaProducer.send({
    //   topic: common.readyTopicName,
    //   messages: [{ value: socket.id }],
    // });

    await mainRedisClient.sadd(common.readySetName, socket.data.auth);

    await rabbitChannel.sendToQueue(
      common.readyQueueName,
      Buffer.from(JSON.stringify([socket.data.auth])),
    );

    if (callback != undefined) {
      callback(`ready ack`);
    }
  });

  socket.on(`disconnect`, async () => {
    const duration = performance.now() - start_time;
    logger.debug(
      `disconnected ${process.env.HOSTNAME} #${
        io.sockets.sockets.size
      } duration: ${Math.round(duration / 1000)}`,
    );
    mainRedisClient.srem(common.activeSetName, socket.data.auth);
    mainRedisClient.srem(common.readySetName, socket.data.auth);
    pubRedisClient.publish(common.activeCountChannel, `change`);
  });

  socket.on(`client_host`, (value) => {
    socket.to(`room-${socket.id}`).emit(`client_guest`, value);
  });

  socket.on(`client_guest`, (value) => {
    socket.to(`room-${socket.id}`).emit(`client_host`, value);
  });

  socket.on(`icecandidate`, (value) => {
    socket.to(`room-${socket.id}`).emit(`icecandidate`, value);
  });

  await pubRedisClient.publish(common.activeCountChannel, `change`);

  socket.emit(`message`, `Hey from server :) I am ${serverID}.`);

  // setTimeout(() => {
  //   socket.timeout(1000).emit("myping", "hello", (err: any, response: any) => {
  //     if (err) {
  //       console.error("err", err);
  //     } else {
  //       // console.log("response", response);
  //     }
  //   });
  // }, 1000);

  await mainRedisClient.sadd(common.activeSetName, socket.data.auth);

  const createUserRequest = new CreateUserRequest();
  createUserRequest.setUserId(socket.data.auth);

  await neo4jRpcClient.createUser(
    createUserRequest,
    (error: any, response: any) => {
      if (!error) {
      } else {
        logger.error(`createUser error:`, error.message);
        socket.disconnect();
      }
    },
  );

  socket.emit(`established`, `established ack`);
});

export const getServer = async (listen: boolean) => {
  return await Promise.all([])
    .then(() => {
      mainRedisClient = new Client({
        host: `${process.env.REDIS_HOST || `redis`}`,
      });
      subRedisClient = new Client({
        host: `${process.env.REDIS_HOST || `redis`}`,
      });
      pubRedisClient = new Client({
        host: `${process.env.REDIS_HOST || `redis`}`,
      });
    })
    .then(async () => {
      await connectRabbit();
    })
    .then(() => {
      io.adapter(createAdapter(pubRedisClient, subRedisClient));
      if (listen) httpServer.listen(4000);
      logger.info(`server started`);
    })
    .then(async () => {
      const activeCountThrottle = throttle(async () => {
        const activeCount = await mainRedisClient.scard(common.activeSetName);
        logger.info(`activeCount #${activeCount}`);
        io.emit(`activeCount`, activeCount);
      }, 30000);

      await subRedisClient.subscribe(common.activeCountChannel);

      subRedisClient.on(`message`, async (channel) => {
        if (channel == common.activeCountChannel) await activeCountThrottle();
      });

      return io;
    });
};

if (require.main === module) {
  listenGlobalExceptions();
  getServer(true);
}
