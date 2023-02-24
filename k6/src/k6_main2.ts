import { check } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';
import { K6SocketIoMain } from '../libs/K6SocketIoMain';

export const options = {
  // vus: 15,
  // duration: `10s`,
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
  const socket = new K6SocketIoMain(url);

  socket.setOnConnect(() => {
    socket
      .expectMessage(`established`)
      .catch((error) => {
        established_success.add(false);
        return Promise.reject(error);
      })
      .then((data: any) => {
        console.log(`established`);
        established_success.add(true);
        established_elapsed.add(data.elapsed);
        return socket.sendWithAck(`ready`, {});
      })
      .catch((error) => {
        ready_success.add(false);
        return Promise.reject(error);
      })
      .then((data: any) => {
        console.log(`got ready`);
        ready_success.add(true);
        ready_elapsed.add(data.elapsed);
      })
      .finally(() => {
        console.log(`finally`);
        socket.close();
      });
  });
  socket.connect();
}
