import { createServer } from "http";
import { Server } from "socket.io";

const httpServer = createServer();
const io = new Server(httpServer, {
  // options
});

// import { * } from "react-video-call-common";

console.log(require("react-video-call-common"));

const clients = new Map();

io.on("connection", (socket) => {
  clients.set(socket.id, socket);

  console.log("got new connection " + socket.id);
  socket.emit("message", "hizzz");
  socket.on("disconnect", () => {
    console.log("user disconnected");
  });
});

httpServer.listen(4000);
