/**
 * Auth Controller - Dual-Auth Pattern
 * 
 * Handles authentication-related requests with dual-platform support:
 * - Web: HttpOnly cookies (XSS-proof)
 * - Mobile: JSON tokens (SecureStore)
 * 
 * DUAL-AUTH TRAP PATTERN:
 * - Sets HttpOnly cookies for web app
 * - Returns tokens in JSON payload for mobile app
 * - Web app ignores JSON tokens (uses cookies)
 * - Mobile app uses JSON tokens (stores in SecureStore)
 * 
 * Security features:
 * - HttpOnly cookies (XSS-proof for web)
 * - SecureStore tokens (encrypted for mobile)
 * - Redis token denylist (real logout)
 * - JWT access + refresh tokens
 * - Secure cookie settings
 * 
 * ELITE PATTERN: Controllers blindly trust c.req.valid('json')
 * Validation is enforced at route level via @hono/zod-validator
 */

import { Context } from 'hono';
import { z } from 'zod';
import { setCookie, getCookie, deleteCookie } from 'hono/cookie';
import { db, schema } from '../db';
import { eq } from 'drizzle-orm';
import { hashPassword, comparePassword } from '../utils/password';
import {
  generateToken,
  generateRefreshToken,
  verifyToken,
  decodeToken,
} from '../utils/jwt';
import { cache } from '../config/redis.config';
import {
  userRegistrationSchema,
  userLoginSchema,
} from '@validiant/shared';
import type { User } from '../db/schema';

/**
 * Cookie configuration for secure token storage
 * Must match Express version for frontend compatibility
 */
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'Strict' as const,
  path: '/',
};

const ACCESS_TOKEN_MAX_AGE = 15 * 60; // 15 minutes (in seconds for Hono)
const REFRESH_TOKEN_MAX_AGE = 7 * 24 * 60 * 60; // 7 days (in seconds for Hono)

/**
 * Helper: Format user response (no sensitive data)
 */
const formatUserResponse = (user: User) => ({
  id: user.id,
  email: user.email,
  firstName: user.firstName,
  lastName: user.lastName,
  fullName: `${user.firstName} ${user.lastName}`,
  avatar: user.avatarUrl,
  emailVerified: user.emailVerified,
  twoFactorEnabled: user.twoFactorEnabled,
  createdAt: user.createdAt.toISOString(),
  updatedAt: user.updatedAt.toISOString(),
});

/**
 * Register new user
 * POST /api/v1/auth/register
 * 
 * Payload validated by zValidator(userRegistrationSchema) at route level
 * 
 * DUAL-AUTH: Returns tokens in JSON + sets HttpOnly cookies
 */
