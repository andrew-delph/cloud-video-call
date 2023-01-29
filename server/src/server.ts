import { createAdapter } from "@socket.io/redis-adapter";
import * as dotenv from "dotenv";
import express from "express";
import { createServer } from "http";
import { createClient } from "redis";
import { Server } from "socket.io";
import { v4 as uuid } from "uuid";
// import { RedisAdapter } from "@socket.io/redis-adapter";
import * as common from "react-video-call-common";

import { initializeApp } from "firebase-admin/app";
// import { getFirestore } from "firebase-admin/firestore";
import { getFunctions } from "firebase-admin/functions";

import { throttle } from "lodash";

dotenv.config();

const LOCAL = process.env.LOCAL != undefined;

initializeApp();

const serverID = uuid();

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

const pubClient = createClient({
  url: `redis://${process.env.REDIS_USER}:${process.env.REDIS_PASSWORD}@redis-19534.c1.us-east1-2.gce.cloud.redislabs.com:19534`,
  name: "socket-server",
});

pubClient.on("error", function (error) {
  console.error(error);
});

const subClient = pubClient.duplicate();

app.get("*", (req, res) => {
  res.send("This is the API server :)");
});

io.on("connection", async (socket) => {
  console.log("connected");

  pubClient.sAdd(common.activeSetName, socket.id);

  socket.on("myping", (arg, callback) => {
    console.log("myping", arg, callback);
    try {
      if (callback != undefined) callback("ping ding dong");
    } catch (e) {
      console.error(e);
    }
  });

  socket.on("message", (msg) => {
    console.log("message:", msg);
  });

  socket.on("ready", async (data, callback) => {
    pubClient.sAdd(common.readySetName, socket.id);

    if (!LOCAL) {
      try {
        await getFunctions().taskQueue("readyEvent").enqueue({ id: socket.id });
      } catch (e) {
        console.error(e);
      }
    } else {
      console.log("local ready");
    }

    if (callback != undefined) {
      callback();
    }
  });

  // let updateCount = 0;
  // const myInterval = setInterval(async () => {
  //   updateCount = updateCount + 1;
  //   socket.emit("message", `updateCount: ${updateCount}`);
  // }, 5000);

  socket.on("disconnect", async () => {
    console.log("disconnected");
    // clearInterval(myInterval);
    pubClient.sRem(common.activeSetName, socket.id);
    pubClient.sRem(common.readySetName, socket.id);
    pubClient.publish(common.activeCountChannel, `change`);
  });

  socket.on("client_host", (value) => {
    socket.to(`room-${socket.id}`).emit("client_guest", value);
  });

  socket.on("client_guest", (value) => {
    socket.to(`room-${socket.id}`).emit("client_host", value);
  });

  socket.on("icecandidate", (value) => {
    socket.to(`room-${socket.id}`).emit("icecandidate", value);
  });

  pubClient.publish(common.activeCountChannel, `change`);

  socket.emit("message", `hey from server :) I am ${serverID}.`);

  setTimeout(() => {
    socket.timeout(1000).emit("myping", "hello", (err: any, response: any) => {
      if (err) {
        console.error("err", err);
      } else {
        console.log("response", response);
      }
    });
  }, 1000);
});

Promise.all([pubClient.connect(), subClient.connect()])
  .then(() => {
    io.adapter(createAdapter(pubClient, subClient));
    httpServer.listen(process.env.PORT);
  })
  .then(() => {
    subClient.subscribe(
      common.activeCountChannel,
      throttle(async (msg) => {
        io.emit("activeCount", await pubClient.sCard(common.activeSetName));
      }, 1000)
    );
  });
