import * as functions from "firebase-functions";
import { createAdapter } from "@socket.io/redis-adapter";
import { createServer } from "http";
import { Server } from "socket.io";
import { createClient } from "redis";
import * as dotenv from "dotenv";
import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import * as common from "react-video-call-common";

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

let mainRedisClient: RedisClientType = createRedisClient();
let pubRedisClient: RedisClientType = createRedisClient();
let subRedisClient: RedisClientType = createRedisClient();
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

    const socketID: string = data.id;

    const readyNum = await mainRedisClient.sCard(common.readySetName);

    if (readyNum >= 2) {
      await mainRedisClient.sRem(common.readySetName, socketID);

      const otherID = (
        await mainRedisClient.sPop(common.readySetName, 1)
      ).pop();

      if (otherID == null) {
        console.error(`otherID is null`);
        return;
      }

      const roomMsg = `grouping ${socketID} and ${otherID}.`;

      console.log(roomMsg);

      io.socketsLeave(`room-${otherID}`);
      io.socketsLeave(`room-${socketID}`);

      io.in(socketID).socketsJoin(`room-${otherID}`);
      io.in(otherID).socketsJoin(`room-${socketID}`);

      io.in(socketID).emit("message", `you are with ${otherID}`);
      io.in(otherID).emit("message", `you are with ${socketID}`);

      io.in(socketID).emit("set_client_host");
      io.in(otherID).emit("set_client_guest");
    }
  });
