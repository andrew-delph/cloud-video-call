import { getLogger } from './logger';
const logger = getLogger();

export const listenGlobalExceptions = (clean_up?: () => Promise<void>) => {
  const errorTypes = [`unhandledRejection`, `uncaughtException`];
  const signalTraps = [`SIGTERM`, `SIGINT`, `SIGUSR2`];

  errorTypes.forEach((type) => {
    process.on(type, async (err) => {
      try {
        console.error(`Uncaught Exception: ${err.message}`);
        console.error(err.stack);
        if (clean_up != null) await clean_up();

        process.exit(0);
      } catch (e) {
        logger.error(e);
        process.exit(1);
      }
    });
  });

  signalTraps.forEach((type) => {
    process.once(type, async (...args) => {
      try {
        logger.warn(`signalTraps ${type} args: ${JSON.stringify(args)}`);
        if (clean_up != null) await clean_up();
      } finally {
        process.kill(process.pid, type);
      }
    });
  });
};
