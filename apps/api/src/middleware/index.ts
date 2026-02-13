/**
 * Express Middleware
 * 
 * Core middleware for the Express application including error handling,
 * request logging, validation, CORS, rate limiting, and security.
 */

import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { v4 as uuidv4 } from 'uuid';
import { env, getCorsOrigins, isDevelopment } from '../config/env.config';
import { rateLimit } from '../config/redis.config';
import {
  ApiError,
  sendErrorResponse,
  isOperationalError,
  ValidationError,
  RateLimitError,
} from '../utils/errors';
import { logger, logHttpRequest, createRequestLogger } from '../utils/logger';

/**
 * Extended Express Request with user and context
 */
export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    organizationId?: string;
  };
  requestId?: string;
  startTime?: number;
}

/**
 * CORS middleware
 */
export const corsMiddleware = cors({
  origin: (origin, callback) => {
    const allowedOrigins = getCorsOrigins();
    
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
  exposedHeaders: ['X-Total-Count', 'X-Page', 'X-Per-Page'],
  maxAge: 86400, // 24 hours
});

/**
 * Helmet security middleware
 */
export const helmetMiddleware = helmet({
  contentSecurityPolicy: isDevelopment ? false : undefined,
  crossOriginEmbedderPolicy: false,
});

/**
 * Compression middleware
 */
export const compressionMiddleware = compression({
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  },
  threshold: 1024, // Only compress responses > 1KB
});

/**
 * Request ID middleware
 * Adds unique request ID to each request
 */
export const requestIdMiddleware = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  const requestId = req.headers['x-request-id'] as string || uuidv4();
  req.requestId = requestId;
  res.setHeader('X-Request-ID', requestId);
  next();
};

/**
 * Request logging middleware
 * Logs all incoming HTTP requests
 */
export const requestLoggingMiddleware = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  req.startTime = Date.now();

  // Log request
  const requestLogger = createRequestLogger(req.requestId!, req.user?.id);
  requestLogger.info('Incoming request', {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.headers['user-agent'],
  });

  // Log response when finished
  res.on('finish', () => {
    const duration = Date.now() - (req.startTime || Date.now());
    logHttpRequest(
      req.method,
      req.url,
      res.statusCode,
      duration,
      req.user?.id
    );
  });

  next();
};

/**
 * Rate limiting middleware
 */
export const rateLimitMiddleware = (
  windowMs: number = env.RATE_LIMIT_WINDOW_MS,
  maxRequests: number = env.RATE_LIMIT_MAX_REQUESTS
) => {
  return async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const identifier = req.user?.id || req.ip || 'anonymous';
      const key = `ratelimit:${identifier}:${req.path}`;

      const result = await rateLimit.check(key, maxRequests, windowMs);

      // Set rate limit headers
      res.setHeader('X-RateLimit-Limit', maxRequests);
      res.setHeader('X-RateLimit-Remaining', result.remaining);
      res.setHeader('X-RateLimit-Reset', new Date(result.reset).toISOString());

      if (!result.allowed) {
        const retryAfter = Math.ceil((result.reset - Date.now()) / 1000);
        res.setHeader('Retry-After', retryAfter);
        throw new RateLimitError('Too many requests, please try again later', retryAfter);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Request validation middleware
 * Validates request body, query, or params using Zod schema
 */
export const validate = (
  schema: ZodSchema,
  source: 'body' | 'query' | 'params' = 'body'
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const data = req[source];
      const validated = schema.parse(data);
      req[source] = validated;
      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Not found middleware
 * Handles 404 errors for undefined routes
 */
export const notFoundMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  res.status(404).json({
    success: false,
    error: {
      message: `Route ${req.method} ${req.url} not found`,
      code: 'NOT_FOUND',
      statusCode: 404,
    },
  });
};

/**
 * Error handling middleware
 * Catches and formats all errors
 */
export const errorMiddleware = (
  error: Error | ApiError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Don't log operational errors at error level
  if (!isOperationalError(error)) {
    logger.error('Unexpected error', {
      error: error.message,
      stack: error.stack,
      url: req.url,
      method: req.method,
    });
  }

  // Send error response
  sendErrorResponse(res, error, isDevelopment);
};

/**
 * Async error catcher
 * Wraps async route handlers to catch errors
 */
export const asyncHandler = (
  fn: (req: AuthRequest, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Sanitize request body
 * Removes potentially dangerous fields
 */
export const sanitizeBody = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (req.body) {
    const dangerousFields = ['__proto__', 'constructor', 'prototype'];
    
    const sanitize = (obj: any): any => {
      if (typeof obj !== 'object' || obj === null) return obj;
      
      if (Array.isArray(obj)) {
        return obj.map(sanitize);
      }
      
      const sanitized: any = {};
      for (const key in obj) {
        if (!dangerousFields.includes(key)) {
          sanitized[key] = sanitize(obj[key]);
        }
      }
      return sanitized;
    };
    
    req.body = sanitize(req.body);
  }
  next();
};

/**
 * Content type validation middleware
 */
export const validateContentType = (
  allowedTypes: string[] = ['application/json']
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
      const contentType = req.headers['content-type'];
      
      if (!contentType || !allowedTypes.some(type => contentType.includes(type))) {
        throw new ValidationError(
          `Content-Type must be one of: ${allowedTypes.join(', ')}`,
          { receivedType: contentType }
        );
      }
    }
    next();
  };
};

/**
 * Response time header middleware
 */
export const responseTimeMiddleware = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    res.setHeader('X-Response-Time', `${duration}ms`);
  });
  
  next();
};

/**
 * API version middleware
 */
export const apiVersionMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  res.setHeader('X-API-Version', env.API_VERSION);
  next();
};

/**
 * Powered by header removal
 */
export const removePoweredBy = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  res.removeHeader('X-Powered-By');
  next();
};

/**
 * Request size limit check
 */
export const checkRequestSize = (maxSize: number = 10 * 1024 * 1024) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const contentLength = parseInt(req.headers['content-length'] || '0', 10);
    
    if (contentLength > maxSize) {
      throw new ValidationError(
        `Request body too large. Maximum size is ${maxSize / 1024 / 1024}MB`,
        { size: contentLength, maxSize }
      );
    }
    
    next();
  };
};

/**
 * Maintenance mode middleware
 */
export const maintenanceMode = (isEnabled: boolean = false) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (isEnabled) {
      res.status(503).json({
        success: false,
        error: {
          message: 'Service is under maintenance. Please try again later.',
          code: 'MAINTENANCE_MODE',
          statusCode: 503,
        },
      });
    } else {
      next();
    }
  };
};

/**
 * Export all middleware
 */
export * from './auth.middleware';
