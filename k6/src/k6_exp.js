import { EventName, WebSocket } from 'k6/experimental/websockets';
import { Rate, Gauge, Counter } from 'k6/metrics';
import {
  setTimeout,
  clearTimeout,
  setInterval,
  clearInterval,
} from 'k6/experimental/timers';
import { sleep } from 'k6';
import { WebSocketWrapper } from '../libs/WebSocketWrapper';

export const options = {
  // vus: 20,
  // duration: `10s`,
};

const secure = false;
const domain = __ENV.HOST || `localhost:8888`;
const url = `${
  secure ? `wss` : `ws`
}://${domain}/socket.io/?EIO=4&transport=websocket`;

const match_elapsed = new Gauge(`match_elapsed`);
const ready_elapsed = new Gauge(`ready_elapsed`);

const ready_success = new Rate(`ready_success`);
const match_success = new Rate(`match_success`);

const error_counter = new Counter(`error_counter`);

export default function () {
  const socket = new WebSocketWrapper(url, 1000);
  let expectMatch;

  socket.setOnError((error) => {
    console.error(error);
  });

  socket.setOnConnect(() => {
    socket
      .expectMessage(`established`, 5000)
      .catch((error) => {
        return Promise.reject(error);
      })
      .then((data) => {
        return socket.sendWithAck(`myping`, {}, 1000);
      })
      .catch((error) => {
        return Promise.reject(error);
      })
      .then((data) => {
        expectMatch = socket.expectMessage(`match`, 10000);
        return socket.sendWithAck(`ready`, {}, 1000);
      })
      .catch((error) => {
        ready_success.add(false);
        return Promise.reject(error);
      })
      .then((data) => {
        ready_success.add(true);
        ready_elapsed.add(data.elapsed);
        return expectMatch;
      })
      .catch((error) => {
        match_success.add(false);
        return Promise.reject(error);
      })
      .then((data) => {
        match_elapsed.add(data.elapsed);
        match_success.add(true);
      })
      .catch(() => {
        error_counter.add(1);
      })
      .finally(() => {
        socket.close();
      });
  });

  socket.listen();
}
