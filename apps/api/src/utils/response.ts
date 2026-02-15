/**
 * Response Utilities
 * 
 * Standardized API response helpers.
 */

import type { Context } from 'hono';
import { HTTP_STATUS } from '@validiant/shared';
import type { ApiResponse, ApiError } from '@validiant/shared';

/**
 * Send success response
 */
export const sendSuccess = <T>(
  c: Context,
  data: T,
  statusCode: number = HTTP_STATUS.OK
): Response => {
  const response: ApiResponse<T> = {
    success: true,
    data,
    timestamp: new Date().toISOString(),
  };
  return c.json(response, statusCode as any);
};

/**
 * Send error response
 */
export const sendError = (
  c: Context,
  message: string,
  statusCode: number = HTTP_STATUS.INTERNAL_SERVER_ERROR
): Response => {
  const errorObj: ApiError = {
    message,
    code: 'ERROR',
  };
  
  const response: ApiResponse<unknown> = {
    success: false,
    error: errorObj,
    timestamp: new Date().toISOString(),
  };
  return c.json(response, statusCode as any);
};

/**
 * Send validation error response
 */
export const sendValidationError = (
  c: Context,
  errors: any
): Response => {
  const errorObj: ApiError = {
    message: 'Validation failed',
    code: 'VALIDATION_ERROR',
    details: errors,
  };
  
  const response: ApiResponse<unknown> = {
    success: false,
    error: errorObj,
    timestamp: new Date().toISOString(),
  };
  return c.json(response, HTTP_STATUS.UNPROCESSABLE_ENTITY as any);
};
