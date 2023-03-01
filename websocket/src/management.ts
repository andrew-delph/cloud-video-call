import { delay, getLogger } from 'react-video-call-common';
import { mainRedisClient } from './socketio_server';

const logger = getLogger();

const getServerHeartbeatKey = () => {
  return `socketio_server_heatbeat_${process.env.HOSTNAME}`;
};

export const registerServerHeartbeat = async () => {
  // register time to server heartbeat key
  const time = await mainRedisClient.time();
  await mainRedisClient.set(getServerHeartbeatKey(), time[0]);
};

const registerSocket = () => {};

const registerSocketReady = () => {};

const cleanSocket = () => {};

const cleanSocketServer = async (server_hostname: string) => {
  mainRedisClient.set(`cleanup${server_hostname}`, `done`);
};

export const cleanMySocketServer = async () => {
  await cleanSocketServer(process.env.HOSTNAME as string);
};
