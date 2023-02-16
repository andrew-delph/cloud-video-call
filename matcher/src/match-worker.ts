// import * as functions from "firebase-functions";
import { createAdapter } from '@socket.io/redis-adapter';
import { createServer } from 'http';
import { Server } from 'socket.io';
import * as dotenv from 'dotenv';
import * as common from 'react-video-call-common';
import Client from 'ioredis';

import { Channel, ConsumeMessage } from 'amqplib';

const matchTimeout = 50000;

dotenv.config();

function createRedisClient() {
  const redisClient = new Client({
    host: `${process.env.REDIS_HOST || `redis`}`,
  });
  return redisClient;
}

const pubRedisClient = createRedisClient();
const subRedisClient = createRedisClient();

const httpServer = createServer();
const io = new Server(httpServer, {});

const init = Promise.all([pubRedisClient.connect(), subRedisClient.connect()])
  .then(async () => {
    io.adapter(
      createAdapter(pubRedisClient, subRedisClient, {
        requestsTimeout: 20000,
      }),
    );
    return;
  })
  .then(() => {
    console.log(`loaded init`);
  });

export const match = async (msg: ConsumeMessage, channel: Channel) => {
  await init;
  const msgContent: [string, string] = JSON.parse(msg.content.toString());

  const socket1 = msgContent[0];
  const socket2 = msgContent[1];

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
          console.error(err);
          reject(`host`);
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
          console.error(err);
          reject(`guest`);
        } else {
          resolve();
        }
      });
  };

  return await new Promise(guestCallback)
    .then(() => {
      return new Promise(hostCallback);
    })
    .catch((value) => {
      io.in(socket1).emit(`message`, `host paring: failed with ${value}`);
      io.in(socket2).emit(`message`, `guest paring: failed with ${value}`);
      throw `match failed with ${value}`;
    });
};
