import { createAdapter } from "@socket.io/redis-adapter";
import * as dotenv from "dotenv";
import express from "express";
import { createServer } from "http";
import { createClient } from "redis";
import { Server } from "socket.io";
import { v4 as uuid } from "uuid";
import { Client } from "./Client";
import { DistinctPriorityQueue } from "./DistinctPriorityQueue";
// import { RedisAdapter } from "@socket.io/redis-adapter";
import * as common from "react-video-call-common";

import { initializeApp } from "firebase-admin/app";
// import { getFirestore } from "firebase-admin/firestore";
import { getFunctions } from "firebase-admin/functions";

dotenv.config();

console.log(process.env.FIREBASE_CONFIG);

initializeApp();
console.log(getFunctions().taskQueue("readyEvent"));

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
});

pubClient.on("error", function (error) {
  console.error(error);
});

const subClient = pubClient.duplicate();

app.get("*", (req, res) => {
  res.send("This is the API server :)");
});

const clients = new Map<String, Client>();

var readyQueue: DistinctPriorityQueue<String> = new DistinctPriorityQueue();

io.on("connection", async (socket) => {
  clients.set(socket.id, new Client(socket));

  console.log(`${socket.id} connected`);

  pubClient.sAdd(common.activeSetName, socket.id);

  io.emit("message", "everyone welcome " + socket.id);

  socket.emit(
    "message",
    `hey from server :) I am ${serverID}. Redis says there is ${await pubClient.get(
      "connectedNum"
    )} connected sockets.`
  );

  let updateCount = 0;
  const myInterval = setInterval(async () => {
    updateCount = updateCount + 1;
    socket.emit("message", `updateCount: ${updateCount}`);
  }, 5000);

  socket.on("message", (value) => {
    console.log("message", value);
  });

  socket.on("disconnect", () => {
    clearInterval(myInterval);
    clients.delete(socket.id);
    io.emit("message", `user disconnected: ${socket.id}}`);
    console.log("user disconnected " + socket.id);
    readyQueue.remove(socket.id);
    pubClient.sRem(common.activeSetName, socket.id);
    pubClient.sRem(common.readySetName, socket.id);
  });

  socket.on("client_host", (value) => {
    const myClient = clients.get(socket.id);
    if (!myClient) return;
    const theRoom = myClient.getRoomId();
    if (!theRoom) return;

    socket.to(theRoom).emit("client_guest", value);
  });

  socket.on("client_guest", (value) => {
    const myClient = clients.get(socket.id);
    if (!myClient) return;
    const theRoom = myClient.getRoomId();
    if (!theRoom) return;

    socket.to(theRoom).emit("client_host", value);
  });

  socket.on("icecandidate", (value) => {
    const myClient = clients.get(socket.id);
    if (!myClient) return;
    const theRoom = myClient.getRoomId();
    if (!theRoom) return;

    socket.to(theRoom).emit("icecandidate", value);
  });

  socket.on("ready", async () => {
    console.log("ready!");
    const x = await getFunctions()
      .taskQueue("readyEvent")
      .enqueue({ test: "test msg" });
    console.log("x", x);
    pubClient.sAdd(common.readySetName, socket.id);
    readyQueue.add(socket.id);
    io.emit(
      "message",
      `${socket.id}  is ready! #readyQueue.size() ${readyQueue.size()}`
    );
    console.log(`${readyQueue.size()}  ready!`);

    if (readyQueue.size() >= 2) {
      const firstID = readyQueue.pop();
      const secondID = readyQueue.pop();

      if (!firstID || !secondID) {
        console.log(`error with null ID first:${firstID} second:${secondID}`);
        return;
      }

      const firstClient = clients.get(firstID);
      const secondClient = clients.get(secondID);

      if (!firstClient || !secondClient) {
        console.log(
          `error with null socket first:${firstClient} second:${secondID}.`
        );
        return;
      }

      const roomID = uuid();

      console.log(`grouping ${firstID} and ${secondID} in room: ${roomID}.`);

      firstClient.getSocket().join(roomID);
      secondClient.getSocket().join(roomID);

      firstClient.setRoomId(roomID);
      secondClient.setRoomId(roomID);

      io.to(roomID).emit("message", `Welcome to ${roomID}`);

      firstClient.getSocket().emit("message", `you are with ${secondID}`);
      secondClient.getSocket().emit("message", `you are with ${firstID}`);

      firstClient.getSocket().emit("set_client_host", roomID);
      secondClient.getSocket().emit("set_client_guest", roomID);
    }
  });
});

Promise.all([pubClient.connect(), subClient.connect()]).then(() => {
  io.adapter(createAdapter(pubClient, subClient));
  httpServer.listen(process.env.PORT);
});
