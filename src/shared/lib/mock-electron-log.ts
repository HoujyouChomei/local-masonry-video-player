// src/shared/lib/mock-electron-log.ts

export default {
  error: (...args: unknown[]) => console.error(...args),
  warn: (...args: unknown[]) => console.warn(...args),
  info: (...args: unknown[]) => console.info(...args),
  verbose: (...args: unknown[]) => console.log(...args),
  debug: (...args: unknown[]) => console.debug(...args),
  silly: (...args: unknown[]) => console.log(...args),
  log: (...args: unknown[]) => console.log(...args),
  transports: {
    console: {
      level: 'debug',
    },
    file: {
      level: 'debug',
      resolvePathFn: () => '',
    },
  },
  hooks: [],
};
