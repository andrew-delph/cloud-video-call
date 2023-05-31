import { createLogger, transports, format, config } from 'winston';

export const getLogger = () => {
  return createLogger({
    level: `debug`,
    // levels: config.syslog.levels,
    format: format.combine(
      //   format.label({ label: `right meow!` }),
      format.json(),
    ),
    transports: [new transports.Console()],
  });
};
