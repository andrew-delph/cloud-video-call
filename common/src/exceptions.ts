export const listenGlobalExceptions = () => {
  const errorTypes = [`unhandledRejection`, `uncaughtException`];
  const signalTraps = [`SIGTERM`, `SIGINT`, `SIGUSR2`];

  errorTypes.forEach((type) => {
    process.on(type, async (error) => {
      try {
        console.log(`errorTypes: ${type}`);
        console.error(error);
        process.exit(0);
      } catch (_) {
        process.exit(1);
      }
    });
  });

  signalTraps.forEach((type) => {
    process.once(type, async (error) => {
      try {
        console.log(`signalTraps ${type}`);
        console.error(error);
      } finally {
        process.kill(process.pid, type);
      }
    });
  });
};
