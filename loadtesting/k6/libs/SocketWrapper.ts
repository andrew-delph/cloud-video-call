import { Socket } from "k6/ws";
import { socketResponseCode, socketResponseType } from "./constants";
import { checkResponse, getArrayFromRequest, getCallbackId } from "./socket.io";

export class SocketWrapper {
  socket: Socket;
  callbackCount: number = 0;
  ackCallbackMap: { [key: number]: () => void } = {};
  eventMessageHandleMap: { [key: string]: () => void } = {};

  constructor(socket: Socket) {
    this.socket = socket;
    const self = this;

    socket.on("message", function incoming(msg) {
      self.handleMessage(msg);
    });
  }

  handleMessage(msg: string) {
    const response = checkResponse(msg);
    const type = response.type;
    const code = response.code;

    if (type !== socketResponseType.message) return;

    switch (code) {
      case socketResponseCode.ack: {
        const callbackId = getCallbackId(msg);
        const callback = this.ackCallbackMap[callbackId];
        if (callback != undefined) {
          delete this.ackCallbackMap[callbackId];
          callback();
        }
        break;
      }
      case socketResponseCode.event: {
        const msgObject = getArrayFromRequest(msg);
        console.log("msgObject", msgObject);
        break;
      }
    }
  }

  setEventMessageHandle(event: string, handler: () => void) {
    this.eventMessageHandleMap[event] = handler;
  }

  send(event: string, data: any, callback?: () => void) {
    if (callback == null) {
      this.socket.send(
        `${socketResponseType.message}${
          socketResponseCode.event
        }["${event}",${JSON.stringify(data)}]`
      );
    } else {
      this.callbackCount++;
      this.ackCallbackMap[this.callbackCount] = callback;
      this.socket.send(
        `${socketResponseType.message}${socketResponseCode.event}${
          this.callbackCount
        }["${event}",${JSON.stringify(data)}]`
      );
    }
  }

  sendWithAck(
    event: string,
    data: any,
    timeout: number,
    callback: (isSuccess: boolean, elapsed: number, data: any) => void
  ) {
    const startTime = Date.now();

    this.send(event, data, () => {
      const elapsed = Date.now() - startTime;
      const isSuccess = elapsed < timeout;
      callback(isSuccess, elapsed, {});
    });
  }
}
