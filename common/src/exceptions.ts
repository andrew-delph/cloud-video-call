import { getLogger } from './logger';
const logger = getLogger();

export const listenGlobalExceptions = (clean_up?: () => Promise<void>) => {
  const errorTypes = [`unhandledRejection`, `uncaughtException`];
  const signalTraps = [`SIGTERM`, `SIGINT`, `SIGUSR2`];

  errorTypes.forEach((type) => {
    process.on(type, async (err) => {
      try {
        logger.error(`Uncaught Exception: ${err.message}`);
        logger.error(err.stack);
        if (clean_up != null) {
          await clean_up();
          logger.error(`clean_up complete.`);
        }

        process.exit(1);
      } catch (e) {
        logger.error(`clean_up error: ${e}`);
        process.exit(1);
      }
    });
  });

  signalTraps.forEach((type) => {
    process.once(type, async (...args) => {
      try {
        logger.warn(`signalTraps ${type} args: ${JSON.stringify(args)}`);
        if (clean_up != null) {
          await clean_up();
          logger.warn(`clean_up complete.`);
        }
      } catch (e) {
        logger.error(`clean_up error: ${e}`);
      } finally {
        process.kill(process.pid, type);
      }
    });
  });
};
