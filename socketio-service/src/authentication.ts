import { cleanSocket, registerSocket } from './management';
import { mainRedisClient } from './socketio_server';
import { getLogger, getUserId } from 'common';
import * as common from 'common';
import { Socket } from 'socket.io';

const logger = getLogger();

export const auth_middleware = async (
  socket: Socket,
  next: (err?: any) => void,
) => {
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
  let uid: string = await getUserId(auth).catch((error) => {
    logger.debug(`getUid error: ${error}`);
    next(error);
    return;
  });

  socket.data.auth = uid;

  if (await mainRedisClient.hexists(common.connectedAuthMapName, uid)) {
    logger.debug(`User already connected: ${uid}`);
    next(new Error(`User already connected: ${uid}`));
    return;
  }

  socket.on(`disconnect`, async () => {
    await cleanSocket(uid);
  });

  await registerSocket(socket);

  next();
};
