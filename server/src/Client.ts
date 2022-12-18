import { Socket } from "socket.io";

export class Client {
  private socket: Socket;

  private roomID: string | undefined = undefined;

  constructor(socket: Socket) {
    this.socket = socket;
    this.roomID = undefined;
  }

  getSocket(): Socket {
    return this.socket;
  }

  getRoomId(): string | undefined {
    return this.roomID;
  }

  setRoomId(roomID: string): void {
    this.roomID = roomID;
  }
}
