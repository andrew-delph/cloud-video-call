import { createServer } from "http";
import { Server, Socket } from "socket.io";
import { v4 as uuid } from "uuid";

import { DistinctPriorityQueue } from "./DistinctPriorityQueue";

const httpServer = createServer();
const io = new Server(httpServer, {
  // options
});

// import * as common from "react-video-call-common";
// console.log(common.mytest);

const clients = new Map<String, Socket>();

var readyQueue: DistinctPriorityQueue<String> = new DistinctPriorityQueue();

io.on("connection", (socket) => {
  clients.set(socket.id, socket);

  console.log("got new connection ", `#${clients.size}`, socket.id);
  socket.emit("message", "hizzz111");

  socket.on("disconnect", () => {
    clients.delete(socket.id);
    console.log("user disconnected");
    readyQueue.remove(socket.id);
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

      const firstSocket = clients.get(firstID);
      const secondSocket = clients.get(secondID);

      if (!firstSocket || !secondSocket) {
        console.log(
          `error with null socket first:${firstSocket} second:${secondID}`
        );
        return;
      }

      const roomID = uuid();

      console.log(`grouping ${firstID} and ${secondID} in room: ${roomID}`);

      firstSocket.join(roomID);
      secondSocket.join(roomID);

      socket.to(roomID).emit("message", `Welcome to ${roomID}`);

      firstSocket.emit("message", `you are with ${secondID}`);
      secondSocket.emit("message", `you are with ${firstID}`);
    }
  });
});

httpServer.listen(4000);
