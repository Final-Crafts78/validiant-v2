/**
 * Authentication Middleware
 * 
 * Validates JWT tokens and attaches user info to context.
 * Edge-compatible implementation.
 */

import type { Context, Next } from 'hono';
import { verifyToken, extractBearerToken } from '../utils/jwt';
import { UnauthorizedError } from '../utils/errors';

/**
 * User context type
 */
export interface UserContext {
  userId: string;
  email: string;
  role?: string;
  organizationId?: string;
}

/**
 * Authenticate middleware
 * Verifies JWT token and attaches user to context
 */
export const authenticate = async (c: Context, next: Next): Promise<Response | void> => {
  try {
    const authHeader = c.req.header('Authorization');
    const token = extractBearerToken(authHeader);

    if (!token) {
      return c.json(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'No token provided',
          },
          timestamp: new Date().toISOString(),
        },
        401
      );
    }

    const payload = await verifyToken(token);

    // Attach user to context
    c.set('user', {
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
      organizationId: payload.organizationId,
    } as UserContext);

    await next();
    return;
  } catch (error) {
    return c.json(
      {
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: error instanceof Error ? error.message : 'Authentication failed',
        },
        timestamp: new Date().toISOString(),
      },
      401
    );
  }
};

/**
 * Optional authenticate middleware
 * Attaches user if token is valid, but doesn't block request
 */
export const optionalAuth = async (c: Context, next: Next): Promise<void> => {
  try {
    const authHeader = c.req.header('Authorization');
    const token = extractBearerToken(authHeader);

    if (token) {
      const payload = await verifyToken(token);
      c.set('user', {
        userId: payload.userId,
        email: payload.email,
        role: payload.role,
        organizationId: payload.organizationId,
      } as UserContext);
    }
  } catch {
    // Ignore errors for optional auth
  }

  await next();
};

/**
 * Require role middleware
 * Checks if user has required role
 */
export const requireRole = (allowedRoles: string[]) => {
  return async (c: Context, next: Next): Promise<Response | void> => {
    const user = c.get('user') as UserContext | undefined;

    if (!user || !user.role) {
      return c.json(
        {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Insufficient permissions',
          },
          timestamp: new Date().toISOString(),
        },
        403
      );
    }

    if (!allowedRoles.includes(user.role)) {
      return c.json(
        {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Insufficient permissions',
          },
          timestamp: new Date().toISOString(),
        },
        403
      );
    }

    await next();
  };
};
