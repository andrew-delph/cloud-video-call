import { EventName, WebSocket } from 'k6/experimental/websockets';
import { responseCode, responseType } from './constants';
import { checkResponse, getArrayFromRequest, getCallbackId } from './socket.io';
import { uuidv4 as uuid } from 'https://jslib.k6.io/k6-utils/1.4.0/index.js';
import { sleep } from 'k6';

export class WebSocketWrapper {
  socket;

  callbackCount = 0;
  ackCallbackMap = {};
  connected = false;
  onConnect = false;
  eventMessageHandleMap = {};
  waitingEventMap = {};

  constructor(url) {
    this.socket = new WebSocket(url);
    this.socket.addEventListener(`message`, (msg) => {
      this.handleMessage(msg.data);
    });
    this.socket.addEventListener(`error`, (error) => {
      console.error(`socket wrapper:`, error);
    });
    this.socket.addEventListener(`close`, () => {
      console.log(`socket wrapper:`, `closed`);
    });
  }

  listen() {
    this.socket.addEventListener(`open`, () => {});
  }

  close() {
    this.socket.close();
  }

  setOnConnect(callback) {
    this.onConnect = callback;
  }

  handleMessage(msg) {
    const response = checkResponse(msg);
    const type = response.type;
    const code = response.code;

    if (type == responseType.open) {
      this.socket.send(`40`);
      return;
    }

    switch (code) {
      case responseCode.connect: {
        if (this.onConnect != null) this.onConnect();
        this.connected = true;
        break;
      }
      case responseCode.ack: {
        const msgObject = getArrayFromRequest(msg);
        const callbackId = getCallbackId(msg);
        const callback = this.ackCallbackMap[callbackId];
        if (callback != undefined) {
          delete this.ackCallbackMap[callbackId];
          callback(msgObject);
        }
        break;
      }
      case responseCode.event: {
        const msgObject = getArrayFromRequest(msg);
        const event = msgObject[0];
        const message = msgObject[1];
        const callbackId = getCallbackId(msg);
        const callback = !Number.isNaN(callbackId)
          ? (data) => {
              this.sendAck(callbackId, data);
            }
          : undefined;

        const eventMessageHandle = this.eventMessageHandleMap[event];
        if (eventMessageHandle != undefined) {
          eventMessageHandle(message, callback);
        } else {
          console.debug(`no eventMessageHandle:`, event);
        }
        break;
      }
    }
  }

  setEventMessageHandle(event, handler) {
    this.eventMessageHandleMap[event] = handler;
  }

  expectMessage(event, timeout) {
    const startTime = Date.now();
    const waitingEventId = uuid();
    const wrapper = this;

    return new Promise(function (resolve, reject) {
      wrapper.waitingEventMap[waitingEventId] = reject;

      const eventMessageHandle = (data, callback) => {
        const elapsed = Date.now() - startTime;
        const isSuccess = elapsed < timeout;
        delete wrapper.waitingEventMap[waitingEventId];

        if (isSuccess) {
          resolve({ data, callback });
        } else {
          reject(`timeout reached`);
        }
      };
      wrapper.eventMessageHandleMap[event] = eventMessageHandle;
    });
  }

  send(event, data, callback) {
    if (callback == null) {
      this.socket.send(
        `${responseType.message}${
          responseCode.event
        }["${event}",${JSON.stringify(data)}]`,
      );
    } else {
      this.callbackCount++;
      this.ackCallbackMap[this.callbackCount] = callback;
      this.socket.send(
        `${responseType.message}${responseCode.event}${
          this.callbackCount
        }["${event}",${JSON.stringify(data)}]`,
      );
    }
  }

  sendWithAck(event, data, timeout, callback) {
    const startTime = Date.now();
    const waitingEventId = uuid();

    const wrapper = this;

    return new Promise(function (resolve, reject) {
      wrapper.waitingEventMap[waitingEventId] = reject;
      wrapper.send(event, data, (callbackData) => {
        const elapsed = Date.now() - startTime;
        const isSuccess = elapsed < timeout;
        delete wrapper.waitingEventMap[waitingEventId];

        if (isSuccess) {
          resolve({ data: callbackData });
        } else {
          reject(`timeout reached`);
        }
      });
    });
  }

  sendAck(callbackId, data) {
    this.socket.send(
      `${responseType.message}${responseCode.ack}${callbackId}[${JSON.stringify(
        data,
      )}]`,
    );
  }

  failWaitingEvents() {
    for (const waitingEvent of Object.values(this.waitingEventMap)) {
      waitingEvent(`failed wait event.`);
    }
  }
}
