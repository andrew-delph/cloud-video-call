// import * as functions from "firebase-functions";
import { createAdapter } from '@socket.io/redis-adapter';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { createClient } from 'redis';
import * as dotenv from 'dotenv';
import { initializeApp } from 'firebase-admin/app';
// import { getFirestore } from "firebase-admin/firestore";
import * as common from 'react-video-call-common';
import Redlock, { ResourceLockedError } from 'redlock';
import { Redis } from 'ioredis';
import { Channel, ConsumeMessage } from 'amqplib';

const matchTimeout = 50000;

dotenv.config();
initializeApp();
// const db = getFirestore();

// type RedisClientType = ReturnType<typeof createClient>;

function createRedisClient() {
  const redisClient = createClient({
    url: `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`,
  });
  redisClient.on(`error`, function (error) {
    console.error(error);
  });
  return redisClient;
}

const mainRedisClient = createRedisClient();
const pubRedisClient = createRedisClient();
const subRedisClient = createRedisClient();
const lockRedisClient = new Redis({
  host: `${process.env.REDIS_HOST}`,
});

const redlock = new Redlock([lockRedisClient]);

redlock.on(`error`, (error) => {
  // Ignore cases where a resource is explicitly marked as locked on a client.
  if (error instanceof ResourceLockedError) {
    return;
  }

  // Log all other errors.
  console.log(`redlock error`);
});

const httpServer = createServer();
const io = new Server(httpServer, {});

const init = Promise.all([
  mainRedisClient.connect(),
  pubRedisClient.connect(),
  subRedisClient.connect(),
])
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

export const readyEvent = async (msg: ConsumeMessage, channel: Channel) => {
  await init;

  const msgContent: [string, string] = JSON.parse(msg.content.toString());

  const socket1 = msgContent[0];
  const socket2 = msgContent[1];

  // console.log(`matching`, socket1, socket2);

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
    .then(async () => {
      // if both acks are acked. we can remove them from the ready set.
      // await mainRedisClient.sRem(common.readySetName, socket1);
      // await mainRedisClient.sRem(common.readySetName, socket2);
    })
    .catch((value) => {
      io.in(socket1).emit(`message`, `host paring: failed with ${value}`);
      io.in(socket2).emit(`message`, `guest paring: failed with ${value}`);
      throw `match failed with ${value}`;
    });
};
