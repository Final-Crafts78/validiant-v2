/**
 * Response Utilities
 * 
 * Standardized API response helpers.
 */

import type { Context } from 'hono';
import { HTTP_STATUS } from '@validiant/shared';
import type { ApiResponse } from '@validiant/shared';

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
  };
  return c.json(response, statusCode);
};

/**
 * Send error response
 */
export const sendError = (
  c: Context,
  message: string,
  statusCode: number = HTTP_STATUS.INTERNAL_SERVER_ERROR
): Response => {
  const response: ApiResponse = {
    success: false,
    error: message,
  };
  return c.json(response, statusCode);
};

/**
 * Send validation error response
 */
export const sendValidationError = (
  c: Context,
  errors: any
): Response => {
  const response: ApiResponse = {
    success: false,
    error: 'Validation failed',
    message: 'Please check your input',
  };
  return c.json(response, HTTP_STATUS.UNPROCESSABLE_ENTITY);
};
