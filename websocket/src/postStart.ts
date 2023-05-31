import { cleanAllSocketServer } from './management';
import { getServer } from './socketio_server';
import { getLogger } from 'common';

const logger = getLogger();

logger.info(`postStart!`);

getServer(false).then(async () => {
  await cleanAllSocketServer();
});
