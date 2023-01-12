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

  await Promise.all([pubClient.connect(), subClient.connect()]).then(() => {});

  io.adapter(createAdapter(pubClient, subClient));

  httpServer.listen(3000);
  return io;
}

export const helloWorld = functions.https.onRequest(
  async (request, response) => {
    console.log(functions.config());
    try {
      const io = await createSocketServer();

      const connectedSockets = await io.fetchSockets();

      io.emit("message", `users connected: ${connectedSockets.length}`);
    } catch (e) {
      console.error(e);
      response.status(500).send({ error: e });
      return;
    }

    functions.logger.info("completed");
    response.send("completed");
  }
);
