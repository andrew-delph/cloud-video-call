import { EventName, WebSocket } from 'k6/experimental/websockets';
import { Rate, Gauge, Trend, Counter } from 'k6/metrics';
import {
  setTimeout,
  clearTimeout,
  setInterval,
  clearInterval,
} from 'k6/experimental/timers';
import { sleep } from 'k6';
import { WebSocketWrapper } from '../libs/WebSocketWrapper';

const established_elapsed = new Trend(`established_elapsed`, true);
const match_elapsed = new Trend(`match_elapsed`, true);
const ready_elapsed = new Trend(`ready_elapsed`, true);

const established_success = new Rate(`established_success`);
const ready_success = new Rate(`ready_success`);
const match_success = new Rate(`match_success`);

const error_counter = new Counter(`error_counter`);

export const options = {
  vus: 300,
  duration: `60s`,
  // thresholds: {
  //   established_success: [`rate>0.95`],
  //   ready_success: [`rate>0.95`],
  //   match_success: [`rate>0.95`],
  // },
};

const secure = false;
const domain = __ENV.HOST || `localhost:8888`;
const url = `${
  secure ? `wss` : `ws`
}://${domain}/socket.io/?EIO=4&transport=websocket`;

export default function () {
  const socket = new WebSocketWrapper(url);
  let expectMatch;

  socket.setOnConnect(() => {
    socket
      .expectMessage(`established`)
      .catch((error) => {
        established_success.add(false);
        return Promise.reject(error);
      })
      .then((data) => {
        established_success.add(true);
        established_elapsed.add(data.elapsed);
        return socket.sendWithAck(`myping`, {});
      })
      .catch((error) => {
        return Promise.reject(error);
      })
      .then((data) => {
        expectMatch = socket.expectMessage(`match`);
        return socket.sendWithAck(`ready`, {});
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
      .catch((error) => {
        console.log(error);
        error_counter.add(1);
      })
      .finally(() => {
        socket.close();
      });
  });

  socket.listen();
}
