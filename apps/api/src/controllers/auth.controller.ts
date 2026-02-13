/**
 * Authentication Controller
 * 
 * Handles HTTP requests for authentication endpoints.
 * Validates input, calls service layer, and formats responses.
 */

import { Response } from 'express';
import { AuthRequest, asyncHandler } from '../middleware';
import * as authService from '../services/auth.service';
import { BadRequestError } from '../utils/errors';
import { logger } from '../utils/logger';
import {
  userRegistrationSchema,
  userLoginSchema,
  passwordResetRequestSchema,
  passwordResetConfirmationSchema,
  changePasswordSchema,
  refreshTokenSchema,
  emailVerificationSchema,
} from '@validiant/shared';

/**
 * Success response helper
 */
const sendSuccess = <T>(
  res: Response,
  data: T,
  message?: string,
  statusCode: number = 200
): void => {
  res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

/**
 * Register new user
 * POST /api/v1/auth/register
 */
export const register = asyncHandler(async (req: AuthRequest, res: Response) => {
  // Validate request body
  const validatedData = userRegistrationSchema.parse(req.body);

  // Register user
  const { user, tokens } = await authService.register({
    email: validatedData.email,
    password: validatedData.password,
    fullName: validatedData.fullName,
  });

  // Remove sensitive data from response
  const userResponse = {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
    status: user.status,
    emailVerified: user.emailVerified,
    createdAt: user.createdAt,
  };

  sendSuccess(
    res,
    {
      user: userResponse,
      tokens,
    },
    'User registered successfully',
    201
  );
});

/**
 * Login user
 * POST /api/v1/auth/login
 */
export const login = asyncHandler(async (req: AuthRequest, res: Response) => {
  // Validate request body
  const validatedData = userLoginSchema.parse(req.body);

  // Extract device info from headers/user agent
  const deviceInfo = {
    userAgent: req.headers['user-agent'],
    ip: req.ip,
    deviceId: req.headers['x-device-id'],
  };

  // Login user
  const { user, tokens } = await authService.login({
    email: validatedData.email,
    password: validatedData.password,
    deviceInfo,
  });

  // Remove sensitive data from response
  const userResponse = {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
    status: user.status,
    emailVerified: user.emailVerified,
  };

  sendSuccess(
    res,
    {
      user: userResponse,
      tokens,
    },
    'Login successful'
  );
});

/**
 * Refresh access token
 * POST /api/v1/auth/refresh
 */
export const refreshToken = asyncHandler(async (req: AuthRequest, res: Response) => {
  // Validate request body
  const validatedData = refreshTokenSchema.parse(req.body);

  // Refresh token
  const tokens = await authService.refreshAccessToken(validatedData.refreshToken);

  sendSuccess(res, { tokens }, 'Token refreshed successfully');
});

/**
 * Logout user
 * POST /api/v1/auth/logout
 */
export const logout = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw new BadRequestError('User not authenticated');
  }

  // Extract session ID from token
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    throw new BadRequestError('No authorization header');
  }

  const token = authHeader.split(' ')[1];
  const jwt = await import('jsonwebtoken');
  const decoded = jwt.default.decode(token) as { sessionId: string };

  if (!decoded?.sessionId) {
    throw new BadRequestError('Invalid token');
  }

  // Logout
  await authService.logout(decoded.sessionId, req.user.id);

  sendSuccess(res, null, 'Logout successful');
});

/**
 * Get current user
 * GET /api/v1/auth/me
 */
export const getCurrentUser = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw new BadRequestError('User not authenticated');
  }

  // Get full user details from database
  const { db } = await import('../config/database.config');
  const user = await db.one(
    `
      SELECT 
        id, email, full_name as "fullName", display_name as "displayName",
        bio, phone_number as "phoneNumber", avatar_url as "avatarUrl",
        role, status, email_verified as "emailVerified",
        created_at as "createdAt", updated_at as "updatedAt",
        last_login_at as "lastLoginAt"
      FROM users
      WHERE id = $1 AND deleted_at IS NULL
    `,
    [req.user.id]
  );

  sendSuccess(res, { user });
});

/**
 * Request password reset
 * POST /api/v1/auth/password-reset/request
 */
export const requestPasswordReset = asyncHandler(async (req: AuthRequest, res: Response) => {
  // Validate request body
  const validatedData = passwordResetRequestSchema.parse(req.body);

  // Request password reset
  await authService.requestPasswordReset(validatedData.email);

  // Always return success to prevent email enumeration
  sendSuccess(
    res,
    null,
    'If an account exists with this email, a password reset link has been sent'
  );
});

