/**
 * Authentication Middleware
 *
 * Validates JWT tokens and attaches user info to context.
 * Edge-compatible implementation.
 *
 * Token resolution order:
 *   1. Authorization: Bearer <token> header  (mobile / API clients)
 *   2. accessToken HttpOnly cookie           (web clients via withCredentials)
 */

import type { Context, Next } from 'hono';
import { getCookie } from 'hono/cookie';
import { verifyToken, extractBearerToken } from '../utils/jwt';

import { UserRole, PermissionKey } from '@validiant/shared';

/**
 * User context type
 */
export interface UserContext {
  userId: string;
  email: string;
  role?: UserRole;
  organizationId?: string;
  permissions?: PermissionKey[];
}

/**
 * Authenticate middleware
 * Verifies JWT token and attaches user to context.
 *
 * Reads token from the Authorization header first; falls back to the
 * HttpOnly `accessToken` cookie set by the auth controller on login.
 * Cookie name must match auth.controller.ts → setCookie('accessToken', ...).
 */
export const authenticate = async (
  c: Context,
  next: Next
): Promise<Response | void> => {
  try {
    console.log('[auth] Raw Cookie header:', c.req.header('cookie'));
    console.log('[auth] Parsed accessToken:', getCookie(c, 'accessToken'));

    const authHeader = c.req.header('Authorization');
    let token = extractBearerToken(authHeader);

    // Fallback: If no Bearer token is found, look for the HttpOnly cookie.
    // Cookie name is 'accessToken' — matches auth.controller.ts setCookie call.
    if (!token) {
      token = getCookie(c, 'accessToken') || null;
    }

    // Fallback: Check for token in search params (for EventSource/SSE which doesn't support headers)
    if (!token) {
      token = c.req.query('token') || null;
    }

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
      role: payload.role as UserRole,
      organizationId: payload.organizationId,
      permissions: (payload as any).permissions,
    } as UserContext);

    await next();
    return;
  } catch (error) {
    return c.json(
      {
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message:
            error instanceof Error ? error.message : 'Authentication failed',
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
        role: payload.role as UserRole,
        organizationId: payload.organizationId,
        permissions: (payload as any).permissions,
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
