import { cleanAllSocketServer } from './management';
import { getServer } from './socketio_server';

getServer(false).then(async () => {
  await cleanAllSocketServer();
});
