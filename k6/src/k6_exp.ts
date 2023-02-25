import { Counter, Rate, Trend } from 'k6/metrics';
import { K6SocketIoExp } from '../libs/K6SocketIoExp';
import { randomString } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js';

const vus = 50;
export const options = {
  vus: 50,
  duration: `2h`,
  // scenarios: {
  //   matchTest: {
  //     executor: `ramping-vus`,
  //     startVUs: 0,
  //     stages: [
  //       { duration: `3m`, target: vus * 2 },
  //       { duration: `5m`, target: vus * 3 },
  //       { duration: `3m`, target: vus * 4 },
  //     ],
  //   },
  //   // longConnection: {
  //   //   executor: `ramping-vus`,
  //   //   exec: `longConnection`,
  //   //   startVUs: 0,
  //   //   stages: [
  //   //     { duration: `2m`, target: vus * 3 },
  //   //     { duration: `2h`, target: vus * 4 },
  //   //     { duration: `10m`, target: vus },
  //   //   ],
  //   // },
  // },
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
  let url = `${
    secure ? `wss` : `ws`
  }://${domain}/socket.io/?EIO=4&transport=websocket`;

  const auth = randomString(10);
  url = url + `&auth=${auth}`;

  const socket = new K6SocketIoExp(url);

  socket.setOnConnect(() => {
    let expectMatch: any;

    socket.on(`error`, () => {
      error_counter.add(1);
    });
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
      .finally(() => {
        socket.close();
      });
  });
  socket.connect();
}
