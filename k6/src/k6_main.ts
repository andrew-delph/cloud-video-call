import { EventName, WebSocket } from 'k6/experimental/websockets';

import ws, { Socket } from 'k6/ws';
import { check, sleep } from 'k6';
import { Counter, Trend } from 'k6/metrics';
import { SocketWrapper } from '../libs/SocketWrapper';

// export const options = {
//   // stages: [{ duration: "10s", target: 50 }],
//   vus: 2000,
//   duration: `1h`,
// };

const vus = 500;
export const options = {
  // vus: vus * 3,
  // duration: `2h`,
  scenarios: {
    matchTest: {
      executor: `ramping-vus`,
      startVUs: 0,
      stages: [
        // { duration: `5m`, target: vus * 2 },
        // { duration: `2h`, target: vus * 3 },
        // { duration: `10m`, target: vus },
        { duration: `5m`, target: vus * 2 },
        { duration: `2h`, target: vus * 2 },
        { duration: `10m`, target: 20 },
      ],
    },
    longConnection: {
      executor: `ramping-vus`,
      exec: `longConnection`,
      startVUs: 0,
      stages: [
        { duration: `2m`, target: vus * 3 },
        { duration: `2h`, target: vus * 4 },
        { duration: `10m`, target: vus },
      ],
    },
  },
};

const ready_waiting_time = new Trend(`ready_waiting_time`, true);

const match_waiting_time = new Trend(`match_waiting_time`, true);

export default function (): void {
  // const secure = __ENV.REMOTE == "true" ? true : false;

  // const domain = secure
  //   ? `react-video-call-fjutjsrlaa-uc.a.run.app`
  //   : `34.27.73.223`;

  const secure = false;
  const domain = __ENV.HOST || `localhost:8080`;

  // Let's do some websockets
  const url = `${
    secure ? `wss` : `ws`
  }://${domain}/socket.io/?EIO=4&transport=websocket`;

  const response = ws.connect(url, {}, function (socket) {
    const socketWrapper = new SocketWrapper(socket);

    const readyEvent = () => {
      socketWrapper!.listen(
        `match`,
        90000,
        (
          isSuccess: boolean,
          elapsed: number,
          data: any,
          callback?: (data: any) => void,
        ) => {
          check(isSuccess, { 'match event': (r) => r });

          if (callback) callback(`from k6 test...`);

          if (isSuccess) {
            match_waiting_time.add(elapsed);
            socket.close();
          } else {
            // console.log("match failure:" + data);
          }
        },
      );

      socketWrapper!.sendWithAck(
        `ready`,
        { test: `looking for ack` },
        90000,
        (isSuccess: boolean, elapsed: number, data: any) => {
          check(isSuccess, { 'ready event': (r) => r });
          if (isSuccess) {
            ready_waiting_time.add(elapsed);
          } else {
            // console.log("ready failure:" + data);
          }
        },
      );
    };

    socketWrapper.setOnConnect(() => {
      sleep(2); // TODO test without this
      readyEvent();
    });

    socketWrapper.setEventMessageHandle(`message`, (msg: any) => {
      // console.log("message:", msg);
    });

    socketWrapper.setEventMessageHandle(`myping`, (msg: any, callback) => {
      if (callback) callback(`k6 myping ack`);
    });

    socket.on(`close`, function close() {
      check(socketWrapper, {
        'socketWrapper connected': (sw) => sw != null && sw.connected,
      });
      socketWrapper!.failWaitingEvents();
    });

    socket.on(`error`, function (e) {
      // check(false, { 'there was an error': (r) => r });
      console.log(`error`, JSON.stringify(e));
      if (e.error() != `websocket: close sent`) {
        console.log(`An unexpected error occured: `, e.error());
      }
    });

    socket.on(`open`, () => {
      socket.send(`40`);
    });

    socket.setTimeout(function () {
      socket.close();
    }, 1000 * 60 * 2);
  });

  check(response, { 'status is 101': (r) => r && r.status === 101 });
}

export function longConnection(): void {
  /*
  connect for a long time and send pings.3
  */
  const secure = false;
  const domain = __ENV.HOST || `34.69.116.114:80`; // `localhost:8080`

  // Let's do some websockets
  const url = `${
    secure ? `wss` : `ws`
  }://${domain}/socket.io/?EIO=4&transport=websocket`;

  const response = ws.connect(url, {}, function (socket) {
    const socketWrapper = new SocketWrapper(socket);

    socketWrapper.setEventMessageHandle(`myping`, (msg: any, callback) => {
      if (callback) callback(`k6 myping ack`);
    });

    socketWrapper.setOnConnect(() => {
      sleep(2);

      socket.setInterval(() => {
        console.log(`hi`);
        socketWrapper!.sendWithAck(
          `myping`,
          { test: `looking for ack` },
          90000,
          (isSuccess: boolean, elapsed: number, data: any) => {
            check(isSuccess, { 'longConnection ping': (r) => r });
          },
        );
      }, 10000);
    });

    socket.on(`open`, () => {
      socket.send(`40`);
    });

    socket.setTimeout(function () {
      socket.close();
    }, 1000 * 40);
  });

  check(response, {
    'status is 101': (r) => r && r.status === 101,
  });
}
