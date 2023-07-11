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
import { credential } from 'firebase-admin';
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

const firebaseApp = initializeApp({
  credential: credential.cert(common.getFirebaseAdminServiceAccount()),
});

let subRedisClient: Client;
export let pubRedisClient: Client;
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
app.use(express.json());

app.get(`/health`, (req, res) => {
  logger.debug(`Health Check.`);
  res.send(`Health is good.`);
});

app.post(`/joinRoom`, async (req, res) => {
  const rooms = req.body.rooms;
  const source = req.body.source;

  if (!source || !rooms)
    return res
      .status(400)
      .send(`source=${source} or rooms=${rooms} is not defined.`);

  const sourceSocket = await mainRedisClient.hget(
    common.connectedAuthMapName,
    source,
  );
  if (!sourceSocket) {
    return res
      .status(404)
      .send(`sourceSocket=${sourceSocket} is not connected.`);
  }

  io.in(sourceSocket).socketsJoin(rooms);
  res.send(`Joined rooms successfully.`);
});

io.on(`error`, (err) => {
  logger.error(`io err`, err);
});

io.on(`connection`, async (socket) => {
  const userId = socket.data.auth;
  const intervals: NodeJS.Timer[] = [];
  socket.emit(`message`, `I am ${process.env.HOSTNAME} and you are ${userId}.`);
  const start_time = performance.now();
  logger.debug(
    `connected ${process.env.HOSTNAME} ${io.sockets.sockets.size} auth: ${userId}`,
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
      userId,
      msg[`target`],
      msg[`message`],
    );
    console.log(`message:`, msg);
  });

  socket.on(`ready`, async (data: { ready: boolean | undefined }, callback) => {
    const ready = data.ready == undefined ? true : data.ready;

    if (ready) {
      try {
        await common.ratelimit(mainRedisClient, `readyQueue`, userId, 30);
      } catch (err) {
        callback({ ready: false, error: `${err}` });
        return;
      }

      await registerSocketReady(socket);

      await sendMatchmakerQueue(rabbitChannel, userId);

      socket.emit(`activity`, `${moment()}`);
    } else {
      await unregisterSocketReady(socket);
    }

    if (callback != undefined) {
      callback({ ready: ready });
    }
  });
  socket
    .to(common.chatActivityRoom(userId))
    .emit(`chat:active`, { target: userId, active: true });
  socket.on(`disconnect`, async () => {
    socket.to(`room-${socket.id}`).emit(`endchat`, `disconnected`);
    socket
      .to(common.chatActivityRoom(userId))
      .emit(`chat:active`, { target: userId, active: false });
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
          `end call error: match_id ${match_id} auth ${userId} err ${err}`,
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

  logger.debug(`intervals.push activity for ${userId}`);
  intervals.push(
    setInterval(() => {
      logger.debug(`sending activity for ${userId}`);
      socket.emit(`activity`, `${moment()}`);
    }, 1000 * 60 * 5),
  );

  // TODO: REMOVE THIS AFTER TESTING!
  let count = 0;

  intervals.push(
    setInterval(async () => {
      count = count + 1;

      logger.debug(`sending test chat`);
      const date = new Date();
      const currentMinute = date.getMinutes();

      await sendChatEventMessage(
        rabbitChannel,
        `random-${currentMinute}`,
        userId,
        `count: ${count}`,
        true,
      );
    }, 1000 * 3),
  );

  const createUserRequest = new CreateUserRequest();
  createUserRequest.setUserId(userId);
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
