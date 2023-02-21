import { createAdapter } from '@socket.io/redis-adapter';
import * as dotenv from 'dotenv';
import express from 'express';
import { createServer } from 'http';
import Client from 'ioredis';
import { Server } from 'socket.io';
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

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: `*`,
    methods: [`GET`, `POST`],
  },
});

let pubClient: Client;
let subClient: Client;
let mainClient: Client;

setInterval(async () => {
  logger.error(`test test`);
}, 5000);

setInterval(async () => {
  logger.info(`test test`);
}, 2000);

setInterval(async () => {
  logger.warn(`test test`);
}, 1000);

app.get(`*`, (req, res) => {
  res.send(`This is the API server :)`);
});

io.on(`error`, (err) => {
  logger.error(`io err`, err);
});

io.on(`connection`, async (socket) => {
  socket.on(`error`, (err) => {
    logger.error(`socket err`, err);
  });

  socket.on(`myping`, (arg, callback) => {
    // console.log("myping", arg, callback);
    try {
      if (callback != undefined) callback(`ping ding dong`);
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

    await mainClient.sadd(common.readySetName, socket.id);

    await rabbitChannel.sendToQueue(
      common.readyQueueName,
      Buffer.from(JSON.stringify([socket.id])),
    );

    if (callback != undefined) {
      callback();
    }
  });

  // let updateCount = 0;
  // const myInterval = setInterval(async () => {
  //   updateCount = updateCount + 1;
  //   socket.emit("message", `updateCount: ${updateCount}`);
  // }, 5000);

  socket.on(`disconnect`, async () => {
    // console.log("disconnected");
    // clearInterval(myInterval);
    mainClient.srem(common.activeSetName, socket.id);
    mainClient.srem(common.readySetName, socket.id);
    pubClient.publish(common.activeCountChannel, `change`);
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

  await pubClient.publish(common.activeCountChannel, `change`);

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

  await mainClient.sadd(common.activeSetName, socket.id);

  const createUserRequest = new CreateUserRequest();
  createUserRequest.setUserId(socket.id);

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
});

export const getServer = async (listen: boolean) => {
  return await Promise.all([])
    .then(() => {
      mainClient = new Client({
        host: `${process.env.REDIS_HOST || `redis`}`,
      });
      subClient = new Client({
        host: `${process.env.REDIS_HOST || `redis`}`,
      });
      pubClient = new Client({
        host: `${process.env.REDIS_HOST || `redis`}`,
      });
    })
    .then(async () => {
      await connectRabbit();
    })
    .then(() => {
      io.adapter(createAdapter(pubClient, subClient));
      if (listen) httpServer.listen(4000);
      logger.info(`server started`);
    })
    .then(async () => {
      const activeCountThrottle = throttle(async () => {
        const activeCount = await mainClient.scard(common.activeSetName);
        logger.info(`activeCount #${activeCount}`);
        io.emit(`activeCount`, activeCount);
      }, 30000);

      await subClient.subscribe(common.activeCountChannel);

      subClient.on(`message`, async (channel) => {
        if (channel == common.activeCountChannel) await activeCountThrottle();
      });

      return io;
    });
};

if (require.main === module) {
  listenGlobalExceptions();
  getServer(true);
}
