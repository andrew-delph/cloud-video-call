import { getLogger } from './logger';

export const listenGlobalExceptions = () => {
  const errorTypes = [`unhandledRejection`, `uncaughtException`];
  const signalTraps = [`SIGTERM`, `SIGINT`, `SIGUSR2`];

  const logger = getLogger();

  errorTypes.forEach((type) => {
    process.on(type, async (error) => {
      try {
        logger.error(`errorTypes: ${type} error: ${error}`);
        process.exit(0);
      } catch (_) {
        process.exit(1);
      }
    });
  });

  signalTraps.forEach((type) => {
    process.once(type, async (error) => {
      try {
        logger.error(`signalTraps ${type}  error: ${error}`);
      } finally {
        process.kill(process.pid, type);
      }
    });
  });
};
