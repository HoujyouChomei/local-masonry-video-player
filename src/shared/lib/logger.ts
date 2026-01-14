// src/shared/lib/logger.ts

import log from 'electron-log/renderer';

export type Logger = Pick<
  typeof log,
  'error' | 'warn' | 'info' | 'verbose' | 'debug' | 'silly' | 'log'
> & {
  transports: {
    console: {
      level: string | boolean;
    };
  };
};

const isTest = import.meta.env.TEST;
const isDev = import.meta.env.DEV;

const noOp = () => {};

const createTestLogger = (): Logger => ({
  error: (...args: unknown[]) => console.error(...args),
  warn: (...args: unknown[]) => console.warn(...args),
  info: (...args: unknown[]) => console.info(...args),
  verbose: (...args: unknown[]) => console.log(...args),
  debug: (...args: unknown[]) => console.debug(...args),
  silly: (...args: unknown[]) => console.log(...args),
  log: (...args: unknown[]) => console.log(...args),
  transports: { console: { level: 'debug' } },
});

const createProductionLogger = (): Logger =>
  ({
    error: log.error.bind(log),
    warn: log.warn.bind(log),
    info: log.info.bind(log),
    log: log.log.bind(log),
    verbose: noOp,
    debug: noOp,
    silly: noOp,
    transports: log.transports,
  }) as unknown as Logger;

let loggerInstance: Logger;

if (isTest) {
  loggerInstance = createTestLogger();
} else if (!isDev) {
  loggerInstance = createProductionLogger();
  log.transports.console.level = 'warn';
} else {
  loggerInstance = log as unknown as Logger;
  loggerInstance.transports.console.level = 'debug';
}

export const logger = loggerInstance;
