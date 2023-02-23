import { EventName, WebSocket } from 'k6/experimental/websockets';
import {
  setTimeout,
  clearTimeout,
  setInterval,
  clearInterval,
} from 'k6/experimental/timers';
import { sleep } from 'k6';

console.log(`Hi`);

const chatRoomName = `publicRoom`; // choose any chat room name
const sessionDuration = 60000; // user session between 5s and 1m

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

  const socket = new WebSocket(url);

  socket.addEventListener(`error`, (error) => {
    console.log(`error:`, error);
  });

  socket.addEventListener(`message`, (e) => {
    console.log(`msg`, e.data);
  });

  socket.addEventListener(`open`, () => {
    socket.send(`40`);
    sleep(2);

    console.log(`connected`);

    // listen for messages/errors and log them into console

    // // after a sessionDuration + 3s close the connection
    const timeout2id = setTimeout(function () {
      console.log(`Closing the socket forcefully 3s after graceful LEAVE`);
      socket.close();
    }, 3000);

    // when connection is closing, clean up the previously created timers
    socket.addEventListener(`close`, () => {
      // clearTimeout(timeout1id);
      clearTimeout(timeout2id);
      console.log(`disconnected`, timeout2id);
    });
  });

  console.log(`ws: ${Object.keys(socket)}`);
  console.log(`readyState: ${socket.readyState}`);
}
