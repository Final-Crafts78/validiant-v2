/**
 * Authentication Routes
 * 
 * Defines all authentication endpoints and their middleware.
 */

import { Router } from 'express';
import * as authController from '../controllers/auth.controller';
import { authenticate, optionalAuthenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware';
import {
  userRegistrationSchema,
  userLoginSchema,
  passwordResetRequestSchema,
  passwordResetConfirmationSchema,
  changePasswordSchema,
  refreshTokenSchema,
  emailVerificationSchema,
} from '@validiant/shared';

const router = Router();

/**
 * Public routes (no authentication required)
 */

/**
 * @route   POST /api/v1/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post(
  '/register',
  validate(userRegistrationSchema, 'body'),
  authController.register
);

/**
 * @route   POST /api/v1/auth/login
 * @desc    Login user and get tokens
 * @access  Public
 */
router.post(
  '/login',
  validate(userLoginSchema, 'body'),
  authController.login
);

/**
 * @route   POST /api/v1/auth/refresh
 * @desc    Refresh access token using refresh token
 * @access  Public
 */
router.post(
  '/refresh',
  validate(refreshTokenSchema, 'body'),
  authController.refreshToken
);

/**
 * @route   POST /api/v1/auth/password-reset/request
 * @desc    Request password reset email
 * @access  Public
 */
router.post(
  '/password-reset/request',
  validate(passwordResetRequestSchema, 'body'),
  authController.requestPasswordReset
);

/**
 * @route   POST /api/v1/auth/password-reset/confirm
 * @desc    Reset password with token
 * @access  Public
 */
router.post(
  '/password-reset/confirm',
  validate(passwordResetConfirmationSchema, 'body'),
  authController.resetPassword
);

/**
 * @route   POST /api/v1/auth/email/verify
 * @desc    Verify email with token
 * @access  Public
 */
router.post(
  '/email/verify',
  validate(emailVerificationSchema, 'body'),
  authController.verifyEmail
);

/**
 * @route   POST /api/v1/auth/validate
 * @desc    Validate JWT token
 * @access  Public
 */
router.post('/validate', authController.validateToken);

/**
 * @route   GET /api/v1/auth/status
 * @desc    Check authentication status
 * @access  Public (but uses optional auth)
 */
router.get('/status', optionalAuthenticate, authController.checkAuthStatus);

/**
 * Protected routes (authentication required)
 */

/**
 * @route   GET /api/v1/auth/me
 * @desc    Get current authenticated user
 * @access  Private
 */
router.get('/me', authenticate, authController.getCurrentUser);

/**
 * @route   POST /api/v1/auth/logout
 * @desc    Logout user and invalidate session
 * @access  Private
 */
router.post('/logout', authenticate, authController.logout);

/**
 * @route   POST /api/v1/auth/password/change
 * @desc    Change password for authenticated user
 * @access  Private
 */
router.post(
  '/password/change',
  authenticate,
  validate(changePasswordSchema, 'body'),
  authController.changePassword
);

/**
 * @route   POST /api/v1/auth/email/resend
 * @desc    Resend email verification
 * @access  Private
 */
router.post('/email/resend', authenticate, authController.resendVerificationEmail);

/**
 * @route   GET /api/v1/auth/sessions
 * @desc    Get all active sessions for current user
 * @access  Private
 */
router.get('/sessions', authenticate, authController.getSessions);

/**
 * @route   DELETE /api/v1/auth/sessions/:sessionId
 * @desc    Revoke specific session
 * @access  Private
 */
router.delete('/sessions/:sessionId', authenticate, authController.revokeSession);

/**
 * @route   POST /api/v1/auth/sessions/revoke-all
 * @desc    Revoke all sessions except current
 * @access  Private
 */
router.post('/sessions/revoke-all', authenticate, authController.revokeAllSessions);

/**
 * Export router
 */
export default router;
