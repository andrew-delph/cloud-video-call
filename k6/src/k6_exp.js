import { EventName, WebSocket } from 'k6/experimental/websockets';
import {
  setTimeout,
  clearTimeout,
  setInterval,
  clearInterval,
} from 'k6/experimental/timers';
import { sleep } from 'k6';
import { WebSocketWrapper } from '../libs/WebSocketWrapper';

export const options = {
  // vus: 3,
  // duration: `10s`,
};

export default function () {
  const secure = false;
  const domain = __ENV.HOST || `localhost:8888`;
  const url = `${
    secure ? `wss` : `ws`
  }://${domain}/socket.io/?EIO=4&transport=websocket`;

  console.log(`url ${url}`);

  const socket = new WebSocketWrapper(url);

  socket.setOnConnect(() => {
    console.log(`connected`);
    socket
      .sendWithAck(`myping`, {}, 1000)
      .then((data) => {
        console.log(`got ack1:`, data);
        return socket.sendWithAck(`myping`, {}, 1000);
      })
      .then((data) => {
        console.log(`got ack2:`, data);
      });
  });

  socket.listen();

  setTimeout(() => {
    socket.close();
  }, 5000);

  // console.log(`ws: ${Object.keys(socket)}`);
  // console.log(`readyState: ${socket.readyState}`);
}
