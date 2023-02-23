import { EventName, WebSocket } from 'k6/experimental/websockets';
import {
  setTimeout,
  clearTimeout,
  setInterval,
  clearInterval,
} from 'k6/experimental/timers';
import { sleep } from 'k6';

const chatRoomName = `publicRoom`; // choose any chat room name
const sessionDuration = 60000; // user session between 5s and 1m

export default function () {
  const ws = new WebSocket(
    `wss://test-api.k6.io/ws/crocochat/${chatRoomName}/`,
  );

  ws.addEventListener(`open`, () => {
    socket.send(`40`);
    sleep(2);

    // listen for messages/errors and log them into console
    ws.addEventListener(`message`, (e) => {
      const msg = JSON.parse(e.data);
      if (msg.event === `CHAT_MSG`) {
        console.log(
          `VU ${__VU}:${id} received: ${msg.user} says: ${msg.message}`,
        );
      } else if (msg.event === `ERROR`) {
        console.error(`VU ${__VU}:${id} received:: ${msg.message}`);
      } else {
        console.log(
          `VU ${__VU}:${id} received unhandled message: ${msg.message}`,
        );
      }
    });

    // send a message every 2-8 seconds
    const intervalId = setInterval(() => {
      ws.send(
        JSON.stringify({
          event: `SAY`,
          message: `I'm saying ${randomString(5)}`,
        }),
      );
    }, randomIntBetween(2000, 8000)); // say something every 2-8 seconds

    // after a sessionDuration stop sending messages and leave the room
    const timeout1id = setTimeout(function () {
      clearInterval(intervalId);
      console.log(
        `VU ${__VU}:${id}: ${sessionDuration}ms passed, leaving the chat`,
      );
      ws.send(JSON.stringify({ event: `LEAVE` }));
    }, sessionDuration);

    // after a sessionDuration + 3s close the connection
    const timeout2id = setTimeout(function () {
      console.log(`Closing the socket forcefully 3s after graceful LEAVE`);
      ws.close();
    }, sessionDuration + 3000);

    // when connection is closing, clean up the previously created timers
    ws.addEventListener(`close`, () => {
      clearTimeout(timeout1id);
      clearTimeout(timeout2id);
      console.log(`VU ${__VU}:${id}: disconnected`);
    });
  });
}
