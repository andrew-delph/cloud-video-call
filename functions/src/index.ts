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

async function createSocketServer() {
  const httpServer = createServer();
  const io = new Server(httpServer, {});

  const pubClient = await createRedisClient();

  const subClient = pubClient.duplicate();

  await Promise.all([pubClient.connect(), subClient.connect()]);

  io.adapter(
    createAdapter(pubClient, subClient, {
      requestsTimeout: 20000,
    })
  );

  return io;
}

export const periodicMaintenanceTask = functions.pubsub
  .schedule("every minute")
  .onRun(async (context) => {
    let redisClient: RedisClientType | null = null;
    try {
      const io = await createSocketServer();
      redisClient = await createRedisClient();
      redisClient.connect();

      const connectedSockets = await io.fetchSockets();

      const connectedSocketsIdList: any = connectedSockets.map(
        (socket: any) => socket.id
      );

      redisClient.sAdd("activeSet", connectedSocketsIdList);

      const connectedNum = connectedSockets.length;

      io.emit("message", `users connected: ${connectedNum}`);

      await redisClient.set("connectedNum", connectedNum);

      const docRef = db.collection("users").doc("count");

      await docRef.set({
        sockets: connectedNum,
      });
    } catch (e) {
      functions.logger.error(e);
      return;
    } finally {
      functions.logger.info("closing redis connection");
      redisClient?.quit();
    }

    functions.logger.info("completed");
  });
