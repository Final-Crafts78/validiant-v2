/**
 * Frontend Logger Utility
 *
 * Thin wrapper around console that:
 * - Only outputs in development (silenced in production)
 * - Satisfies @typescript-eslint/no-console ESLint rule
 * - Provides a consistent [TAG] prefix pattern
 */

const isDev = process.env.NODE_ENV === 'development';

/* eslint-disable no-console */
export const logger = {
  log: (...args: unknown[]): void => {
    if (isDev) console.log(...args);
  },
  info: (...args: unknown[]): void => {
    if (isDev) console.info(...args);
  },
  warn: (...args: unknown[]): void => {
    if (isDev) console.warn(...args);
  },
  error: (...args: unknown[]): void => {
    if (isDev) console.error(...args);
  },
  debug: (...args: unknown[]): void => {
    if (isDev) console.debug(...args);
  },
};
/* eslint-enable no-console */
