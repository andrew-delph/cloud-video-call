import * as functions from "firebase-functions";
import { createAdapter } from "@socket.io/redis-adapter";
import { createServer } from "http";
import { Server } from "socket.io";
import { createClient } from "redis";
import * as dotenv from "dotenv";

dotenv.config();

async function createRedisClient() {
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
      requestsTimeout: 10000,
    })
  );

  return io;
}

export const periodicMaintenanceTask = functions.pubsub
  .schedule("every 30 seconds")
  .onRun(async (context) => {
    try {
      const io = await createSocketServer();

      const connectedSockets = await io.fetchSockets();

      io.emit("message", `users connected: ${connectedSockets.length}`);
    } catch (e) {
      functions.logger.error(e);
      return;
    }

    functions.logger.info("completed");
  });
