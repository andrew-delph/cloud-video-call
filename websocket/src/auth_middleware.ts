import { Socket } from 'socket.io';

export const auth_middleware = (socket: Socket, next: (err?: any) => void) => {
  const { query } = socket.handshake;

  const auth: string = socket.handshake.headers[`auth`] as string;

  if (query && query.token) {
    next();
  } else {
    // Deny the connection
    next(new Error(`Authentication token missing`));
  }
};
