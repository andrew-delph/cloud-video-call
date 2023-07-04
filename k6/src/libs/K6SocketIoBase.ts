import { uuidv4 as uuid } from 'https://jslib.k6.io/k6-utils/1.4.0/index.js';
import { check } from 'k6';
import { setTimeout, clearTimeout } from 'k6/experimental/timers';
import { ReplaySubject, take } from 'rxjs';

class CustomReplaySubject extends ReplaySubject<any> {
  take(num: number): Promise<any> {
    return this.pipe(take(num)).toPromise();
  }
}

export enum responseType {
  open,
  close,
  ping,
  pong,
  message,
  upgrade,
  noop,
}

export enum responseCode {
  connect,
  disconnect,
  event,
  ack,
  error,
}

export interface soResponse {
  type: number;
  code: number;
}

export function checkResponse(response: string): soResponse {
  return { type: parseInt(response[0]), code: parseInt(response[1]) };
}

export function getCallbackId(response: string): number {
  return parseInt(response.slice(2));
}

export function getArrayFromRequest(response: string): string[] {
  const match = /\[.+\]/;
  const parsedResponse = response.match(match);
  return parsedResponse ? JSON.parse(parsedResponse[0]) : [];
}

export abstract class K6SocketIoBase {
  socket: any;

  connected = false;
  hasError = false;
  callbackCount = 0;
  onConnect: (() => void) | undefined;
  onClose: (() => void) | undefined;
  ackCallbackMap: Record<string, (data: any) => void> = {};
  eventMessageHandleMap: Record<
    string,
    (data: any, callback?: (data: any) => void) => void
  > = {};
  waitingEventMap: Record<string, (data: any) => void> = {};
  url: string;
  max_time: number;

  auth: any = false;
  params: any;

  constructor(
    url: string,
    auth: any = {},
    params: any = {},
    max_time: number = 0,
  ) {
    this.url = url;
    this.auth = auth;
    this.params = params;
    this.max_time = max_time;
  }

  abstract connect(): void;

  abstract on(event: string, callback: (data: any) => void): void;

  abstract parseMessage(message: any): string;

  setSocket(socket: any): void {
    this.socket = socket;
    this.on(`message`, (msg) => {
      this.handleMessage(this.parseMessage(msg));
    });
    this.on(`error`, (msg) => {
      this.hasError = true;
      console.error(`on_error: ${JSON.stringify(msg)}`);
    });
    let max_time_timeout: number;
    if (this.max_time != 0) {
      max_time_timeout = setTimeout(() => {
        console.error(`max_time_timeout reached of ${this.max_time}`);
        this.close();
      }, this.max_time);
    }
    this.on(`close`, async () => {
      if (this.onClose != null) await this.onClose();
      clearTimeout(max_time_timeout);
      this.closeWaitingEvents();
      check(this.connected, { 'connection made': (r) => r });
      check(this.hasError, { 'no error': (r) => !r });
    });
  }

  listen() {
    this.on(`open`, () => {});
  }

  close() {
    this.socket.close();
  }

  setOnConnect(callback: () => void) {
    this.onConnect = callback;
  }

  setOnClose(callback: () => void) {
    this.onClose = callback;
  }

  handleMessage(msg: string) {
    const response = checkResponse(msg);
    const type = response.type;
    const code = response.code;

    if (type == responseType.open) {
      this.socket.send(`40${this.auth ? JSON.stringify(this.auth) : ``}`);
      return;
    }

    if (type == responseType.ping) {
      this.socket.send(`3`);
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
          ? (data: any) => {
              this.sendAck(callbackId, data);
            }
          : undefined;
        const eventMessageHandle = this.eventMessageHandleMap[event];
        if (eventMessageHandle != undefined) {
          eventMessageHandle(message, callback);
        } else {
          if (event == `message` || event == `activeCount`) break;
          // console.log(`no eventMessageHandle:`, event);
        }
        break;
      }
      case responseCode.error: {
        console.error(`responseCode.error:`, msg);
        this.close();
        break;
      }
    }
  }

  setEventMessageHandle(event: any, handler: any) {
    this.eventMessageHandleMap[event] = handler;
  }

  send(event: string, data: any, callback: any) {
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

  sendAck(callbackId: number, data: any) {
    this.socket.send(
      `${responseType.message}${responseCode.ack}${callbackId}[${JSON.stringify(
        data,
      )}]`,
    );
  }

  expectMessage(
    event: string,
    timeout = 0,
    expected_num = 1,
  ): CustomReplaySubject {
    const startTime = Date.now();
    const waitingEventId: string = `${event}-${uuid()}`;
    const wrapper = this;
    let recieved_num = 0;

    const expectSubject = new CustomReplaySubject();

    const eventMessageHandle = (data: any, callback: any) => {
      // console.log(`got expected msg`, event, data);
      recieved_num = recieved_num + 1;
      const elapsed = Date.now() - startTime;
      const isSuccess = elapsed < timeout || timeout == 0;

      if (recieved_num == expected_num) {
        delete wrapper.waitingEventMap[waitingEventId];
        delete wrapper.eventMessageHandleMap[event];
      }

      if (isSuccess) {
        expectSubject.next({ data, callback, elapsed });
      } else {
        expectSubject.error(Error(`timeout reached for ${waitingEventId}`));
      }
    };
    wrapper.setEventMessageHandle(event, eventMessageHandle);
    wrapper.waitingEventMap[waitingEventId] = expectSubject.error;

    return expectSubject;
  }

  sendWithAck(event: string, data: any, timeout = 0) {
    const startTime = Date.now();
    const waitingEventId = uuid();

    const wrapper = this;

    return new Promise(function (resolve, reject) {
      wrapper.waitingEventMap[waitingEventId] = reject;
      wrapper.send(event, data, (callbackData: any) => {
        const elapsed = Date.now() - startTime;
        const isSuccess = elapsed < timeout;
        delete wrapper.waitingEventMap[waitingEventId];

        if (isSuccess || timeout == 0) {
          resolve({ data: callbackData, elapsed });
        } else {
          reject(`timeout reached`);
        }
      });
    });
  }

  sleep(ms: number) {
    return new Promise<void>((resolve, reject) => {
      setTimeout(() => {
        resolve();
      }, ms);
    });
  }

  closeWaitingEvents() {
    for (const waitingEvent of Object.entries(this.waitingEventMap)) {
      const eventId = waitingEvent[0];
      const reject = waitingEvent[1];
      reject(`closeWaitingEvents: ${eventId}`);
    }
  }
}
