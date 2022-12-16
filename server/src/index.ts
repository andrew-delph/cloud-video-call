import { createServer } from "http";
import { Server } from "socket.io";

const httpServer = createServer();
const io = new Server(httpServer, {
  // options
});
let x = 0;
io.on("connection", (socket) => {
  x = x + 1;
  console.log("got new connection " + x);
  socket.emit("message", "hi" + x);
});

httpServer.listen(4000);
