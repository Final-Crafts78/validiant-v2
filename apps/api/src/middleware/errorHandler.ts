/**
 * Error Handler Middleware
 * 
 * Centralized error handling for the API.
 */

import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { HTTP_STATUS, ERROR_CODES } from '@validiant/shared';
import { config } from '../config';
import type { ApiResponse } from '@validiant/shared';

/**
 * Custom API Error class
 */
export class ApiError extends Error {
  statusCode: number;
  code: string;
  details?: any;

  constructor(
    message: string,
    statusCode: number = HTTP_STATUS.INTERNAL_SERVER_ERROR,
    code: string = ERROR_CODES.INTERNAL_SERVER_ERROR,
    details?: any
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Error handler middleware
 */
export const errorHandler = (
  err: Error | ApiError | ZodError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Log error in development
  if (config.isDevelopment) {
    console.error('Error:', err);
  }

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    const response: ApiResponse = {
      success: false,
      error: ERROR_CODES.VALIDATION_ERROR,
      message: 'Validation failed',
    };
    res.status(HTTP_STATUS.UNPROCESSABLE_ENTITY).json(response);
    return;
  }

  // Handle Prisma errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    let response: ApiResponse;

    // Unique constraint violation
    if (err.code === 'P2002') {
      response = {
        success: false,
        error: ERROR_CODES.ALREADY_EXISTS,
        message: 'Resource already exists',
      };
      res.status(HTTP_STATUS.CONFLICT).json(response);
      return;
    }

    // Record not found
    if (err.code === 'P2025') {
      response = {
        success: false,
        error: ERROR_CODES.NOT_FOUND,
        message: 'Resource not found',
      };
      res.status(HTTP_STATUS.NOT_FOUND).json(response);
      return;
    }
  }

  // Handle custom API errors
  if (err instanceof ApiError) {
    const response: ApiResponse = {
      success: false,
      error: err.code,
      message: err.message,
    };
    res.status(err.statusCode).json(response);
    return;
  }

  // Handle generic errors
  const response: ApiResponse = {
    success: false,
    error: ERROR_CODES.INTERNAL_SERVER_ERROR,
    message: config.isDevelopment ? err.message : 'Internal server error',
  };
  res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(response);
};

/**
 * Not found handler
 */
export const notFoundHandler = (
  req: Request,
  res: Response
): void => {
  const response: ApiResponse = {
    success: false,
    error: ERROR_CODES.NOT_FOUND,
    message: 'Route not found',
  };
  res.status(HTTP_STATUS.NOT_FOUND).json(response);
};
