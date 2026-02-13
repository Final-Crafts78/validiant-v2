/**
 * Response Utilities
 * 
 * Standardized API response helpers.
 */

import { Response } from 'express';
import { HTTP_STATUS } from '@validiant/shared';
import type { ApiResponse } from '@validiant/shared';

/**
 * Send success response
 */
export const sendSuccess = <T>(
  res: Response,
  data: T,
  statusCode: number = HTTP_STATUS.OK
): void => {
  const response: ApiResponse<T> = {
    success: true,
    data,
  };
  res.status(statusCode).json(response);
};

/**
 * Send error response
 */
export const sendError = (
  res: Response,
  message: string,
  statusCode: number = HTTP_STATUS.INTERNAL_SERVER_ERROR
): void => {
  const response: ApiResponse = {
    success: false,
    error: message,
  };
  res.status(statusCode).json(response);
};

/**
 * Send validation error response
 */
export const sendValidationError = (
  res: Response,
  errors: any
): void => {
  const response: ApiResponse = {
    success: false,
    error: 'Validation failed',
    message: 'Please check your input',
  };
  res.status(HTTP_STATUS.UNPROCESSABLE_ENTITY).json(response);
};
