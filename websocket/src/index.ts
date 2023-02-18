import cluster from 'cluster';
import { cpus } from 'os';
import * as http from 'http';

import { setupMaster, setupWorker } from '@socket.io/sticky';

import { getServer } from './websocket';

const numCPUs = cpus().length;

if (cluster.isPrimary) {
  console.log(`Master ${process.pid} is running with #${numCPUs} cpus.`);

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
    console.warn(
      `Worker ${worker.process.pid} died with code ${worker.process.exitCode}`,
    );
    cluster.fork();
  });
} else {
  console.log(`Worker ${process.pid} started`);

  getServer(false).then((io) => {
    setupWorker(io);
  });
}
