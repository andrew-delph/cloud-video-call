import { check, sleep } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';
import { K6SocketIoExp } from '../libs/K6SocketIoExp';
import { WebSocketWrapper } from '../libs/old/WebSocketWrapper';

export const options = {
  vus: 200,
  duration: `10s`,
};

const established_elapsed = new Trend(`established_elapsed`, true);
const match_elapsed = new Trend(`match_elapsed`, true);
const ready_elapsed = new Trend(`ready_elapsed`, true);

const established_success = new Rate(`established_success`);
const ready_success = new Rate(`ready_success`);
const match_success = new Rate(`match_success`);

const error_counter = new Counter(`error_counter`);
const success_counter = new Counter(`success_counter`);

export default function () {
  const secure = false;
  const domain = __ENV.HOST || `localhost:8888`;
  const url = `${
    secure ? `wss` : `ws`
  }://${domain}/socket.io/?EIO=4&transport=websocket`;
  const socket = new K6SocketIoExp(url);

  socket.setOnConnect(() => {
    let expectMatch: any;
    socket
      .expectMessage(`established`)
      .catch((error) => {
        established_success.add(false);
        return Promise.reject(error);
      })
      .then((data: any) => {
        established_success.add(true);
        established_elapsed.add(data.elapsed);

        expectMatch = socket.expectMessage(`match`);
        const readyPromise = socket.sendWithAck(`ready`, {});
        return readyPromise;
      })
      .catch((error) => {
        ready_success.add(false);
        return Promise.reject(error);
      })
      .then((data: any) => {
        ready_success.add(true);
        ready_elapsed.add(data.elapsed);
        return expectMatch;
      })
      .catch((error) => {
        match_success.add(false);
        return Promise.reject(error);
      })
      .then((data: any) => {
        if (typeof data.callback === `function`) {
          data.callback(`ok`);
        }
        match_success.add(true);
        match_elapsed.add(data.elapsed);
        success_counter.add(1);
      })
      .catch(() => {
        error_counter.add(1);
      })
      .finally(() => {
        socket.close();
      });
  });
  socket.connect();
}
