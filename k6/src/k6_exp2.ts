import { check, sleep } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';
import { K6SocketIoExp } from '../libs/K6SocketIoExp';

export const options = {
  vus: 1,
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

  console.log(`starting`);

  socket.setOnConnect(() => {
    console.log(`CONNECTED!!!`);
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
        return socket.sendWithAck(`ready`, {});
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
      .then((data) => {
        console.log(`here`);
        success_counter.add(1);
        match_elapsed.add(data.elapsed);
        match_success.add(true);
        check(true, { match: (r) => r });
      })
      .catch((error) => {
        console.log(error);
        error_counter.add(1);
        check(false, { match: (r) => r });
      })
      .finally(() => {
        console.log(`finally`);
        socket.close();
      });
  });
  socket.connect();
}