/**
 * Reset password with token
 * POST /api/v1/auth/password-reset/confirm
 */
export const resetPassword = asyncHandler(async (req: AuthRequest, res: Response) => {
  // Validate request body
  const validatedData = passwordResetConfirmationSchema.parse(req.body);

  // Reset password
  await authService.resetPassword(validatedData.token, validatedData.newPassword);

  sendSuccess(res, null, 'Password reset successfully');
});

/**
 * Change password (authenticated user)
 * POST /api/v1/auth/password/change
 */
export const changePassword = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw new BadRequestError('User not authenticated');
  }

  // Validate request body
  const validatedData = changePasswordSchema.parse(req.body);

  // Change password
  await authService.changePassword(
    req.user.id,
    validatedData.currentPassword,
    validatedData.newPassword
  );

  sendSuccess(res, null, 'Password changed successfully');
});

/**
 * Verify email
 * POST /api/v1/auth/email/verify
 */
export const verifyEmail = asyncHandler(async (req: AuthRequest, res: Response) => {
  // Validate request body
  const validatedData = emailVerificationSchema.parse(req.body);

  // Verify email
  await authService.verifyEmail(validatedData.token);

  sendSuccess(res, null, 'Email verified successfully');
});

/**
 * Resend verification email
 * POST /api/v1/auth/email/resend
 */
export const resendVerificationEmail = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw new BadRequestError('User not authenticated');
  }

  // TODO: Implement resend verification email
  // This would:
  // 1. Generate new verification token
  // 2. Send email with verification link
  
  sendSuccess(res, null, 'Verification email sent');
});

/**
 * Get user sessions
 * GET /api/v1/auth/sessions
 */
export const getSessions = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw new BadRequestError('User not authenticated');
  }

  // Get user sessions
  const sessions = await authService.getUserSessions(req.user.id);

  sendSuccess(res, { sessions });
});

/**
 * Revoke specific session
 * DELETE /api/v1/auth/sessions/:sessionId
 */
export const revokeSession = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw new BadRequestError('User not authenticated');
  }

  const { sessionId } = req.params;

  if (!sessionId) {
    throw new BadRequestError('Session ID is required');
  }

  // Revoke session
  await authService.revokeSession(sessionId);

  sendSuccess(res, null, 'Session revoked successfully');
});

/**
 * Revoke all sessions except current
 * POST /api/v1/auth/sessions/revoke-all
 */
export const revokeAllSessions = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw new BadRequestError('User not authenticated');
  }

  // Extract current session ID
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    throw new BadRequestError('No authorization header');
  }

  const token = authHeader.split(' ')[1];
  const jwt = await import('jsonwebtoken');
  const decoded = jwt.default.decode(token) as { sessionId: string };
  const currentSessionId = decoded?.sessionId;

  // Get all sessions
  const sessions = await authService.getUserSessions(req.user.id);

  // Revoke all except current
  for (const session of sessions) {
    const sessionId = (session as any).sessionId;
    if (sessionId && sessionId !== currentSessionId) {
      await authService.revokeSession(sessionId);
    }
  }

  sendSuccess(res, null, 'All other sessions revoked successfully');
});

/**
 * Check authentication status
 * GET /api/v1/auth/status
 */
export const checkAuthStatus = asyncHandler(async (req: AuthRequest, res: Response) => {
  const isAuthenticated = !!req.user;

  sendSuccess(res, {
    authenticated: isAuthenticated,
    user: isAuthenticated ? {
      id: req.user!.id,
      email: req.user!.email,
      role: req.user!.role,
    } : null,
  });
});

/**
 * Validate token (without authentication middleware)
 * POST /api/v1/auth/validate
 */
export const validateToken = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { token } = req.body;

  if (!token) {
    throw new BadRequestError('Token is required');
  }

  try {
    const jwt = await import('jsonwebtoken');
    const { env } = await import('../config/env.config');
    
    const decoded = jwt.default.verify(token, env.JWT_SECRET) as {
      userId: string;
      email: string;
      role: string;
    };

    sendSuccess(res, {
      valid: true,
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
    });
  } catch (error) {
    sendSuccess(res, {
      valid: false,
      error: 'Invalid or expired token',
    });
  }
});
