import ws, { Socket } from "k6/ws";
import { check, sleep } from "k6";
import { makeConnection } from "../libs/socket.io";
import { checkForEventMessages } from "../libs/socket.io";
import { socketResponseCode, socketResponseType } from "../libs/constants";
import { Counter, Trend } from "k6/metrics";

export const options = {
  vus: 50,
  duration: "15s",
  tags: {
    testName: "socketsio poc",
  },
};

const ready_success = new Counter("ready_success");
const ready_failure = new Counter("ready_failure");

export default function (): void {
  const secure = __ENV.REMOTE != undefined ? true : false;

  const domain = secure
    ? `react-video-call-fjutjsrlaa-uc.a.run.app`
    : `localhost:4000`;

  const sid = makeConnection(domain, secure);

  // Let's do some websockets
  const url = `${
    secure ? "wss" : "ws"
  }://${domain}/socket.io/?EIO=4&transport=websocket&sid=${sid}`;

  let response = ws.connect(url, {}, function (socket) {
    let callbackCount = 0;
    const callbackMap: { [key: number]: () => void } = {};

    socket.on("close", function close() {
      // console.log("disconnected");
    });

    socket.on("error", function (e) {
      console.log("error", JSON.stringify(e));
      if (e.error() != "websocket: close sent") {
        console.log("An unexpected error occured: ", e.error());
      }
    });

    // This will constantly poll for any messages received
    socket.on("message", function incoming(msg) {
      // checking for event messages
      checkForEventMessages<string[]>(msg, callbackMap, function (messageData) {
        // endTime = Date.now();
        // console.log(`
        //       ------------------------
        //       event=${messageData[0]}
        //       message=${messageData[1]}
        //       vu=${__VU.toString()}
        //       iter=${__ITER.toString()}
        //       time=${Date.now().toString()}
        //     `);
      });
    });

    // FUNCTIONS
    function send(event: string, data: any, callback?: () => void) {
      if (callback == null) {
        socket.send(
          `${socketResponseType.message}${
            socketResponseCode.event
          }["${event}",${JSON.stringify(data)}]`
        );
      } else {
        callbackCount++;
        callbackMap[callbackCount] = callback;
        socket.send(
          `${socketResponseType.message}${
            socketResponseCode.event
          }${callbackCount}["${event}",${JSON.stringify(data)}]`
        );
      }
    }

    function sendWithAck(
      event: string,
      data: any,
      timeout: number,
      callback: (isSuccess: boolean, elapsed: number, data: any) => void
    ) {
      const startTime = Date.now();

      send(event, data, () => {
        const elapsed = Date.now() - startTime;
        const isSuccess = elapsed < timeout;
        callback(isSuccess, elapsed, {});
      });
    }
    // FUNCTIONS END

    socket.on("open", function open() {
      socket.send("2probe");
      socket.send("5");
      socket.send("3");

      const readyEvent = () => {
        sendWithAck(
          "ready",
          { test: "looking for ack" },
          5000,
          (isSuccess: boolean, elapsed: number, data: any) => {
            if (isSuccess) ready_success.add(1);
            else ready_failure.add(1);
          }
        );
      };

      readyEvent();

      // socket.setInterval(function timeout() {
      //   socket.ping();
      //   console.log('Pinging every 1sec (setInterval test)');
      // }, 1000 * 5);
    });

    socket.setTimeout(function () {
      socket.close();
    }, 1000 * 2);
  });

  check(response, { "status is 101": (r) => r && r.status === 101 });
}
