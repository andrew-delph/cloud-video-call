import { io, mainRedisClient, pubRedisClient } from './socketio-server';
import { delay, getLogger } from 'common';
import * as common from 'common';
import { Socket } from 'socket.io';

const logger = getLogger();

const getServerKey = () => {
  return `socketio_server_${process.env.HOSTNAME}`;
};

const heartbeatPrefix = `socketio_headbeat_`;
export const registerServerHeartbeat = async () => {
  // register time to server heartbeat key
  const time = await mainRedisClient.time();
  await mainRedisClient.set(heartbeatPrefix + getServerKey(), time[0]);
};

export const registerSocket = async (socket: Socket) => {
  await mainRedisClient.hset(
    common.connectedAuthMapName,
    socket.data.auth,
    socket.id,
  );
  await mainRedisClient.sadd(common.activeSetName, socket.data.auth);
  await mainRedisClient.sadd(getServerKey(), socket.data.auth);
};

export const registerSocketReady = async (socket: Socket) => {
  await mainRedisClient.sadd(common.readySetName, socket.data.auth);
};
export const unregisterSocketReady = async (socket: Socket) => {
  await mainRedisClient.srem(common.readySetName, socket.data.auth);
};

export const cleanSocket = async (
  auth: string,
  server_key: string = getServerKey(),
) => {
  const socket_id = await mainRedisClient.hget(
    common.connectedAuthMapName,
    auth,
  );
  if (socket_id) {
    io.in(socket_id).disconnectSockets();
  }
  await common.updateRecentlyActiveUser(mainRedisClient, auth);
  await mainRedisClient.hdel(common.connectedAuthMapName, auth);
  await mainRedisClient.srem(common.activeSetName, auth);
  await mainRedisClient.srem(common.readySetName, auth);
  await pubRedisClient.publish(common.activeCountChannel, `change`);
  await mainRedisClient.srem(server_key, auth);
  logger.debug(`completed cleanSocket ${auth}`);
};

export const cleanSocketServer = async (
  server_hostname: string = getServerKey(),
) => {
  const connectedAuths = await mainRedisClient.smembers(server_hostname);
  logger.debug(
    `cleanSocketServer server_hostname=${server_hostname} connectedAuths=${connectedAuths}`,
  );

  for (const auth of connectedAuths) {
    await cleanSocket(auth, server_hostname);
  }
  await mainRedisClient.del(heartbeatPrefix + server_hostname);
  logger.debug(`completed cleanSocketServer for ${server_hostname}`);
};

export const cleanAllSocketServer = async () => {
  logger.debug(`cleanAllSocketServer`);
  await common
    .redisScanKeys(mainRedisClient, heartbeatPrefix + `*`)
    .then(async (heartbeat_ids) => {
      for (const heartbeat_id of heartbeat_ids) {
        const time = (await mainRedisClient.time())[0];
        const heartbeat_time = await mainRedisClient.get(heartbeat_id);
        if (heartbeat_time == null) {
          continue;
        }

        if (time - parseFloat(heartbeat_time) > 60) {
          logger.error(
            `cleanAllSocketServer ${heartbeat_id} : ${
              time - parseFloat(heartbeat_time)
            }`,
          );
          await cleanSocketServer(
            heartbeat_id.substring(heartbeatPrefix.length),
          );
        }
      }
      logger.debug(`cleanAllSocketServer completed`);
    });
};
