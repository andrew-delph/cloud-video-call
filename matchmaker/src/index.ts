import { startReadyConsumer } from './matchmaker';
import cluster from 'cluster';
import { cpus } from 'os';
import { listenGlobalExceptions } from 'common';
import * as common from 'common';

listenGlobalExceptions();

const logger = common.getLogger();

const numCPUs = cpus().length; // > 3 ? 3 : cpus().length;

if (cluster.isPrimary) {
  logger.info(`Master ${process.pid} is running with #${numCPUs} cpus.`);

  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on(`exit`, (worker) => {
    logger.error(
      `Worker ${worker.process.pid} died with code ${worker.process.exitCode}`,
    );
    cluster.fork();
  });
} else {
  logger.info(`Worker ${process.pid} started`);

  startReadyConsumer();
}
