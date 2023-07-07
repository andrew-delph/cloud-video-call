import { K6SocketIoBase } from './K6SocketIoBase';
import { socketio-service } from 'k6/experimental/socketio-services';

export class K6SocketIoExp extends K6SocketIoBase {
  connect(): void {
    const socketIo = this;
    socketIo.setSocket(new socketio-service(this.url, null, this.params));
    this.socket.addEventListener(`open`, () => {});
  }
  on(event: string, callback: (data: any) => void): void {
    this.socket.addEventListener(event, callback);
  }
  parseMessage(message: any): string {
    return message.data;
  }
}
