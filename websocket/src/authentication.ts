import { getLogger } from 'react-video-call-common';
import { Socket } from 'socket.io';
import { mainRedisClient } from './socketio_server';

import * as common from 'react-video-call-common';
import { cleanSocket, registerSocket } from './management';

const logger = getLogger();

export const auth_middleware = async (
  socket: Socket,
  next: (err?: any) => void,
) => {
  logger.error(`HERE`);
  const auth: string = socket.handshake?.auth?.auth;

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

  if (await mainRedisClient.hexists(common.connectedAuthMapName, auth)) {
    logger.debug(`User already connected: ${auth}`);
    next(new Error(`User already connected`));
    return;
  }

  // socket.auth = auth;
  socket.data.auth = auth;

  socket.on(`disconnect`, async () => {
    await cleanSocket(auth);
  });

  await registerSocket(socket);

  next();
};
