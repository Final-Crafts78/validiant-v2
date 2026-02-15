/**
 * Error Handling Utilities
 * 
 * Custom error classes and error handling utilities.
 * Provides consistent error responses across the API.
 */

import type { Context } from 'hono';
import { ZodError } from 'zod';
import { logger } from './logger';
import { ERROR_CODES as API_ERROR_CODES } from '@validiant/shared';

/**
 * Base API Error class
 */
export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;
  public readonly details?: any;

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = 'INTERNAL_ERROR',
    isOperational: boolean = true,
    details?: any
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    this.details = details;

    // Maintains proper stack trace for where error was thrown
    Error.captureStackTrace(this, this.constructor);
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

/**
 * 400 Bad Request
 */
export class BadRequestError extends ApiError {
  constructor(message: string = 'Bad request', details?: any) {
    super(message, 400, 'BAD_REQUEST', true, details);
    Object.setPrototypeOf(this, BadRequestError.prototype);
  }
}

/**
 * 401 Unauthorized
 */
export class UnauthorizedError extends ApiError {
  constructor(message: string = 'Unauthorized', details?: any) {
    super(message, 401, API_ERROR_CODES.UNAUTHORIZED, true, details);
    Object.setPrototypeOf(this, UnauthorizedError.prototype);
  }
}

/**
 * 403 Forbidden
 */
export class ForbiddenError extends ApiError {
  constructor(message: string = 'Forbidden', details?: any) {
    super(message, 403, API_ERROR_CODES.FORBIDDEN, true, details);
    Object.setPrototypeOf(this, ForbiddenError.prototype);
  }
}

/**
 * 404 Not Found
 */
