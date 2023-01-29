import { Socket } from "k6/ws";
import { socketResponseCode, socketResponseType } from "./constants";
import { checkResponse, getArrayFromRequest, getCallbackId } from "./socket.io";

export class SocketWrapper {
  socket: Socket;
  callbackCount: number = 0;
  ackCallbackMap: Record<string, (data: any) => void> = {};
  eventMessageHandleMap: Record<string, (data: any) => void> = {};

  constructor(socket: Socket) {
    this.socket = socket;
    const self = this;

    socket.on("message", function incoming(msg) {
      self.handleMessage(msg);
    });
  }

  handleMessage(msg: string) {
    // console.log("handlemsg:", msg);
    const response = checkResponse(msg);
    const type = response.type;
    const code = response.code;

    if (type !== socketResponseType.message) return;

    switch (code) {
      case socketResponseCode.ack: {
        const msgObject = getArrayFromRequest(msg);
        const callbackId = getCallbackId(msg);
        const callback = this.ackCallbackMap[callbackId];
        if (callback != undefined) {
          delete this.ackCallbackMap[callbackId];
          callback(msgObject);
        }
        break;
      }
      case socketResponseCode.event: {
        const msgObject = getArrayFromRequest(msg);
        const event = msgObject[0];
        const message = msgObject[1];
        const callback = this.eventMessageHandleMap[event];
        if (callback != undefined) {
          callback(message);
        } else {
          console.debug("no eventMessageHandle:", event);
        }
        break;
      }
    }
  }

  setEventMessageHandle(event: string, handler: (message: any) => void) {
    this.eventMessageHandleMap[event] = handler;
  }

  send(event: string, data: any, callback?: (data: any) => void) {
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

    this.send(event, data, (callbackData) => {
      const elapsed = Date.now() - startTime;
      const isSuccess = elapsed < timeout;
      callback(isSuccess, elapsed, callbackData);
    });
  }
}
