/**
 * Authentication Middleware
 * 
 * Edge-native authentication middleware for Hono.
 * Verifies JWT tokens from HttpOnly cookies or Authorization header.
 * Checks Redis denylist for revoked tokens.
 * 
 * CRITICAL: Edge-compatible (no Node.js crypto module)
 * Uses jsonwebtoken library which works on Cloudflare Workers
 */

import { Context, Next } from 'hono';
import { getCookie } from 'hono/cookie';
import { verifyToken } from '../utils/jwt';
import { cache } from '../config/redis.config';

/**
 * User context interface
 * Attached to Hono Context via c.set('user', ...)
 */
export interface HonoUser {
  userId: string;
  email: string;
}

/**
 * Authenticate middleware
 * 
 * Verifies JWT token from:
 * 1. HttpOnly cookie (preferred for web clients)
 * 2. Authorization header (fallback for mobile/API clients)
 * 
 * Checks Redis denylist for revoked tokens (logout security)
 * Attaches user to Hono context if valid
 */
export const authenticate = async (c: Context, next: Next) => {
  try {
    let token: string | null = null;

    // Try to get token from HttpOnly cookie (secure)
    token = getCookie(c, 'accessToken') || null;

    // Fallback: check Authorization header for mobile/API clients
    if (!token) {
      const authHeader = c.req.header('Authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }

    // No token found
    if (!token) {
      return c.json(
        {
          success: false,
          error: 'Unauthorized',
          message: 'No authentication token provided',
        },
        401
      );
    }

    // Check if token is in Redis denylist (revoked after logout)
    const isDenied = await cache.exists(`token:denylist:${token}`);
    if (isDenied) {
      return c.json(
        {
          success: false,
          error: 'Token revoked',
          message: 'This token has been invalidated',
        },
        401
      );
    }

    // Verify token signature and expiration
    let payload;
    try {
      payload = verifyToken(token);
    } catch (error) {
      return c.json(
        {
          success: false,
          error: 'Invalid token',
          message: error instanceof Error ? error.message : 'Token verification failed',
        },
        401
      );
    }

    // Attach user to Hono context
    c.set('user', {
      userId: payload.userId,
      email: payload.email,
    } as HonoUser);

    // Continue to controller
    await next();
  } catch (error) {
    console.error('Authentication error:', error);
    return c.json(
      {
        success: false,
        error: 'Authentication failed',
        message: 'An error occurred during authentication',
      },
      500
    );
  }
};

/**
 * Optional authentication
 * 
 * Attaches user to context if valid token exists,
 * but does NOT fail if token is missing or invalid.
 * 
 * Useful for endpoints that work for both authenticated
 * and anonymous users (e.g., public profiles with extra data for logged-in users)
 */
export const optionalAuth = async (c: Context, next: Next) => {
  try {
    let token: string | null = null;

    // Try cookie first
    token = getCookie(c, 'accessToken') || null;

    // Fallback to header
    if (!token) {
      const authHeader = c.req.header('Authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }

    // If token exists, try to verify it
    if (token) {
      try {
        // Check denylist
        const isDenied = await cache.exists(`token:denylist:${token}`);
        if (!isDenied) {
          const payload = verifyToken(token);
          c.set('user', {
            userId: payload.userId,
            email: payload.email,
          } as HonoUser);
        }
      } catch (error) {
        // Token invalid, continue without user (no error)
        console.debug('Optional auth: Invalid token, continuing without user');
      }
    }

    // Always continue to next middleware/controller
    await next();
  } catch (error) {
    console.error('Optional auth error:', error);
    // Continue even on error (optional auth should never block)
    await next();
  }
};
