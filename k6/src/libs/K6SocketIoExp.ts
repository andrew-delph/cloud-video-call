import { K6SocketIoBase } from './K6SocketIoBase';
import { WebSocket } from 'k6/experimental/websockets';

export class K6SocketIoExp extends K6SocketIoBase {
  connect(): void {
    const socketIo = this;
    socketIo.setSocket(new WebSocket(this.url, null, this.params));
    this.socket.addEventListener(`open`, () => {});
  }
  on(event: string, callback: (data: any) => void): void {
    this.socket.addEventListener(event, callback);
  }
  parseMessage(message: any): string {
    return message.data;
  }
}
