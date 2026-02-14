/**
 * Authentication Middleware
 * 
 * Middleware to verify JWT tokens from HttpOnly cookies and protect routes.
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
 * Verifies JWT token from HttpOnly cookie (preferred) or Authorization header (fallback)
 */
export const authenticate = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    let token: string | null = null;

    // First, try to get token from cookie (secure, HttpOnly)
    if (req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    }
    // Fallback: check Authorization header for mobile/API clients
    else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.substring(7);
    }

    if (!token) {
      sendError(res, 'No token provided', HTTP_STATUS.UNAUTHORIZED);
      return;
    }

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
    let token: string | null = null;

    // Try cookie first
    if (req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    }
    // Fallback to header
    else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.substring(7);
    }

    if (token) {
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
