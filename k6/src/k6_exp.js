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

const secure = false;
const domain = __ENV.HOST || `localhost:8888`;
const url = `${
  secure ? `wss` : `ws`
}://${domain}/socket.io/?EIO=4&transport=websocket`;

export default function () {
  console.log(`url ${url}`);

  const socket = new WebSocketWrapper(url);
  let expectMatch;

  socket.setOnConnect(() => {
    console.log(`connected`);
    socket
      .expectMessage(`established`, 5000)
      .then((data) => {
        console.log(`established data:`, data);
        return socket.sendWithAck(`myping`, {}, 1000);
      })
      .then((data) => {
        expectMatch = socket.expectMessage(`match`, 10000);
        return socket.sendWithAck(`ready`, {}, 1000);
      })
      .then((data) => {
        console.log(`ready data:`, data);
        return expectMatch;
      })
      .then((data) => {
        console.log(`match data:`, data);
        socket.close();
      });
  });

  socket.listen();
}
