import { mainRedisClient } from './socketio_server';

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

const cleanSocketServer = (server_hostname: string) => {};
