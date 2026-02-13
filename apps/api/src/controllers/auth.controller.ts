/**
 * Auth Controller
 * 
 * Handles authentication-related requests.
 */

import { Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { hashPassword, comparePassword } from '../utils/password';
import { generateAccessToken, generateRefreshToken } from '../utils/jwt';
import { sendSuccess, sendError } from '../utils/response';
import { HTTP_STATUS, ERROR_CODES } from '@validiant/shared';
import type { AuthRequest } from '../middleware/auth';
import type { AuthResponse, User } from '@validiant/shared';

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

    // Prepare response (exclude password)
    const userResponse: User = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };

    const response: AuthResponse = {
      user: userResponse,
      accessToken,
      refreshToken,
    };

    sendSuccess(res, response, HTTP_STATUS.CREATED);
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

    // Prepare response
    const userResponse: User = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };

    const response: AuthResponse = {
      user: userResponse,
      accessToken,
      refreshToken,
    };

    sendSuccess(res, response);
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
 * Logout user
 */
export const logout = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // In a production app, you would invalidate the refresh token here
    // For now, just send success
    sendSuccess(res, { message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
};
