import { createServer } from "http";
import { Server } from "socket.io";

const httpServer = createServer();
const io = new Server(httpServer, {
  // options
});

// import * as common from "react-video-call-common";
// console.log(common.mytest);

const clients = new Map();

io.on("connection", (socket) => {
  clients.set(socket.id, socket);

  console.log("got new connection " + socket.id);
  socket.emit("message", "hizzz111");
  socket.on("disconnect", () => {
    console.log("user disconnected");
  });
});

httpServer.listen(4000);
