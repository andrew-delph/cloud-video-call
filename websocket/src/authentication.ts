import { getLogger } from 'react-video-call-common';
import { Socket } from 'socket.io';
import { mainRedisClient } from './socketio_server';

const connectedAuthMapName = `connectedAuthMapName`;

const logger = getLogger();

export const auth_middleware = async (
  socket: Socket,
  next: (err?: any) => void,
) => {
  const auth: string =
    typeof socket.handshake.query.auth == `string`
      ? socket.handshake.query.auth
      : ``;

  if (!auth) {
    logger.debug(`Authentication token missing`);
    next(new Error(`Authentication token missing`));
    return;
  }
  if (typeof auth != `string`) {
    logger.debug(`Authentication format error`);
    next(new Error(`Authentication format error`));
    return;
  }

  if (await mainRedisClient.hexists(connectedAuthMapName, auth)) {
    logger.debug(`User already connected: ${auth}`);
    next(new Error(`User already connected`));
    return;
  }

  socket.on(`disconnect`, async () => {
    await mainRedisClient.hdel(connectedAuthMapName, auth, socket.id);
  });

  await mainRedisClient.hset(connectedAuthMapName, auth, socket.id);

  next();
};
