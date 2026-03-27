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
import {
  verifyToken,
  extractBearerToken,
  type TokenPayload,
} from '../utils/jwt';
import { logger } from '../utils/logger';

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
    const authHeader = c.req.header('Authorization');
    let token = extractBearerToken(authHeader);
    const cookieToken = getCookie(c, 'accessToken') || null;

    logger.info('[Auth Middleware] Incoming', {
      path: c.req.path,
      hasBearerToken: !!token,
      bearerPrefix: token ? token.substring(0, 20) + '...' : null,
      hasCookieToken: !!cookieToken,
      cookiePrefix: cookieToken ? cookieToken.substring(0, 20) + '...' : null,
      rawCookieHeader: c.req.header('cookie') ?? 'NONE',
    });

    if (!token) token = cookieToken;
    if (!token) token = c.req.query('token') || null;

    logger.debug('[Auth:MW] Token source resolution', {
      hasHeader: !!authHeader,
      hasCookie: !!cookieToken,
      hasQuery: !!c.req.query('token'),
      finalTokenFound: !!token,
    });

    if (!token) {
      logger.warn('[Auth Middleware] No token at all — 401', {
        path: c.req.path,
      });
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

    let payload: TokenPayload;
    try {
      payload = await verifyToken(token);
      logger.info('[Auth Middleware] Token OK', {
        userId: payload.userId,
        email: payload.email,
        orgId: payload.organizationId,
        exp: payload.exp,
        expiresInSeconds: payload.exp
          ? payload.exp - Math.floor(Date.now() / 1000)
          : 'no-exp',
      });
    } catch (verifyError) {
      logger.error('[Auth Middleware] verifyToken FAILED', {
        tokenPrefix: token.substring(0, 30) + '...',
        tokenLength: token.length,
        error: verifyError instanceof Error ? verifyError.message : verifyError,
      });
      return c.json(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message:
              verifyError instanceof Error
                ? verifyError.message
                : 'Authentication failed',
          },
          timestamp: new Date().toISOString(),
        },
        401
      );
    }

    c.set('user', {
      userId: payload.userId,
      email: payload.email,
      role: payload.role as UserRole,
      organizationId: payload.organizationId,
      permissions: payload.permissions as PermissionKey[],
    } as UserContext);

    await next();
    return;
  } catch (error) {
    logger.error('[Auth Middleware] Unexpected crash', {
      error: error instanceof Error ? error.message : error,
    });
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
      const payload: TokenPayload = await verifyToken(token);
      c.set('user', {
        userId: payload.userId,
        email: payload.email,
        role: payload.role as UserRole,
        organizationId: payload.organizationId,
        permissions: payload.permissions as PermissionKey[],
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
