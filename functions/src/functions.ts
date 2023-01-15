import * as functions from "firebase-functions";
import { createAdapter } from "@socket.io/redis-adapter";
import { createServer } from "http";
import { Server } from "socket.io";
import { createClient } from "redis";
import * as dotenv from "dotenv";

import { initializeApp } from "firebase-admin/app";

import { getFirestore } from "firebase-admin/firestore";

import * as common from "react-video-call-common";

initializeApp();

const db = getFirestore();

dotenv.config();

type RedisClientType = ReturnType<typeof createClient>;

const redisClientList: RedisClientType[] = [];

async function createRedisClient(): Promise<RedisClientType> {
  const redisClient = createClient({
    url: `redis://${functions.config().redis.user}:${
      functions.config().redis.pass
    }@redis-19534.c1.us-east1-2.gce.cloud.redislabs.com:19534`,
  });

  redisClient.on("error", function (error) {
    console.error(error);
  });

  redisClientList.push(redisClient);

  return redisClient;
}

async function createSocketServer(
  pubRedisClient: RedisClientType,
  subRedisClient: RedisClientType
) {
  const httpServer = createServer();
  const io = new Server(httpServer, {});

  io.adapter(
    createAdapter(pubRedisClient, subRedisClient, {
      requestsTimeout: 20000,
    })
  );

  return io;
}

export const periodicMaintenanceTask = functions.pubsub
  .schedule("every minute")
  .onRun(async (context) => {
    let mainRedisClient: RedisClientType | null = null;

    let pubRedisClient: RedisClientType | null = null;

    let subRedisClient: RedisClientType | null = null;

    try {
      mainRedisClient = await createRedisClient();

      pubRedisClient = await createRedisClient();
      subRedisClient = await createRedisClient();

      await mainRedisClient.connect();
      await pubRedisClient.connect();
      await subRedisClient.connect();

      const io = await createSocketServer(pubRedisClient, subRedisClient);

      const connectedSockets = await io.fetchSockets();

      const connectedSocketsIdList: any = connectedSockets.map(
        (socket: any) => socket.id
      );
      const connectedNum = connectedSockets.length;

      console.log("active ids: ", connectedSocketsIdList);

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

      io.emit("message", `users connected: ${connectedNum}`);

      const docRef = db.collection("users").doc("count");

      await docRef.set({
        sockets: connectedNum,
      });
    } catch (e) {
      functions.logger.error(e);
      return;
    } finally {
      functions.logger.info("closing redis connection");

      redisClientList.forEach(async (client) => {
        try {
          await client.quit();
        } catch (e) {
          functions.logger.error("failed to close a client.");
        }
      });
    }

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
      maxConcurrentDispatches: 6,
    },
  })
  .onDispatch(async (data: any, context: any) => {
    let mainRedisClient: RedisClientType | null = null;

    let pubRedisClient: RedisClientType | null = null;

    let subRedisClient: RedisClientType | null = null;

    try {
      mainRedisClient = await createRedisClient();

      pubRedisClient = await createRedisClient();
      subRedisClient = await createRedisClient();

      await mainRedisClient.connect();
      await pubRedisClient.connect();
      await subRedisClient.connect();

      const io = await createSocketServer(pubRedisClient, subRedisClient);

      io.emit("message", `readyEvent task!`);
    } finally {
      functions.logger.info("closing redis connection");

      redisClientList.forEach(async (client) => {
        try {
          await client.quit();
        } catch (e) {
          functions.logger.error("failed to close a client.");
        }
      });
    }

    console.log("data", data);
    console.log("context", context);
  });
