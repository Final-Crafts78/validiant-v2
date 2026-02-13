/**
 * Authentication Middleware
 * 
 * Middleware to verify JWT tokens and protect routes.
 */

import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import { sendError } from '../utils/response';
import { HTTP_STATUS, ERROR_CODES } from '@validiant/shared';

/**
 * Extend Express Request to include user
 */
export interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
  };
}

/**
 * Authenticate middleware
 * Verifies JWT token from Authorization header
 */
export const authenticate = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      sendError(res, 'No token provided', HTTP_STATUS.UNAUTHORIZED);
      return;
    }

    const token = authHeader.substring(7); // Remove 'Bearer '

    // Verify token
    const payload = verifyToken(token);

    // Attach user to request
    req.user = {
      userId: payload.userId,
      email: payload.email,
    };

    next();
  } catch (error) {
    sendError(
      res,
      ERROR_CODES.TOKEN_INVALID,
      HTTP_STATUS.UNAUTHORIZED
    );
  }
};

/**
 * Optional authentication
 * Attaches user if token exists, but doesn't fail if missing
 */
export const optionalAuth = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const payload = verifyToken(token);
      req.user = {
        userId: payload.userId,
        email: payload.email,
      };
    }
    next();
  } catch (error) {
    // Continue without user if token is invalid
    next();
  }
};
