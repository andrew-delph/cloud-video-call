import { auth_middleware } from './authentication';
import {
  cleanSocketServer,
  registerServerHeartbeat,
  registerSocketReady,
  unregisterSocketReady,
} from './management';
import { createAdapter } from '@socket.io/redis-adapter';
import amqp from 'amqplib';
import * as common from 'common';
import { listenGlobalExceptions } from 'common';
import {
  CreateUserRequest,
  CreateUserResponse,
  ReadyMessage,
  createNeo4jClient,
  matchmakerQueueName,
} from 'common-messaging';
import { sendMatchmakerQueue } from 'common-messaging/src/message_helper';
import * as dotenv from 'dotenv';
import express from 'express';
import { initializeApp } from 'firebase-admin/app';
import { createServer } from 'http';
import Client from 'ioredis';
import { throttle } from 'lodash';
import { Server, Socket } from 'socket.io';
import { v4 as uuid } from 'uuid';

const logger = common.getLogger();

listenGlobalExceptions(cleanSocketServer);

const neo4jRpcClient = createNeo4jClient();

let rabbitConnection: amqp.Connection;
let rabbitChannel: amqp.Channel;

const connectRabbit = async () => {
  [rabbitConnection, rabbitChannel] = await common.createRabbitMQClient();

  await rabbitChannel.assertQueue(matchmakerQueueName, {
    durable: true,
  });

  logger.info(`rabbitmq connected`);
};

dotenv.config();

const firebaseApp = initializeApp();

export let pubRedisClient: Client;
let subRedisClient: Client;
export let mainRedisClient: Client;

const app = express();
const httpServer = createServer(app);

export const io = new Server(httpServer, {
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
  socket.emit(
    `message`,
    `I am ${process.env.HOSTNAME} and you are ${socket.data.auth}.`,
  );
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

  socket.on(`ready`, async (data: { ready: boolean | undefined }, callback) => {
    const ready = data.ready == undefined ? true : data.ready;

    if (ready) {
      try {
        await common.ratelimit(
          mainRedisClient,
          `readyQueue`,
          socket.data.auth,
          20,
        );
      } catch (err) {
        callback({ ready: false, error: `${err}` });
        return;
      }

      await registerSocketReady(socket);

      await sendMatchmakerQueue(rabbitChannel, socket.data.auth);
    } else {
      await unregisterSocketReady(socket);
    }

    if (callback != undefined) {
      callback({ ready: ready });
    }
  });

  socket.on(`disconnect`, async () => {
    socket.to(`room-${socket.id}`).emit(`endchat`, `disconnected`);
    io.socketsLeave(`room-${socket.id}`);
    const duration = performance.now() - start_time;
    // logger.debug(
    //   `disconnected ${process.env.HOSTNAME} #${
    //     io.sockets.sockets.size
    //   } duration: ${Math.round(duration / 1000)}`,
    // );
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

  socket.on(`endchat`, (value) => {
    socket.to(`room-${socket.id}`).emit(`endchat`, value);
    io.socketsLeave(`room-${socket.id}`);
  });

  await pubRedisClient.publish(common.activeCountChannel, `change`);

  // setTimeout(() => {
  //   socket.timeout(1000).emit("myping", "hello", (err: any, response: any) => {
  //     if (err) {
  //       console.error("err", err);
  //     } else {
  //       // console.log("response", response);
  //     }
  //   });
  // }, 1000);

  const createUserRequest = new CreateUserRequest();
  createUserRequest.setUserId(socket.data.auth);
  try {
    neo4jRpcClient.createUser(
      createUserRequest,
      (error: any, response: CreateUserResponse) => {
        if (!error) {
          logger.info(`created user.... ${socket.data.auth}`);
          socket.emit(`established`, `Connection established.`);
        } else {
          socket.emit(
            `message`,
            `Connection NOT established. ${JSON.stringify(error)}`,
          );
          logger.error(`createUser error: ${error.message}`);
          logger.error(`createUser error: ${JSON.stringify(error)}`);
          socket.disconnect();
        }
      },
    );
  } catch (e) {
    logger.error(`creat user error! ${e}`);
    socket.disconnect();
  }
});

export const getServer = async (listen: boolean) => {
  return await Promise.all([])
    .then(() => {
      mainRedisClient = common.createRedisClient();
      subRedisClient = common.createRedisClient();
      pubRedisClient = common.createRedisClient();
    })
    .then(async () => {
      await connectRabbit();
    })
    .then(() => {
      io.adapter(createAdapter(pubRedisClient, subRedisClient));
      if (listen) httpServer.listen(80);
      logger.info(`Server started on port 80.`);
    })
    .then(async () => {
      const activeCountThrottle = throttle(async () => {
        const activeCount = await mainRedisClient.scard(common.activeSetName);
        logger.info(`activeCount #${activeCount}`);
        io.emit(`activeCount`, activeCount);
      }, 5000);

      await subRedisClient.subscribe(common.activeCountChannel);

      subRedisClient.on(`message`, async (channel) => {
        if (channel == common.activeCountChannel) await activeCountThrottle();
      });

      await registerServerHeartbeat();
      setInterval(async () => {
        await registerServerHeartbeat();
      }, 20 * 1000);

      return io;
    })
    .catch((error) => {
      logger.error(`setup error: ${error}`);
      throw error;
    });
};

if (require.main === module) {
  getServer(true);
}
