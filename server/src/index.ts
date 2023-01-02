import { createServer } from "http";
import { Server, Socket } from "socket.io";
import { v4 as uuid } from "uuid";
import { Client } from "./Client";
import express from "express";
import * as path from "path";

import { DistinctPriorityQueue } from "./DistinctPriorityQueue";

import { createAdapter } from "@socket.io/redis-adapter";
import { createClient } from "redis";

import * as dotenv from "dotenv";
dotenv.config();

const app = express();

const httpServer = createServer(app);

const io = new Server(httpServer, {
  // options
});

const pubClient = createClient({
  url: `redis://${process.env.REDIS_USER}:${process.env.REDIS_PASSWORD}@redis-19534.c1.us-east1-2.gce.cloud.redislabs.com:19534`,
});

pubClient.connect().then((data) => {
  console.log("connected");
  pubClient.set("key", "value").then((data) => {
    console.log("the set", data);
  });
});

console.log(
  `redis://${process.env.REDIS_USER}:${process.env.REDIS_PASSWORD}@redis-19534.c1.us-east1-2.gce.cloud.redislabs.com:19534`
);

const subClient = pubClient.duplicate();

io.adapter(createAdapter(pubClient, subClient));

app.get("*", (req, res) => {
  res.send("This is the api server :)");
});

const clients = new Map<String, Client>();

var readyQueue: DistinctPriorityQueue<String> = new DistinctPriorityQueue();

io.on("connection", (socket) => {
  clients.set(socket.id, new Client(socket));

  console.log("got new connection ", `#${clients.size}`, socket.id);
  socket.emit("message", "hizzz111");

  let updateCount = 0;
  const myInterval = setInterval(() => {
    updateCount = updateCount + 1;
    io.emit("message", `connected ${clients.size} .... ${updateCount}`);
  }, 5000);

  socket.on("message", (value) => {
    console.log("message", value);
  });

  socket.on("disconnect", () => {
    clearInterval(myInterval);
    clients.delete(socket.id);
    console.log("user disconnected " + socket.id);
    readyQueue.remove(socket.id);
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

  socket.on("ready", () => {
    readyQueue.add(socket.id);
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
          `error with null socket first:${firstClient} second:${secondID}`
        );
        return;
      }

      const roomID = uuid();

      console.log(`grouping ${firstID} and ${secondID} in room: ${roomID}`);

      firstClient.getSocket().join(roomID);
      secondClient.getSocket().join(roomID);

      firstClient.setRoomId(roomID);
      secondClient.setRoomId(roomID);

      socket.to(roomID).emit("message", `Welcome to ${roomID}`);

      firstClient.getSocket().emit("message", `you are with ${secondID}`);
      secondClient.getSocket().emit("message", `you are with ${firstID}`);

      firstClient.getSocket().emit("set_client_host", roomID);
      secondClient.getSocket().emit("set_client_guest", roomID);
    }
  });
});

httpServer.listen(process.env.PORT);
