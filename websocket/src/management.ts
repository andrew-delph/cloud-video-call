import { delay, getLogger } from 'react-video-call-common';
import { mainRedisClient, pubRedisClient } from './socketio_server';
import { Socket } from 'socket.io';
import * as common from 'react-video-call-common';

const logger = getLogger();

const socketio_server_heartbeat = `socketio_server_heartbeat`;

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

export const cleanSocket = async (
  auth: string,
  server_key: string = getServerKey(),
) => {
  await mainRedisClient.hdel(common.connectedAuthMapName, auth);
  await mainRedisClient.srem(common.activeSetName, auth);
  await mainRedisClient.srem(common.readySetName, auth);
  await pubRedisClient.publish(common.activeCountChannel, `change`);
  await mainRedisClient.srem(server_key, auth);
};

const cleanSocketServer = async (server_hostname: string) => {
  mainRedisClient.set(`cleanup${server_hostname}`, `done`);
};

export const cleanMySocketServer = async () => {
  await cleanSocketServer(process.env.HOSTNAME as string);
};
