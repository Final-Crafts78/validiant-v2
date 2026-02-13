/**
 * Validation Middleware
 * 
 * Middleware to validate request data using Zod schemas.
 */

import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
import { sendValidationError } from '../utils/response';

/**
 * Validate request body
 */
export const validateBody = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      sendValidationError(res, error);
    }
  };
};

/**
 * Validate request query
 */
export const validateQuery = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      schema.parse(req.query);
      next();
    } catch (error) {
      sendValidationError(res, error);
    }
  };
};

/**
 * Validate request params
 */
export const validateParams = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      schema.parse(req.params);
      next();
    } catch (error) {
      sendValidationError(res, error);
    }
  };
};
