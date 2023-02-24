import { check } from 'k6';
import { K6SocketIoExp } from '../libs/K6SocketIoExp';

export const options = {
  //   vus: 15,
  //   duration: `10s`,
};

export default function () {
  const secure = false;
  const domain = __ENV.HOST || `localhost:8888`;
  const url = `${
    secure ? `wss` : `ws`
  }://${domain}/socket.io/?EIO=4&transport=websocket`;
  const socket = new K6SocketIoExp(url);
  socket.setOnConnect(() => {
    console.log(`connected`);
    socket
      .expectMessage(`established`)
      .then((data) => {
        console.log(`established!!`);
        // ping = socket.sendWithAck(`myping`, `ping2`);
        return socket.sendWithAck(`myping`, `ping1`);
      })
      .then((data: any) => {
        check(data, {
          ping1: (data) => data && data.data[0] == `ping1`,
        });
      })
      .catch((error) => {
        check(false, {
          errror: () => false,
        });
        console.error(`error`, error);
      })
      .finally(() => {
        socket.close();
      });
  });
  socket.connect();
  console.log(`DONE`);
}
