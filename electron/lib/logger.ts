// electron/lib/logger.ts

import log from 'electron-log/main';
import path from 'path';
import { app } from 'electron';

export type ILogger = Pick<
  typeof log,
  'error' | 'warn' | 'info' | 'verbose' | 'debug' | 'silly' | 'log' | 'transports'
>;

export const initializeLogger = () => {
  const userDataPath = app.getPath('userData');
  const logsDir = path.join(userDataPath, 'logs');

  log.transports.file.resolvePathFn = () => path.join(logsDir, 'main.log');

  const homeDir = app.getPath('home');

  log.hooks.push((message, transport) => {
    if (transport !== log.transports.file) return message;

    const sanitize = (str: string) => str.split(homeDir).join('[USER_HOME]');

    return {
      ...message,
      data: message.data.map((arg) => {
        if (typeof arg === 'string') {
          return sanitize(arg);
        }

        if (arg && typeof arg === 'object') {
          const obj = arg as Record<string, unknown>;

          if (typeof obj.stack === 'string') {
            obj.stack = sanitize(obj.stack);
          }
          if (typeof obj.message === 'string') {
            obj.message = sanitize(obj.message);
          }
        }

        return arg;
      }),
    };
  });

  log.transports.file.level = 'info';
  log.transports.console.level = process.env.NODE_ENV === 'development' ? 'debug' : 'info';

  log.info('===========================================================');
  log.info(`[Logger] Initialized. Logs stored in: ${logsDir}`);
  log.info(`[Logger] App Version: ${app.getVersion()}`);
  log.info('===========================================================');
};

const isProduction = app.isPackaged && process.env.NODE_ENV !== 'development';
const noOp = () => {};

export const logger: ILogger = isProduction
  ? ({
      error: log.error.bind(log),
      warn: log.warn.bind(log),
      info: log.info.bind(log),
      log: log.log.bind(log),
      verbose: noOp,
      debug: noOp,
      silly: noOp,
      transports: log.transports,
    } as unknown as ILogger)
  : log;
