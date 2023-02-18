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

const neo4jRpcClient = createNeo4jClient();

let rabbitConnection: amqp.Connection;
let rabbitChannel: amqp.Channel;

const connectRabbit = async () => {
  rabbitConnection = await amqp.connect(`amqp://rabbitmq`);
  rabbitChannel = await rabbitConnection.createChannel();
  await rabbitChannel.assertQueue(common.readyQueueName, { durable: true });
  console.log(`rabbitmq connected`);
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

app.get(`*`, (req, res) => {
  res.send(`This is the API server :)`);
});

io.on(`error`, (err) => {
  console.log(`io err`, err);
});

io.on(`connection`, async (socket) => {
  socket.on(`error`, (err) => {
    console.log(`socket err`, err);
  });

  socket.on(`myping`, (arg, callback) => {
    // console.log("myping", arg, callback);
    try {
      if (callback != undefined) callback(`ping ding dong`);
    } catch (e) {
      console.error(e);
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

    rabbitChannel.sendToQueue(
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
        console.error(`Error:`, error.message);
        socket.disconnect();
      }
    },
  );
});

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
      console.log(`server started`);
    })
    .then(async () => {
      await subClient.subscribe(
        common.activeCountChannel,
        throttle(async (msg) => {
          const activeCount = await mainClient.scard(common.activeSetName);
          console.log(`activeCount #${activeCount}`);
          io.emit(`activeCount`, activeCount);
        }, 10000),
      );
      return io;
    });
};

if (require.main === module) {
  getServer(true);
}
