import * as functions from "firebase-functions";
import { createAdapter } from "@socket.io/redis-adapter";
import { createServer } from "http";
import { Server } from "socket.io";
import { createClient } from "redis";
import * as dotenv from "dotenv";
import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import * as common from "react-video-call-common";
import Redlock from "redlock";
import { Redis } from "ioredis";

dotenv.config();
initializeApp();
const db = getFirestore();

type RedisClientType = ReturnType<typeof createClient>;

function createRedisClient(): RedisClientType {
  const redisClient = createClient({
    url: `redis://${functions.config().redis.user}:${
      functions.config().redis.pass
    }@redis-19534.c1.us-east1-2.gce.cloud.redislabs.com:19534`,
    name: "functions",
  });
  redisClient.on("error", function (error) {
    console.error(error);
  });
  return redisClient;
}

const mainRedisClient: RedisClientType = createRedisClient();
const pubRedisClient: RedisClientType = createRedisClient();
const subRedisClient: RedisClientType = createRedisClient();
const lockRedisClient = new Redis({
  port: 19534,
  host: "redis-19534.c1.us-east1-2.gce.cloud.redislabs.com",
  username: functions.config().redis.user,
  password: functions.config().redis.pass,
});

const redlock = new Redlock([lockRedisClient]);

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
      })
    );
    return;
  })
  .then(() => {
    console.log("loaded init");
  });

export const periodicMaintenanceTask = functions.pubsub
  .schedule("every minute")
  .onRun(async (context) => {
    await init;

    const connectedSockets = await io.fetchSockets();

    const connectedSocketsIdList: any = connectedSockets.map(
      (socket: any) => socket.id
    );
    const connectedNum = connectedSockets.length;

    if (connectedSocketsIdList.length > 0) {
      // update activeSet start
      await mainRedisClient.del("temp_activeSet");
      await mainRedisClient.sAdd("temp_activeSet", connectedSocketsIdList);
      await mainRedisClient.sInterStore(common.activeSetName, [
        common.activeSetName,
        "temp_activeSet",
      ]);
      await mainRedisClient.sInterStore(common.readySetName, [
        common.readySetName,
        "temp_activeSet",
      ]);
      await mainRedisClient.del("temp_activeSet");
      // update activeSet end
    }

    const docRef = db.collection("users").doc("count");

    await docRef.set({
      sockets: connectedNum,
    });

    functions.logger.info("completed...");
  });

exports.readyEvent = functions
  .runWith({})
  .tasks.taskQueue({
    retryConfig: {
      maxAttempts: 5,
      minBackoffSeconds: 60,
    },
    rateLimits: {
      maxConcurrentDispatches: 1,
    },
  })
  .onDispatch(async (data: any, context: any) => {
    await init;

    const socketId: string = data.id;

    // const readyNum = await mainRedisClient.sCard(common.readySetName);

    const randomMembers = (
      await mainRedisClient.sRandMemberCount(common.readySetName, 2)
    ).filter((val) => val != socketId);

    const otherId = randomMembers.pop();

    if (otherId == null) {
      console.error(`otherID is null`);
      return;
    }

    redlock.using(
      [socketId, otherId],
      5000,
      { retryCount: 5 },
      async (signal) => {
        const roomMsg = `locked ${socketId} and ${otherId}.`;

        console.log(roomMsg);

        const socketIdExists = await mainRedisClient.sIsMember(
          common.readySetName,
          socketId
        );

        if (socketIdExists == false) {
          console.log("socketId does not exist in the set.");
          // task is complete
          return;
        }

        const otherIdExists = await mainRedisClient.sIsMember(
          common.readySetName,
          otherId
        );

        if (otherIdExists == false) {
          console.log("otherId does not exist in the set.");
          // task is not complete
          throw "otherId does not exist in the set.";
        }

        io.socketsLeave(`room-${otherId}`);
        io.socketsLeave(`room-${socketId}`);

        io.in(socketId).socketsJoin(`room-${otherId}`);
        io.in(otherId).socketsJoin(`room-${socketId}`);

        io.in(socketId).emit("message", `you are with ${otherId}`);
        io.in(otherId).emit("message", `you are with ${socketId}`);

        io.in(socketId).emit("set_client_host");
        io.in(otherId).emit("set_client_guest");

        await mainRedisClient.sRem(common.readySetName, socketId);
        await mainRedisClient.sRem(common.readySetName, otherId);
      }
    );
  });
