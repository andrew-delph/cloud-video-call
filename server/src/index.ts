import { createServer } from "http";
import { OrderedSet } from "immutable";
import { Server } from "socket.io";

const httpServer = createServer();
const io = new Server(httpServer, {
  // options
});

// import * as common from "react-video-call-common";
// console.log(common.mytest);

const clients = new Map();

var readyQueue: OrderedSet<String> = OrderedSet<String>().asMutable();

console.log(readyQueue.toString());

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
    console.log(`${readyQueue.size}  ready!`);

    if (readyQueue.size >= 2) {
      const firstID = readyQueue.first() || "test";
      readyQueue.remove(firstID);
      const secondID = readyQueue.first() || "test";
      readyQueue.remove(secondID);
      console.log(`grouping ${firstID} and ${secondID}`);

      clients.get(firstID).emit("message", `you are with ${secondID}`);
      clients.get(secondID).emit("message", `you are with ${firstID}`);
    }
  });
});

httpServer.listen(4000);
