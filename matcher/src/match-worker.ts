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
  console.log(`rabbitmq connected`);

  pubRedisClient = new Client({
    host: `${process.env.REDIS_HOST || `redis`}`,
  });
  subRedisClient = new Client({
    host: `${process.env.REDIS_HOST || `redis`}`,
  });
  console.log(`redis connected.`);

  io.adapter(createAdapter(pubRedisClient, subRedisClient));

  console.log(`socket io connected`);

  // channel.prefetch(10);
  console.log(` [x] Awaiting RPC requests`);

  channel.consume(
    common.matchQueueName,
    async (msg: ConsumeMessage | null) => {
      if (msg == null) {
        console.log(`msg is null.`);
        return;
      }

      // console.log(
      //   `match event - ${new Date().toLocaleTimeString(`en-US`, {
      //     hour12: false,
      //   })}`,
      // );

      try {
        await match(msg, channel);
      } catch (e) {
        console.log(`matchEvent error=` + e);
      } finally {
        channel.ack(msg);
      }
    },
    {
      noAck: false,
    },
  );
}

export const match = async (msg: ConsumeMessage, channel: Channel) => {
  const msgContent: [string, string] = JSON.parse(msg.content.toString());

  const socket1 = msgContent[0];
  const socket2 = msgContent[1];

  if (!socket1 || !socket2) {
    throw Error(`(!socket1 || !socket2) ${socket1} ${socket2}`);
  }

  const request = new CreateMatchRequest();

  request.setUserId1(socket1);
  request.setUserId2(socket2);

  await neo4jRpcClient.createMatch(request, (error, response) => {
    if (error) {
      console.error(`neo4j create match error: ${error}`);
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
    .catch((value) => {
      io.in(socket1).emit(`message`, `host paring: failed with ${value}`);
      io.in(socket2).emit(`message`, `guest paring: failed with ${value}`);
      throw `match failed with \t ${value}`;
    });
  // .finally(() => {
  //   console.log(`finally :)`);
  // });
};

if (require.main === module) {
  matchConsumer();
}
