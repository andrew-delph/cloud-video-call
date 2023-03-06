import { getLogger } from 'react-video-call-common';
import { Socket } from 'socket.io';
import { mainRedisClient } from './socketio_server';

import * as common from 'react-video-call-common';
import { cleanSocket, registerSocket } from './management';

import { getAuth } from 'firebase-admin/auth';

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

  await getAuth()
    .verifyIdToken(auth)
    .then(async (decodedToken: { uid: any }) => {
      const uid = decodedToken.uid;
      socket.data.auth = uid;

      if (await mainRedisClient.hexists(common.connectedAuthMapName, uid)) {
        logger.debug(`User already connected: ${uid}`);
        next(new Error(`User already connected`));
        return;
      }

      logger.debug(`firebase auth uid: ${uid} , auth: ${auth}`);

      socket.on(`disconnect`, async () => {
        await cleanSocket(uid);
      });

      await registerSocket(socket);

      next();
    })
    .catch((error) => {
      logger.debug(`firebase auth error: ${error}`);
      next(error);
      return;
    });

  // socket.auth = auth;
};