export const register = async (c: Context) => {
  try {
    // ELITE PATTERN: Explicit type casting for decoupled validation
    const { email, password, fullName } = (await c.req.json()) as z.infer<typeof userRegistrationSchema>;

    // Parse fullName into firstName and lastName
    const nameParts = fullName.trim().split(/\s+/);
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    // Check if user already exists
    const existingUser = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, email))
      .limit(1);

    if (existingUser.length > 0) {
      return c.json(
        {
          success: false,
          error: 'Email already registered',
          message: 'A user with this email already exists',
        },
        409
      );
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user with fullName field (CATEGORY 6 FIX)
    const [user] = await db
      .insert(schema.users)
      .values({
        email,
        passwordHash: hashedPassword,
        firstName,
        lastName,
        fullName,  // ← CATEGORY 6 FIX: Added fullName field
      })
      .returning();

    // Generate tokens (PHASE 2 FIX: Added await)
    const accessToken = await generateToken({
      userId: user.id,
      email: user.email,
    });
    const refreshToken = await generateRefreshToken({
      userId: user.id,
      email: user.email,
    });

    // Set tokens as HttpOnly cookies (for web)
    setCookie(c, 'accessToken', accessToken, {
      ...COOKIE_OPTIONS,
      maxAge: ACCESS_TOKEN_MAX_AGE,
    });

    setCookie(c, 'refreshToken', refreshToken, {
      ...COOKIE_OPTIONS,
      maxAge: REFRESH_TOKEN_MAX_AGE,
    });

    // ✅ DUAL-AUTH: Return tokens in JSON (for mobile)
    // Web app will ignore these (uses cookies)
    // Mobile app will use these (stores in SecureStore)
    return c.json(
      {
        success: true,
        data: {
          user: formatUserResponse(user) as any,
          accessToken,   // ← Mobile app needs this
          refreshToken,  // ← Mobile app needs this
        },
      },
      201
    );
  } catch (error) {
    console.error('Register error:', error);
    return c.json(
      {
        success: false,
        error: 'Registration failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
};

/**
 * Login user
 * POST /api/v1/auth/login
 * 
 * Payload validated by zValidator(userLoginSchema) at route level
 * 
 * DUAL-AUTH: Returns tokens in JSON + sets HttpOnly cookies
 */
export const login = async (c: Context) => {
  try {
    // ELITE PATTERN: Explicit type casting for decoupled validation
    const { email, password } = (await c.req.json()) as z.infer<typeof userLoginSchema>;

    // Find user
    const [user] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, email))
      .limit(1);

    if (!user) {
      return c.json(
        {
          success: false,
          error: 'Invalid credentials',
          message: 'Email or password is incorrect',
        },
        401
      );
    }

    // CATEGORY 6 FIX: Add passwordHash null check (OAuth user protection)
    if (!user.passwordHash) {
      return c.json(
        {
          success: false,
          error: 'Invalid credentials',
          message: 'This account uses OAuth authentication',
        },
        401
      );
    }

    // Verify password
    const isPasswordValid = await comparePassword(password, user.passwordHash);

    if (!isPasswordValid) {
      return c.json(
        {
          success: false,
          error: 'Invalid credentials',
          message: 'Email or password is incorrect',
        },
        401
      );
    }

    // Generate tokens (PHASE 2 FIX: Added await)
    const accessToken = await generateToken({
      userId: user.id,
      email: user.email,
    });
    const refreshToken = await generateRefreshToken({
      userId: user.id,
      email: user.email,
    });

    // Set tokens as HttpOnly cookies (for web)
    setCookie(c, 'accessToken', accessToken, {
      ...COOKIE_OPTIONS,
      maxAge: ACCESS_TOKEN_MAX_AGE,
    });

    setCookie(c, 'refreshToken', refreshToken, {
      ...COOKIE_OPTIONS,
      maxAge: REFRESH_TOKEN_MAX_AGE,
    });

    // ✅ DUAL-AUTH: Return tokens in JSON (for mobile)
    // Web app will ignore these (uses cookies)
    // Mobile app will use these (stores in SecureStore)
    return c.json({
      success: true,
      data: {
        user: formatUserResponse(user) as any,
        accessToken,   // ← Mobile app needs this
        refreshToken,  // ← Mobile app needs this
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return c.json(
      {
        success: false,
        error: 'Login failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
};

/**
 * Refresh access token
 * POST /api/v1/auth/refresh
 * 
 * DUAL-AUTH:
 * - Web: Reads refresh token from cookie, sets new access token cookie
 * - Mobile: Reads refresh token from Authorization header, returns new access token in JSON
 */
export const refresh = async (c: Context) => {
  try {
    // Try to get refresh token from cookie (web) or Authorization header (mobile)
    let refreshToken = getCookie(c, 'refreshToken');
    
    // If no cookie, try Authorization header (mobile)
    if (!refreshToken) {
      const authHeader = c.req.header('Authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        refreshToken = authHeader.substring(7);
      }
    }

    if (!refreshToken) {
      return c.json(
        {
          success: false,
          error: 'Refresh token not found',
          message: 'No refresh token provided',
        },
        401
      );
    }

    // Verify refresh token (PHASE 2 FIX: Added await)
    const decoded = await verifyToken(refreshToken);

    if (!decoded) {
      return c.json(
        {
          success: false,
          error: 'Invalid refresh token',
          message: 'Refresh token is invalid or expired',
        },
        401
      );
    }

    // Check if refresh token is in denylist (CRITICAL SECURITY)
    const isDenied = await cache.exists(`token:denylist:${refreshToken}`);
    if (isDenied) {
      return c.json(
        {
          success: false,
          error: 'Token has been revoked',
          message: 'This token has been invalidated',
        },
        401
      );
    }

    // Generate new access token (PHASE 2 FIX: Added await)
    const newAccessToken = await generateToken({
      userId: decoded.userId,
      email: decoded.email,
    });

    // Set new access token cookie (for web)
    setCookie(c, 'accessToken', newAccessToken, {
      ...COOKIE_OPTIONS,
      maxAge: ACCESS_TOKEN_MAX_AGE,
    });

    // ✅ DUAL-AUTH: Return new access token in JSON (for mobile)
    return c.json({
      success: true,
      data: {
        accessToken: newAccessToken,  // ← Mobile app needs this
        message: 'Token refreshed successfully',
      },
    });
  } catch (error) {
    console.error('Refresh error:', error);
    return c.json(
      {
        success: false,
        error: 'Token refresh failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
};

/**
 * Get current user
 * GET /api/v1/auth/me
 * 
 * Requires authentication - user set by auth middleware
 * Works for both web (cookie) and mobile (Authorization header)
 */
export const getMe = async (c: Context) => {
  try {
    // User data is set by auth middleware
    const user = c.get('user');

    if (!user || !user.userId) {
      return c.json(
        {
          success: false,
          error: 'Unauthorized',
          message: 'Authentication required',
        },
        401
      );
    }

    // Find user in database
    const [dbUser] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, user.userId))
      .limit(1);

    if (!dbUser) {
      return c.json(
        {
          success: false,
          error: 'User not found',
          message: 'User account no longer exists',
        },
        404
      );
    }

    return c.json({
      success: true,
      data: {
        user: formatUserResponse(dbUser) as any,
      },
    });
  } catch (error) {
    console.error('Get me error:', error);
    return c.json(
      {
        success: false,
        error: 'Failed to get user',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
};

/**
 * Logout user with Redis token denylist
 * POST /api/v1/auth/logout
 * 
 * CRITICAL SECURITY: Adds tokens to Redis denylist to prevent reuse
 * 
 * DUAL-AUTH:
 * - Web: Clears cookies
 * - Mobile: Client should delete tokens from SecureStore
 */
export const logout = async (c: Context) => {
  try {
    // Get tokens from cookies (web) or Authorization header (mobile)
    let accessToken = getCookie(c, 'accessToken');
    let refreshToken = getCookie(c, 'refreshToken');
    
    // If no cookies, try Authorization header (mobile)
    if (!accessToken) {
      const authHeader = c.req.header('Authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        accessToken = authHeader.substring(7);
      }
    }

    // Add access token to Redis denylist with TTL matching its expiration
    if (accessToken) {
      try {
        const decoded = decodeToken(accessToken);
        if (decoded && decoded.exp) {
          const remainingTTL = decoded.exp - Math.floor(Date.now() / 1000);
          if (remainingTTL > 0) {
            await cache.set(`token:denylist:${accessToken}`, true, remainingTTL);
          }
        }
      } catch (err) {
        // Token might be invalid/expired, skip denylist
        console.warn('Failed to denylist access token:', err);
      }
    }

    // Add refresh token to Redis denylist with TTL matching its expiration
    if (refreshToken) {
      try {
        const decoded = decodeToken(refreshToken);
        if (decoded && decoded.exp) {
          const remainingTTL = decoded.exp - Math.floor(Date.now() / 1000);
          if (remainingTTL > 0) {
            await cache.set(`token:denylist:${refreshToken}`, true, remainingTTL);
          }
        }
      } catch (err) {
        // Token might be invalid/expired, skip denylist
        console.warn('Failed to denylist refresh token:', err);
      }
    }

    // Clear cookies using deleteCookie (for web)
    deleteCookie(c, 'accessToken', {
      ...COOKIE_OPTIONS,
    });

    deleteCookie(c, 'refreshToken', {
      ...COOKIE_OPTIONS,
    });

    return c.json({
      success: true,
      data: {
        message: 'Logged out successfully',
      },
    });
  } catch (error) {
    console.error('Logout error:', error);
    return c.json(
      {
        success: false,
        error: 'Logout failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
};
