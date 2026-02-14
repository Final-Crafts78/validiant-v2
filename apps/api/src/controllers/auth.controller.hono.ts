/**
 * Auth Controller (Hono Version)
 * 
 * Handles authentication-related requests with HttpOnly cookie-based security.
 * Migrated from Express to Hono for edge compatibility.
 * 
 * Security features preserved:
 * - HttpOnly cookies (XSS-proof)
 * - Redis token denylist (real logout)
 * - JWT access + refresh tokens
 * - Secure cookie settings
 * 
 * ELITE PATTERN: Controllers blindly trust c.req.valid('json')
 * Validation is enforced at route level via @hono/zod-validator
 */

import { Context } from 'hono';
import { db, schema } from '../db';
import { eq } from 'drizzle-orm';
import { hashPassword, comparePassword } from '../utils/password';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
  decodeToken,
} from '../utils/jwt';
import { cache } from '../config/redis.config';
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
  createdAt: user.createdAt.toISOString(),
  updatedAt: user.updatedAt.toISOString(),
});

/**
 * Register new user
 * POST /api/v1/auth/register
 * 
 * Payload validated by zValidator(registerSchema) at route level
 */
export const register = async (c: Context) => {
  try {
    // ELITE PATTERN: Blindly trust pre-validated payload
    const { email, password, firstName, lastName } = c.req.valid('json');

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

    // Create user
    const [user] = await db
      .insert(schema.users)
      .values({
        email,
        password: hashedPassword,
        firstName,
        lastName,
      })
      .returning();

    // Generate tokens
    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
    });
    const refreshToken = generateRefreshToken({
      userId: user.id,
      email: user.email,
    });

    // Set tokens as HttpOnly cookies
    c.cookie('accessToken', accessToken, {
      ...COOKIE_OPTIONS,
      maxAge: ACCESS_TOKEN_MAX_AGE,
    });

    c.cookie('refreshToken', refreshToken, {
      ...COOKIE_OPTIONS,
      maxAge: REFRESH_TOKEN_MAX_AGE,
    });

    // Return user response (NO TOKENS in body)
    return c.json(
      {
        success: true,
        data: {
          user: formatUserResponse(user),
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
 * Payload validated by zValidator(loginSchema) at route level
 */
export const login = async (c: Context) => {
  try {
    // ELITE PATTERN: Blindly trust pre-validated payload
    const { email, password } = c.req.valid('json');

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

    // Verify password
    const isPasswordValid = await comparePassword(password, user.password);

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

    // Generate tokens
    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
    });
    const refreshToken = generateRefreshToken({
      userId: user.id,
      email: user.email,
    });

    // Set tokens as HttpOnly cookies
    c.cookie('accessToken', accessToken, {
      ...COOKIE_OPTIONS,
      maxAge: ACCESS_TOKEN_MAX_AGE,
    });

    c.cookie('refreshToken', refreshToken, {
      ...COOKIE_OPTIONS,
      maxAge: REFRESH_TOKEN_MAX_AGE,
    });

    // Return user response (NO TOKENS in body)
    return c.json({
      success: true,
      data: {
        user: formatUserResponse(user),
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
 * No validation needed - reads from cookies only
 */
export const refresh = async (c: Context) => {
  try {
    const refreshToken = c.req.cookie('refreshToken');

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

    // Verify refresh token
    const decoded = verifyToken(refreshToken);

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

    // Generate new access token
    const newAccessToken = generateAccessToken({
      userId: decoded.userId,
      email: decoded.email,
    });

    // Set new access token cookie
    c.cookie('accessToken', newAccessToken, {
      ...COOKIE_OPTIONS,
      maxAge: ACCESS_TOKEN_MAX_AGE,
    });

    return c.json({
      success: true,
      data: {
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
      data: formatUserResponse(dbUser),
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
 */
export const logout = async (c: Context) => {
  try {
    // Get tokens from cookies
    const accessToken = c.req.cookie('accessToken');
    const refreshToken = c.req.cookie('refreshToken');

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

    // Clear cookies by setting maxAge to 0
    c.cookie('accessToken', '', {
      ...COOKIE_OPTIONS,
      maxAge: 0,
    });

    c.cookie('refreshToken', '', {
      ...COOKIE_OPTIONS,
      maxAge: 0,
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
