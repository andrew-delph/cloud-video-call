import * as functions from "firebase-functions";
import { createAdapter } from "@socket.io/redis-adapter";
import { createServer } from "http";
import { Server } from "socket.io";
import { createClient } from "redis";
import * as dotenv from "dotenv";

dotenv.config();

async function createRedisClient() {
  const redisClient = createClient({
    url: `redis://${process.env.REDIS_USER}:${process.env.REDIS_PASSWORD}@redis-19534.c1.us-east1-2.gce.cloud.redislabs.com:19534`,
  });

  redisClient.on("error", function (error) {
    console.error(error);
  });

  return redisClient;
}

async function createSocketServer() {
  const httpServer = createServer();
  const io = new Server(httpServer, {});

  io.on("connection", (socket) => {});

  const pubClient = await createRedisClient();

  const subClient = pubClient.duplicate();

  await Promise.all([pubClient.connect(), subClient.connect()]).then(() => {});

  io.adapter(createAdapter(pubClient, subClient));

  httpServer.listen(3000);
  return io;
}

export const helloWorld = functions.https.onRequest(
  async (request, response) => {
    try {
      const io = await createSocketServer();
      io.emit("message", "hello from a cloud function1");
    } catch (e) {
      console.log("errror1");
      console.log(e);
      response.send(e);
      return;
    }

    functions.logger.info("Hello logs!", { structuredData: true });
    response.send("Hello from Firebase!12");
  }
);
