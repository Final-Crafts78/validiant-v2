/**
 * Logger Utility
 * 
 * Winston-based structured logging with multiple transports.
 * Provides consistent logging across the application with contextual metadata.
 */

import winston from 'winston';
import path from 'path';
import { env, isProduction, isDevelopment } from '../config/env.config';

/**
 * Custom log levels
 */
const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
};

/**
 * Custom colors for log levels
 */
const logColors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  debug: 'blue',
};

// Add colors to Winston
winston.addColors(logColors);

/**
 * Custom format for pretty console output in development
 */
const prettyFormat = winston.format.combine(
  winston.format.colorize({ all: true }),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf((info) => {
    const { timestamp, level, message, ...meta } = info;
    const metaStr = Object.keys(meta).length > 0 ? `\n${JSON.stringify(meta, null, 2)}` : '';
    return `${timestamp} [${level}]: ${message}${metaStr}`;
  })
);

/**
 * JSON format for production
 */
const jsonFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

/**
 * Console transport configuration
 */
const consoleTransport = new winston.transports.Console({
  format: env.LOG_FORMAT === 'pretty' ? prettyFormat : jsonFormat,
});

/**
 * File transports for production
 */
const fileTransports = isProduction
  ? [
      // Error logs
      new winston.transports.File({
        filename: path.join(__dirname, '../../logs/error.log'),
        level: 'error',
        maxsize: 5242880, // 5MB
        maxFiles: 5,
        format: jsonFormat,
      }),
      // Combined logs
      new winston.transports.File({
        filename: path.join(__dirname, '../../logs/combined.log'),
        maxsize: 5242880, // 5MB
        maxFiles: 5,
        format: jsonFormat,
      }),
    ]
  : [];

/**
 * Winston logger instance
 */
const winstonLogger = winston.createLogger({
  level: env.LOG_LEVEL,
  levels: logLevels,
  transports: [consoleTransport, ...fileTransports],
  exitOnError: false,
});

/**
 * Logger interface with contextual metadata support
 */
interface LogMetadata {
  [key: string]: any;
}

interface Logger {
  error(message: string, meta?: LogMetadata): void;
  warn(message: string, meta?: LogMetadata): void;
  info(message: string, meta?: LogMetadata): void;
  debug(message: string, meta?: LogMetadata): void;
  child(defaultMeta: LogMetadata): Logger;
}

/**
 * Create logger with optional default metadata
 */
const createLogger = (defaultMeta: LogMetadata = {}): Logger => {
  return {
    error: (message: string, meta: LogMetadata = {}) => {
      winstonLogger.error(message, { ...defaultMeta, ...meta });
    },

    warn: (message: string, meta: LogMetadata = {}) => {
      winstonLogger.warn(message, { ...defaultMeta, ...meta });
    },

    info: (message: string, meta: LogMetadata = {}) => {
      winstonLogger.info(message, { ...defaultMeta, ...meta });
    },

    debug: (message: string, meta: LogMetadata = {}) => {
      winstonLogger.debug(message, { ...defaultMeta, ...meta });
    },

    child: (childMeta: LogMetadata) => {
      return createLogger({ ...defaultMeta, ...childMeta });
    },
  };
};

/**
 * Default logger instance
 */
export const logger = createLogger();

/**
 * Request logger - creates child logger with request context
 */
export const createRequestLogger = (requestId: string, userId?: string): Logger => {
  return logger.child({
    requestId,
    userId,
  });
};

/**
 * HTTP request logging helper
 */
export const logHttpRequest = (
  method: string,
  url: string,
  statusCode: number,
  duration: number,
  userId?: string
): void => {
  const level = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info';
  
  logger[level]('HTTP Request', {
    method,
    url,
    statusCode,
    duration: `${duration}ms`,
    userId,
  });
};

/**
 * Database query logging helper
 */
export const logDatabaseQuery = (
  query: string,
  duration: number,
  rowCount?: number,
  error?: Error
): void => {
  if (error) {
    logger.error('Database query failed', {
      query: query.substring(0, 200),
      duration: `${duration}ms`,
      error: error.message,
      stack: error.stack,
    });
  } else if (isDevelopment) {
    logger.debug('Database query executed', {
      query: query.substring(0, 200),
      duration: `${duration}ms`,
      rowCount,
    });
  }
};

/**
 * Authentication event logging
 */
export const logAuthEvent = (
  event: 'login' | 'logout' | 'register' | 'password_reset' | 'email_verified' | '2fa_enabled' | '2fa_disabled',
  userId: string,
  meta?: LogMetadata
): void => {
  logger.info(`Auth: ${event}`, {
    event,
    userId,
    ...meta,
  });
};

/**
 * Security event logging
 */
export const logSecurityEvent = (
  event: string,
  severity: 'low' | 'medium' | 'high' | 'critical',
  meta?: LogMetadata
): void => {
  const level = severity === 'critical' || severity === 'high' ? 'error' : 'warn';
  
  logger[level](`Security: ${event}`, {
    event,
    severity,
    ...meta,
  });
};

/**
 * Business event logging
 */
export const logBusinessEvent = (
  event: string,
  entityType: string,
  entityId: string,
  userId?: string,
  meta?: LogMetadata
): void => {
  logger.info(`Business: ${event}`, {
    event,
    entityType,
    entityId,
    userId,
    ...meta,
  });
};

/**
 * Performance metric logging
 */
export const logPerformance = (
  operation: string,
  duration: number,
  meta?: LogMetadata
): void => {
  const level = duration > 5000 ? 'warn' : duration > 1000 ? 'info' : 'debug';
  
  logger[level](`Performance: ${operation}`, {
    operation,
    duration: `${duration}ms`,
    ...meta,
  });
};

/**
 * External API call logging
 */
export const logExternalApiCall = (
  service: string,
  endpoint: string,
  method: string,
  statusCode?: number,
  duration?: number,
  error?: Error
): void => {
  if (error) {
    logger.error(`External API call failed: ${service}`, {
      service,
      endpoint,
      method,
      error: error.message,
      duration: duration ? `${duration}ms` : undefined,
    });
  } else {
    logger.info(`External API call: ${service}`, {
      service,
      endpoint,
      method,
      statusCode,
      duration: duration ? `${duration}ms` : undefined,
    });
  }
};

/**
 * Sanitize sensitive data from logs
 */
export const sanitizeLogData = (data: any): any => {
  if (!data || typeof data !== 'object') return data;

  const sensitiveKeys = [
    'password',
    'token',
    'secret',
    'apiKey',
    'accessToken',
    'refreshToken',
    'creditCard',
    'ssn',
    'authorization',
  ];

  const sanitized = Array.isArray(data) ? [...data] : { ...data };

  for (const key in sanitized) {
    if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof sanitized[key] === 'object') {
      sanitized[key] = sanitizeLogData(sanitized[key]);
    }
  }

  return sanitized;
};

/**
 * Export logger type
 */
export type { Logger, LogMetadata };
