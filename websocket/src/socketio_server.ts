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
  EndCallRequest,
  ReadyMessage,
  StandardResponse,
  chatEventQueue,
  createNeo4jClient,
  makeGrpcRequest,
  matchmakerQueueName,
} from 'common-messaging';
import {
  sendChatEventMessage,
  sendMatchmakerQueue,
  sendUserNotification,
} from 'common-messaging/src/message_helper';
import * as dotenv from 'dotenv';
import express from 'express';
import { initializeApp } from 'firebase-admin/app';
import { createServer } from 'http';
import Client from 'ioredis';
import { throttle } from 'lodash';
import moment from 'moment';
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

  await rabbitChannel.assertQueue(chatEventQueue, {
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
  logger.debug(`Health Check.`);
  res.send(`Health is good.`);
});

io.on(`error`, (err) => {
  logger.error(`io err`, err);
});

io.on(`connection`, async (socket) => {
  const intervals: NodeJS.Timer[] = [];
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

  socket.on(`chat`, async (msg) => {
    logger.debug(`chat msg: ${JSON.stringify(msg)}`);
    await sendChatEventMessage(
      rabbitChannel,
      socket.data.auth,
      msg[`target`],
      msg[`message`],
    );
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
          30,
        );
      } catch (err) {
        callback({ ready: false, error: `${err}` });
        return;
      }

      await registerSocketReady(socket);

      await sendMatchmakerQueue(rabbitChannel, socket.data.auth);

      socket.emit(`activity`, `${moment()}`);
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

    for (let interval of intervals) {
      clearInterval(interval);
    }
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

  socket.on(`endchat`, async (value, callback) => {
    socket.to(`room-${socket.id}`).emit(`endchat`, value);
    io.socketsLeave(`room-${socket.id}`);

    const match_id: number = value.match_id;
    const endCallRequest = new EndCallRequest();
    endCallRequest.setMatchId(match_id);

    await makeGrpcRequest<EndCallRequest, StandardResponse>(
      neo4jRpcClient,
      neo4jRpcClient.endCall,
      endCallRequest,
    )
      .then(() => {
        if (callback != null) {
          callback({ ended: true });
        }
      })
      .catch((err) => {
        logger.error(
          `end call error: match_id ${match_id} auth ${socket.data.auth} err ${err}`,
        );
        socket.disconnect();
      });
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

  logger.debug(`intervals.push activity for ${socket.data.auth}`);
  intervals.push(
    setInterval(() => {
      logger.debug(`sending activity for ${socket.data.auth}`);
      socket.emit(`activity`, `${moment()}`);
    }, 1000 * 60 * 5),
  );

  const createUserRequest = new CreateUserRequest();
  createUserRequest.setUserId(socket.data.auth);
  makeGrpcRequest<CreateUserRequest, CreateUserResponse>(
    neo4jRpcClient,
    neo4jRpcClient.createUser,
    createUserRequest,
  )
    .then(() => {
      socket.emit(`established`, `Connection established.`);
    })
    .catch((error) => {
      socket.emit(
        `message`,
        `Connection NOT established. ${JSON.stringify(error)}`,
      );
      socket.disconnect();
    });
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
