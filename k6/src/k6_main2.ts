import { check } from 'k6';
import { Counter } from 'k6/metrics';
import { K6SocketIoMain } from '../libs/K6SocketIoMain';

export const options = {
  vus: 15,
  duration: `10s`,
};

const success_counter = new Counter(`andrew`);
export default function () {
  const secure = false;
  const domain = __ENV.HOST || `localhost:8888`;
  const url = `${
    secure ? `wss` : `ws`
  }://${domain}/socket.io/?EIO=4&transport=websocket`;
  const socket = new K6SocketIoMain(url);

  socket.setOnConnect(() => {
    socket
      .sendWithAck(`myping`, `ping1`)
      .then(() => {
        success_counter.add(1);
      })
      .finally(() => {
        socket.close();
      });
  });
  socket.connect();
}
