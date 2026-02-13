/**
 * Authentication Service
 * 
 * Handles user authentication operations including registration, login,
 * JWT token generation, password management, and session handling.
 */

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../config/database.config';
import { cache, session } from '../config/redis.config';
import { env } from '../config/env.config';
import {
  BadRequestError,
  UnauthorizedError,
  ConflictError,
  NotFoundError,
  TokenError,
} from '../utils/errors';
import { logger, logAuthEvent } from '../utils/logger';
import { UserRole, UserStatus } from '@validiant/shared';

/**
 * User interface
 */
interface User {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  status: UserStatus;
  emailVerified: boolean;
  createdAt: Date;
}

/**
 * JWT tokens interface
 */
interface Tokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

/**
 * Session data interface
 */
interface SessionData {
  userId: string;
  email: string;
  role: UserRole;
  deviceInfo?: any;
  createdAt: Date;
}

/**
 * Hash password using bcrypt
 */
const hashPassword = async (password: string): Promise<string> => {
  return await bcrypt.hash(password, env.BCRYPT_ROUNDS);
};

/**
 * Verify password against hash
 */
const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  return await bcrypt.compare(password, hash);
};

/**
 * Generate JWT access token
 */
const generateAccessToken = (userId: string, email: string, role: UserRole, sessionId: string): string => {
  return jwt.sign(
    {
      userId,
      email,
      role,
      sessionId,
    },
    env.JWT_SECRET,
    {
      expiresIn: env.JWT_ACCESS_EXPIRY,
      issuer: 'validiant-api',
      audience: 'validiant-client',
    }
  );
};

/**
 * Generate JWT refresh token
 */
const generateRefreshToken = (userId: string, sessionId: string): string => {
  return jwt.sign(
    {
      userId,
      sessionId,
      type: 'refresh',
    },
    env.JWT_REFRESH_SECRET,
    {
      expiresIn: env.JWT_REFRESH_EXPIRY,
      issuer: 'validiant-api',
    }
  );
};

/**
 * Generate both access and refresh tokens
 */
const generateTokens = async (
  userId: string,
  email: string,
  role: UserRole,
  deviceInfo?: any
): Promise<Tokens> => {
  const sessionId = uuidv4();

  // Create session data
  const sessionData: SessionData = {
    userId,
    email,
    role,
    deviceInfo,
    createdAt: new Date(),
  };

  // Store session in Redis (24 hours)
  await session.set(sessionId, sessionData, 86400);

  // Generate tokens
  const accessToken = generateAccessToken(userId, email, role, sessionId);
  const refreshToken = generateRefreshToken(userId, sessionId);

  return {
    accessToken,
    refreshToken,
    expiresIn: 3600, // 1 hour in seconds
  };
};

/**
 * Register new user
 */
export const register = async (data: {
  email: string;
  password: string;
  fullName: string;
}): Promise<{ user: User; tokens: Tokens }> => {
  const { email, password, fullName } = data;

  // Check if user already exists
  const existingUser = await db.one<{ id: string }>(
    'SELECT id FROM users WHERE LOWER(email) = LOWER($1) AND deleted_at IS NULL',
    [email]
  );

  if (existingUser) {
    throw new ConflictError('Email already registered');
  }

  // Hash password
  const passwordHash = await hashPassword(password);

  // Create user
  const user = await db.one<User>(
    `
      INSERT INTO users (
        id, email, password_hash, full_name, role, status, email_verified
      ) VALUES (
        gen_random_uuid(), $1, $2, $3, $4, $5, $6
      )
      RETURNING 
        id, email, full_name as "fullName", role, status, 
        email_verified as "emailVerified", created_at as "createdAt"
    `,
    [email.toLowerCase(), passwordHash, fullName, UserRole.USER, UserStatus.ACTIVE, false]
  );

  // Generate tokens
  const tokens = await generateTokens(user.id, user.email, user.role);

  // Log registration event
  logAuthEvent('register', user.id, { email: user.email });

  // TODO: Send verification email
  logger.info('User registered successfully', { userId: user.id, email: user.email });

  return { user, tokens };
};

/**
 * Login user
 */
export const login = async (data: {
  email: string;
  password: string;
  deviceInfo?: any;
}): Promise<{ user: User; tokens: Tokens }> => {
  const { email, password, deviceInfo } = data;

  // Get user with password hash
  const userWithPassword = await db.one<User & { passwordHash: string }>(
    `
      SELECT 
        id, email, password_hash as "passwordHash", full_name as "fullName",
        role, status, email_verified as "emailVerified", created_at as "createdAt"
      FROM users
      WHERE LOWER(email) = LOWER($1) AND deleted_at IS NULL
    `,
    [email]
  );

  if (!userWithPassword) {
    throw new UnauthorizedError('Invalid email or password');
  }

  // Verify password
  const isPasswordValid = await verifyPassword(password, userWithPassword.passwordHash);

  if (!isPasswordValid) {
    // Log failed login attempt
    logger.warn('Failed login attempt', { email });
    throw new UnauthorizedError('Invalid email or password');
  }

  // Check if user is active
  if (userWithPassword.status !== UserStatus.ACTIVE) {
    throw new UnauthorizedError(`Account is ${userWithPassword.status}`);
  }

  // Remove password hash from user object
  const { passwordHash, ...user } = userWithPassword;

  // Update last login timestamp
  await db.raw(
    'UPDATE users SET last_login_at = NOW() WHERE id = $1',
    [user.id]
  );

  // Generate tokens
  const tokens = await generateTokens(user.id, user.email, user.role, deviceInfo);

  // Log login event
  logAuthEvent('login', user.id, { email: user.email });

  logger.info('User logged in successfully', { userId: user.id, email: user.email });

  return { user, tokens };
};

