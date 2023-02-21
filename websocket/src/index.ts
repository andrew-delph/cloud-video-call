import cluster from 'cluster';
import { cpus } from 'os';
import * as http from 'http';

import { setupMaster, setupWorker } from '@socket.io/sticky';

import { getServer } from './websocket';

import * as common from 'react-video-call-common';

const logger = common.getLogger();

common.listenGlobalExceptions();

const numCPUs = cpus().length > 3 ? 3 : cpus().length;

if (cluster.isPrimary) {
  logger.info(`Master ${process.pid} is running with #${numCPUs} cpus.`);

  const httpServer = http.createServer();

  // setup sticky sessions
  setupMaster(httpServer, {
    loadBalancingMethod: `least-connection`,
  });

  // needed for packets containing buffers (you can ignore it if you only send plaintext objects)
  // Node.js < 16.0.0
  //   cluster.setupMaster({
  //     serialization: `advanced`,
  //   });
  // Node.js > 16.0.0
  cluster.setupPrimary({});

  httpServer.listen(4000);

  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on(`exit`, (worker) => {
    logger.warn(
      `Worker ${worker.process.pid} died with code ${worker.process.exitCode}`,
    );
    cluster.fork();
  });
} else {
  logger.info(`Worker ${process.pid} started`);

  getServer(false).then((io) => {
    setupWorker(io);
  });
}
