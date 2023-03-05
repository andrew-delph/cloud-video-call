import { K6SocketIoBase } from './K6SocketIoBase';
import ws, { Socket } from 'k6/ws';
export class K6SocketIoMain extends K6SocketIoBase {
  connect(): void {
    const socketIo = this;
    ws.connect(this.url, {}, function (socket: Socket) {
      socketIo.setSocket(socket);
    });
  }
  on(event: string, callback: (data: any) => void): void {
    this.socket.on(event, callback);
  }
  parseMessage(message: any): string {
    return message;
  }
}