/**
 * Refresh access token using refresh token
 */
export const refreshAccessToken = async (refreshToken: string): Promise<Tokens> => {
  try {
    // Verify refresh token
    const decoded = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET) as {
      userId: string;
      sessionId: string;
      type: string;
    };

    if (decoded.type !== 'refresh') {
      throw new TokenError('Invalid token type');
    }

    // Get session data
    const sessionData = await session.get<SessionData>(decoded.sessionId);

    if (!sessionData) {
      throw new TokenError('Session not found or expired');
    }

    // Get user
    const user = await db.one<User>(
      `
        SELECT id, email, role, status
        FROM users
        WHERE id = $1 AND deleted_at IS NULL
      `,
      [decoded.userId]
    );

    if (!user) {
      throw new UnauthorizedError('User not found');
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedError(`Account is ${user.status}`);
    }

    // Generate new tokens
    const tokens = await generateTokens(user.id, user.email, user.role, sessionData.deviceInfo);

    // Delete old session
    await session.del(decoded.sessionId);

    logger.debug('Access token refreshed', { userId: user.id });

    return tokens;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new TokenError('Refresh token has expired');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new TokenError('Invalid refresh token');
    }
    throw error;
  }
};

/**
 * Logout user (invalidate session)
 */
export const logout = async (sessionId: string, userId: string): Promise<void> => {
  // Delete session from Redis
  await session.del(sessionId);

  // Clear user cache
  await cache.del(`user:${userId}`);

  // Log logout event
  logAuthEvent('logout', userId);

  logger.info('User logged out successfully', { userId });
};

/**
 * Request password reset
 */
export const requestPasswordReset = async (email: string): Promise<void> => {
  // Get user
  const user = await db.one<{ id: string; email: string; fullName: string }>(
    'SELECT id, email, full_name as "fullName" FROM users WHERE LOWER(email) = LOWER($1) AND deleted_at IS NULL',
    [email]
  );

  if (!user) {
    // Don't reveal if email exists
    logger.warn('Password reset requested for non-existent email', { email });
    return;
  }

  // Generate reset token
  const resetToken = uuidv4();
  const tokenHash = await hashPassword(resetToken);

  // Store reset token in database (expires in 1 hour)
  await db.raw(
    `
      INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
      VALUES ($1, $2, NOW() + INTERVAL '1 hour')
    `,
    [user.id, tokenHash]
  );

  // TODO: Send password reset email
  logger.info('Password reset requested', { userId: user.id, email: user.email });
};

/**
 * Reset password with token
 */
export const resetPassword = async (token: string, newPassword: string): Promise<void> => {
  // Get valid reset token
  const resetTokenRecord = await db.one<{ userId: string; tokenHash: string }>(
    `
      SELECT user_id as "userId", token_hash as "tokenHash"
      FROM password_reset_tokens
      WHERE expires_at > NOW() AND used_at IS NULL
      ORDER BY created_at DESC
      LIMIT 1
    `
  );

  if (!resetTokenRecord) {
    throw new BadRequestError('Invalid or expired reset token');
  }

  // Verify token
  const isTokenValid = await verifyPassword(token, resetTokenRecord.tokenHash);

  if (!isTokenValid) {
    throw new BadRequestError('Invalid reset token');
  }

  // Hash new password
  const passwordHash = await hashPassword(newPassword);

  // Update password
  await db.raw(
    'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
    [passwordHash, resetTokenRecord.userId]
  );

  // Mark token as used
  await db.raw(
    'UPDATE password_reset_tokens SET used_at = NOW() WHERE user_id = $1',
    [resetTokenRecord.userId]
  );

  // Invalidate all user sessions
  const sessions = await cache.get<string[]>(`user_sessions:${resetTokenRecord.userId}`);
  if (sessions) {
    for (const sessionId of sessions) {
      await session.del(sessionId);
    }
  }

  // Clear user cache
  await cache.del(`user:${resetTokenRecord.userId}`);

  // Log event
  logAuthEvent('password_reset', resetTokenRecord.userId);

  logger.info('Password reset successfully', { userId: resetTokenRecord.userId });
};

/**
 * Change password (authenticated user)
 */
export const changePassword = async (
  userId: string,
  currentPassword: string,
  newPassword: string
): Promise<void> => {
  // Get user with password hash
  const user = await db.one<{ id: string; passwordHash: string }>(
    'SELECT id, password_hash as "passwordHash" FROM users WHERE id = $1 AND deleted_at IS NULL',
    [userId]
  );

  if (!user) {
    throw new NotFoundError('User');
  }

  // Verify current password
  const isPasswordValid = await verifyPassword(currentPassword, user.passwordHash);

  if (!isPasswordValid) {
    throw new UnauthorizedError('Current password is incorrect');
  }

  // Hash new password
  const passwordHash = await hashPassword(newPassword);

  // Update password
  await db.raw(
    'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
    [passwordHash, userId]
  );

  // Clear user cache
  await cache.del(`user:${userId}`);

  logger.info('Password changed successfully', { userId });
};

/**
 * Verify email with token
 */
export const verifyEmail = async (token: string): Promise<void> => {
  // TODO: Implement email verification logic
  // This would typically involve:
  // 1. Verify token from email
  // 2. Update user's email_verified to true
  // 3. Log the event
  throw new Error('Not implemented');
};

/**
 * Get active sessions for user
 */
export const getUserSessions = async (userId: string): Promise<SessionData[]> => {
  // This would require maintaining a list of session IDs per user
  // For now, return empty array
  // TODO: Implement session tracking
  return [];
};

/**
 * Revoke specific session
 */
export const revokeSession = async (sessionId: string): Promise<void> => {
  await session.del(sessionId);
  logger.info('Session revoked', { sessionId });
};