export class NotFoundError extends ApiError {
  constructor(resource: string = 'Resource', details?: any) {
    super(`${resource} not found`, 404, API_ERROR_CODES.NOT_FOUND, true, details);
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

/**
 * 409 Conflict
 */
export class ConflictError extends ApiError {
  constructor(message: string = 'Resource already exists', details?: any) {
    super(message, 409, 'CONFLICT', true, details);
    Object.setPrototypeOf(this, ConflictError.prototype);
  }
}

/**
 * 422 Unprocessable Entity (Validation Error)
 */
export class ValidationError extends ApiError {
  constructor(message: string = 'Validation failed', details?: any) {
    super(message, 422, API_ERROR_CODES.VALIDATION_ERROR, true, details);
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

/**
 * 429 Too Many Requests
 */
export class RateLimitError extends ApiError {
  constructor(message: string = 'Too many requests', retryAfter?: number) {
    super(message, 429, 'RATE_LIMIT_EXCEEDED', true, { retryAfter });
    Object.setPrototypeOf(this, RateLimitError.prototype);
  }
}

/**
 * 500 Internal Server Error
 */
export class InternalServerError extends ApiError {
  constructor(message: string = 'Internal server error', details?: any) {
    super(message, 500, 'INTERNAL_ERROR', true, details);
    Object.setPrototypeOf(this, InternalServerError.prototype);
  }
}

/**
 * 503 Service Unavailable
 */
export class ServiceUnavailableError extends ApiError {
  constructor(message: string = 'Service temporarily unavailable', details?: any) {
    super(message, 503, API_ERROR_CODES.SERVICE_UNAVAILABLE, true, details);
    Object.setPrototypeOf(this, ServiceUnavailableError.prototype);
  }
}

/**
 * Database Error
 */
export class DatabaseError extends ApiError {
  constructor(message: string = 'Database error occurred', details?: any) {
    super(message, 500, 'DATABASE_ERROR', true, details);
    Object.setPrototypeOf(this, DatabaseError.prototype);
  }
}

/**
 * Authentication Error
 */
export class AuthenticationError extends ApiError {
  constructor(message: string = 'Authentication failed', details?: any) {
    super(message, 401, 'AUTHENTICATION_FAILED', true, details);
    Object.setPrototypeOf(this, AuthenticationError.prototype);
  }
}

/**
 * Token Error
 */
export class TokenError extends ApiError {
  constructor(message: string = 'Invalid or expired token', details?: any) {
    super(message, 401, API_ERROR_CODES.INVALID_TOKEN, true, details);
    Object.setPrototypeOf(this, TokenError.prototype);
  }
}

/**
 * Permission Error
 */
export class PermissionError extends ApiError {
  constructor(message: string = 'Insufficient permissions', details?: any) {
    super(message, 403, API_ERROR_CODES.INSUFFICIENT_PERMISSIONS, true, details);
    Object.setPrototypeOf(this, PermissionError.prototype);
  }
}

/**
 * Format Zod validation errors
 */
export const formatZodError = (error: ZodError): { field: string; message: string }[] => {
  return error.errors.map((err) => ({
    field: err.path.join('.'),
    message: err.message,
  }));
};

/**
 * Check if error is operational
 */
export const isOperationalError = (error: Error): boolean => {
  if (error instanceof ApiError) {
    return error.isOperational;
  }
  return false;
};

/**
 * Format error response
 */
interface ErrorResponse {
  success: false;
  error: {
    message: string;
    code: string;
    statusCode: number;
    details?: any;
    stack?: string;
  };
}

export const formatErrorResponse = (
  error: Error | ApiError,
  includeStack: boolean = false
): ErrorResponse => {
  if (error instanceof ApiError) {
    return {
      success: false,
      error: {
        message: error.message,
        code: error.code,
        statusCode: error.statusCode,
        details: error.details,
        ...(includeStack && { stack: error.stack }),
      },
    };
  }

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    return {
      success: false,
      error: {
        message: 'Validation failed',
        code: API_ERROR_CODES.VALIDATION_ERROR,
        statusCode: 422,
        details: formatZodError(error),
      },
    };
  }

  // Generic error
  return {
    success: false,
    error: {
      message: error.message || 'An unexpected error occurred',
      code: 'INTERNAL_ERROR',
      statusCode: 500,
      ...(includeStack && { stack: error.stack }),
    },
  };
};

/**
 * Send error response (Hono compatible)
 */
export const sendErrorResponse = (
  c: Context,
  error: Error | ApiError,
  includeStack: boolean = false
): Response => {
  const errorResponse = formatErrorResponse(error, includeStack);
  
  // Log error
  if (errorResponse.error.statusCode >= 500) {
    logger.error('Server error', {
      error: error.message,
      code: errorResponse.error.code,
      statusCode: errorResponse.error.statusCode,
      stack: error.stack,
    });
  } else if (errorResponse.error.statusCode >= 400) {
    logger.warn('Client error', {
      error: error.message,
      code: errorResponse.error.code,
      statusCode: errorResponse.error.statusCode,
    });
  }

  return c.json(errorResponse, errorResponse.error.statusCode as any);
};

/**
 * Async handler wrapper to catch errors in async route handlers
 */
export const asyncHandler = (
  fn: (req: any, res: any, next: any) => Promise<any>
) => {
  return (req: any, res: any, next: any) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Assert condition and throw error if false
 */
export const assert = (
  condition: any,
  error: ApiError | string,
  ErrorClass: typeof ApiError = BadRequestError
): asserts condition => {
  if (!condition) {
    if (typeof error === 'string') {
      throw new ErrorClass(error);
    }
    throw error;
  }
};

/**
 * Assert resource exists (with explicit type annotation for TS2775 fix)
 */
export const assertExists = <T>(
  value: T | null | undefined,
  name: string
): asserts value is NonNullable<T> => {
  if (!value) {
    throw new NotFoundError(`${name} not found`);
  }
};

/**
 * Assert user has permission
 */
export const assertPermission = (
  hasPermission: boolean,
  message: string = 'Insufficient permissions'
): void => {
  if (!hasPermission) {
    throw new PermissionError(message);
  }
};

/**
 * Wrap database operations with error handling
 */
export const withDatabaseErrorHandling = async <T>(
  operation: () => Promise<T>,
  errorMessage?: string
): Promise<T> => {
  try {
    return await operation();
  } catch (error) {
    logger.error('Database operation failed', { error });
    throw new DatabaseError(
      errorMessage || 'Database operation failed',
      { originalError: error instanceof Error ? error.message : 'Unknown error' }
    );
  }
};

/**
 * Create error from database constraint violation
 */
export const handleDatabaseConstraintError = (error: any): ApiError => {
  // PostgreSQL unique violation
  if (error.code === '23505') {
    const match = error.detail?.match(/Key \(([^)]+)\)/);
    const field = match ? match[1] : 'field';
    return new ConflictError(`${field} already exists`);
  }

  // PostgreSQL foreign key violation
  if (error.code === '23503') {
    return new BadRequestError('Referenced resource does not exist');
  }

  // PostgreSQL not null violation
  if (error.code === '23502') {
    const field = error.column || 'field';
    return new BadRequestError(`${field} is required`);
  }

  // Generic database error
  return new DatabaseError('Database constraint violation');
};

/**
 * Error types export
 */
export type {
  ErrorResponse,
};
