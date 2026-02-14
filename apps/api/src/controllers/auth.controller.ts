/**
 * Auth Controller
 * 
 * Handles authentication-related requests with HttpOnly cookie-based security.
 */

import { Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { hashPassword, comparePassword } from '../utils/password';
import { generateAccessToken, generateRefreshToken, verifyToken, decodeToken } from '../utils/jwt';
import { sendSuccess, sendError } from '../utils/response';
import { HTTP_STATUS, ERROR_CODES } from '@validiant/shared';
import { cache } from '../config/redis.config';
import type { AuthRequest } from '../middleware/auth';
import type { User } from '@validiant/shared';

/**
 * Cookie configuration for secure token storage
 */
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  path: '/',
};

const ACCESS_TOKEN_MAX_AGE = 15 * 60 * 1000; // 15 minutes
const REFRESH_TOKEN_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days

/**
 * Register new user
 */
export const register = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, password, firstName, lastName } = req.body;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      sendError(
        res,
        'Email already registered',
        HTTP_STATUS.CONFLICT
      );
      return;
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
      },
    });

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
    res.cookie('accessToken', accessToken, {
      ...COOKIE_OPTIONS,
      maxAge: ACCESS_TOKEN_MAX_AGE,
    });

    res.cookie('refreshToken', refreshToken, {
      ...COOKIE_OPTIONS,
      maxAge: REFRESH_TOKEN_MAX_AGE,
    });

    // Prepare response (NO TOKENS in body)
    const userResponse: User = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };

    sendSuccess(res, { user: userResponse }, HTTP_STATUS.CREATED);
  } catch (error) {
    next(error);
  }
};

/**
 * Login user
 */
export const login = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      sendError(
        res,
        'Invalid credentials',
        HTTP_STATUS.UNAUTHORIZED
      );
      return;
    }

    // Verify password
    const isPasswordValid = await comparePassword(password, user.password);

    if (!isPasswordValid) {
      sendError(
        res,
        'Invalid credentials',
        HTTP_STATUS.UNAUTHORIZED
      );
      return;
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
    res.cookie('accessToken', accessToken, {
      ...COOKIE_OPTIONS,
      maxAge: ACCESS_TOKEN_MAX_AGE,
    });

    res.cookie('refreshToken', refreshToken, {
      ...COOKIE_OPTIONS,
      maxAge: REFRESH_TOKEN_MAX_AGE,
    });

    // Prepare response (NO TOKENS in body)
    const userResponse: User = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };

    sendSuccess(res, { user: userResponse });
  } catch (error) {
    next(error);
  }
};

/**
 * Refresh access token
 */
export const refresh = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      sendError(
        res,
        'Refresh token not found',
        HTTP_STATUS.UNAUTHORIZED
      );
      return;
    }

    // Verify refresh token
    const decoded = verifyToken(refreshToken);

    if (!decoded) {
      sendError(
        res,
        'Invalid refresh token',
        HTTP_STATUS.UNAUTHORIZED
      );
      return;
    }

    // Check if refresh token is in denylist
    const isDenied = await cache.exists(`token:denylist:${refreshToken}`);
    if (isDenied) {
      sendError(
        res,
        'Token has been revoked',
        HTTP_STATUS.UNAUTHORIZED
      );
      return;
    }

    // Generate new access token
    const newAccessToken = generateAccessToken({
      userId: decoded.userId,
      email: decoded.email,
    });

    // Set new access token cookie
    res.cookie('accessToken', newAccessToken, {
      ...COOKIE_OPTIONS,
      maxAge: ACCESS_TOKEN_MAX_AGE,
    });

    sendSuccess(res, { message: 'Token refreshed successfully' });
  } catch (error) {
    next(error);
  }
};

/**
 * Get current user
 */
export const getMe = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      sendError(
        res,
        ERROR_CODES.UNAUTHORIZED,
        HTTP_STATUS.UNAUTHORIZED
      );
      return;
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
    });

    if (!user) {
      sendError(
        res,
        ERROR_CODES.NOT_FOUND,
        HTTP_STATUS.NOT_FOUND
      );
      return;
    }

    // Prepare response
    const userResponse: User = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };

    sendSuccess(res, userResponse);
  } catch (error) {
    next(error);
  }
};

/**
 * Logout user with Redis token denylist
 */
export const logout = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get tokens from cookies
    const accessToken = req.cookies.accessToken;
    const refreshToken = req.cookies.refreshToken;

    // Add tokens to Redis denylist with TTL matching their expiration
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
      }
    }

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
      }
    }

    // Clear cookies by setting them to expire immediately
    res.cookie('accessToken', '', {
      ...COOKIE_OPTIONS,
      maxAge: 0,
    });

    res.cookie('refreshToken', '', {
      ...COOKIE_OPTIONS,
      maxAge: 0,
    });

    sendSuccess(res, { message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
};
