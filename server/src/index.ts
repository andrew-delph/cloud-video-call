import { createServer } from "http";
import { Server, Socket } from "socket.io";
import { v4 as uuid } from "uuid";
import { Client } from "./Client";
import express from "express";
import * as path from "path";

import { DistinctPriorityQueue } from "./DistinctPriorityQueue";

const app = express();

const httpServer = createServer(app);

const io = new Server(httpServer, {
  // options
});

app.get("*", (req, res) => {
  res.send("This is the api server :)");
});

const clients = new Map<String, Client>();

var readyQueue: DistinctPriorityQueue<String> = new DistinctPriorityQueue();

io.on("connection", (socket) => {
  clients.set(socket.id, new Client(socket));

  console.log("got new connection ", `#${clients.size}`, socket.id);
  socket.emit("message", "hizzz111");

  const myInterval = setInterval(() => {
    socket.emit("message", `sending update`);
  }, 1000);

  socket.on("disconnect", () => {
    clearInterval(myInterval);
    clients.delete(socket.id);
    console.log("user disconnected");
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

httpServer.listen(4000);
