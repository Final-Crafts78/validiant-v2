/**
 * Edge-Compatible Logger Utility
 * 
 * Lightweight console-based logging for Cloudflare Workers.
 * Provides structured logging with metadata support and zero dependencies.
 */

/**
 * Log levels
 */
export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug',
}

/**
 * Log metadata interface
 */
export interface LogMetadata {
  [key: string]: any;
}

/**
 * Logger interface
 */
export interface Logger {
  error(message: string, meta?: LogMetadata | Error): void;
  warn(message: string, meta?: LogMetadata): void;
  info(message: string, meta?: LogMetadata): void;
  debug(message: string, meta?: LogMetadata): void;
  child(defaultMeta: LogMetadata): Logger;
}

/**
 * Format log entry with timestamp and metadata
 */
const formatLogEntry = (
  level: LogLevel,
  message: string,
  meta?: LogMetadata | Error,
  defaultMeta?: LogMetadata
): string => {
  const timestamp = new Date().toISOString();
  const levelUpper = level.toUpperCase();
  
  // Combine default metadata with provided metadata
  const combinedMeta = { ...defaultMeta };
  
  if (meta) {
    if (meta instanceof Error) {
      combinedMeta.error = {
        name: meta.name,
        message: meta.message,
        stack: meta.stack,
      };
    } else {
      Object.assign(combinedMeta, meta);
    }
  }
  
  const metaStr = Object.keys(combinedMeta).length > 0 
    ? ` ${JSON.stringify(combinedMeta)}`
    : '';
  
  return `${timestamp} [${levelUpper}] ${message}${metaStr}`;
};

/**
 * Create logger with optional default metadata
 */
const createLogger = (defaultMeta: LogMetadata = {}): Logger => {
  return {
    error: (message: string, meta?: LogMetadata | Error) => {
      const formatted = formatLogEntry(LogLevel.ERROR, message, meta, defaultMeta);
      console.error(formatted);
    },

    warn: (message: string, meta?: LogMetadata) => {
      const formatted = formatLogEntry(LogLevel.WARN, message, meta, defaultMeta);
      console.warn(formatted);
    },

    info: (message: string, meta?: LogMetadata) => {
      const formatted = formatLogEntry(LogLevel.INFO, message, meta, defaultMeta);
      console.log(formatted);
    },

    debug: (message: string, meta?: LogMetadata) => {
      const formatted = formatLogEntry(LogLevel.DEBUG, message, meta, defaultMeta);
      console.debug(formatted);
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
  } else {
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
    'apikey',
    'accesstoken',
    'refreshtoken',
    'creditcard',
    'ssn',
    'authorization',
  ];

  const sanitized = Array.isArray(data) ? [...data] : { ...data };

  for (const key in sanitized) {
    if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
      sanitized[key] = sanitizeLogData(sanitized[key]);
    }
  }

  return sanitized;
};

/**
 * Export logger type
 */
export type { Logger, LogMetadata };
