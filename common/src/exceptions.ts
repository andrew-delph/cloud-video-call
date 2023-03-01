import { getLogger } from './logger';
const logger = getLogger();

export const listenGlobalExceptions = (clean_up?: () => Promise<void>) => {
  const errorTypes = [`unhandledRejection`, `uncaughtException`];
  const signalTraps = [`SIGTERM`, `SIGINT`, `SIGUSR2`];

  errorTypes.forEach((type) => {
    process.on(type, async (error) => {
      try {
        logger.error(`errorTypes: ${type} error: ${error}`);

        if (type == `unhandledRejection`) {
          logger.error(
            `reason.command.name: ${error.command.name} reason.command.args: ${error.command.args}`,
          );
        }

        if (clean_up != null) await clean_up();

        process.exit(0);
      } catch (_) {
        process.exit(1);
      }
    });
  });

  signalTraps.forEach((type) => {
    process.once(type, async (error) => {
      try {
        logger.debug(`signalTraps ${type}  error: ${error}`);
        if (clean_up != null) await clean_up();
      } finally {
        process.kill(process.pid, type);
      }
    });
  });
};
