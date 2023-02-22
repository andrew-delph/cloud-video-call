import { matchConsumer } from './match-worker';

import cluster from 'cluster';
import { cpus } from 'os';
import { listenGlobalExceptions } from 'react-video-call-common';

listenGlobalExceptions();
const numCPUs = cpus().length; // > 3 ? 3 : cpus().length;

if (cluster.isPrimary) {
  console.log(`Master ${process.pid} is running with #${numCPUs} cpus.`);

  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on(`exit`, (worker) => {
    console.warn(
      `Worker ${worker.process.pid} died with code ${worker.process.exitCode}`,
    );
    cluster.fork();
  });
} else {
  console.log(`Worker ${process.pid} started`);

  matchConsumer();
}
