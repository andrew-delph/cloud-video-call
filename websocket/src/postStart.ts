import { getLogger } from 'common';
import { cleanAllSocketServer } from './management';
import { getServer } from './socketio_server';

const logger = getLogger();

logger.info(`postStart!`);

getServer(false).then(async () => {
  await cleanAllSocketServer();
});
