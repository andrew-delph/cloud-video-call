import * as functions from "firebase-functions";
import { createAdapter } from "@socket.io/redis-adapter";
import { createServer } from "http";
import { Server } from "socket.io";
import { createClient } from "redis";
import * as dotenv from "dotenv";

import { initializeApp } from "firebase-admin/app";

import { getFirestore } from "firebase-admin/firestore";

initializeApp();

const db = getFirestore();

dotenv.config();

type RedisClientType = ReturnType<typeof createClient>;

async function createRedisClient(): Promise<RedisClientType> {
  const redisClient = createClient({
    url: `redis://${functions.config().redis.user}:${
      functions.config().redis.pass
    }@redis-19534.c1.us-east1-2.gce.cloud.redislabs.com:19534`,
  });

  redisClient.on("error", function (error) {
    console.error(error);
  });

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

      mainRedisClient.del("temp_activeSet");
      mainRedisClient.sAdd("activeSet", connectedSocketsIdList);
      mainRedisClient.sAdd("temp_activeSet", connectedSocketsIdList);

      mainRedisClient.sDiffStore("activeSet", ["activeSet", "temp_activeSet"]);

      mainRedisClient.del("temp_activeSet");

      const connectedNum = connectedSockets.length;

      io.emit("message", `users connected: ${connectedNum}`);

      await mainRedisClient.set("connectedNum", connectedNum);

      const docRef = db.collection("users").doc("count");

      await docRef.set({
        sockets: connectedNum,
      });
    } catch (e) {
      functions.logger.error(e);
      return;
    } finally {
      functions.logger.info("closing redis connection");
      mainRedisClient?.quit();
      pubRedisClient?.quit();
      subRedisClient?.quit();
    }

    functions.logger.info("completed");
  });
