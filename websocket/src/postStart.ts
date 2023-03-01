import { getLogger } from 'react-video-call-common';
import { cleanAllSocketServer } from './management';
import { getServer } from './socketio_server';

const logger = getLogger();

logger.info(`postStart!`);

getServer(false).then(async () => {
  await cleanAllSocketServer();
});
