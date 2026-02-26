/**
 * Auth Routes
 *
 * Authentication endpoints with edge-native validation.
 * Edge-compatible Hono implementation for Cloudflare Workers.
 *
 * Routes:
 * - POST /register        - Create new user account
 * - POST /login           - Authenticate user
 * - POST /refresh         - Refresh access token
 * - GET  /me              - Get current user profile
 * - POST /logout          - Logout user (denylist tokens)
 * - POST /forgot-password - Request password reset email
 * - POST /reset-password  - Complete password reset with token
 *
 * ELITE PATTERN:
 * - Routes use @hono/zod-validator for edge validation
 * - Controllers blindly trust c.req.valid('json')
 * - Middleware handles auth, routes handle validation
 */

import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { userLoginSchema, userRegistrationSchema } from '@validiant/shared';
import * as authController from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth';

/**
 * Auth router instance.
 * Mounted in app.ts via: app.route('/api/v1/auth', authRoutes)
 */
const authRoutes = new Hono();

// ============================================================================
// CORE AUTH ROUTES
// ============================================================================

/**
 * POST /register
 * Register a new user account
 *
 * Validation: userRegistrationSchema (email, password, fullName)
 * Response: 201 Created with user object + HttpOnly cookies
 */
authRoutes.post(
  '/register',
  zValidator('json', userRegistrationSchema),
  authController.register
);

/**
 * POST /login
 * Authenticate user with email and password
 *
 * Validation: userLoginSchema (email, password)
 * Response: 200 OK with user object + HttpOnly cookies
 */
authRoutes.post(
  '/login',
  zValidator('json', userLoginSchema),
  authController.login
);

/**
 * POST /refresh
 * Refresh access token using refresh token from cookie or Authorization header
 *
 * No body validation needed (reads from cookies / header)
 * Response: 200 OK with new access token
 */
authRoutes.post(
  '/refresh',
  authController.refresh
);

/**
 * GET /me
 * Get current authenticated user's profile
 *
 * Requires: authenticate middleware
 * Response: 200 OK with user object
 */
authRoutes.get(
  '/me',
  authenticate,
  authController.getMe
);

/**
 * POST /logout
 * Logout user (adds tokens to Redis denylist)
 *
 * Requires: authenticate middleware
 * Response: 200 OK with success message
 */
authRoutes.post(
  '/logout',
  authenticate,
  authController.logout
);

// ============================================================================
// PASSWORD RESET FUNNEL
// Both routes are registered directly on authRoutes BEFORE export.
// Final resolved paths (via app.ts mount):
//   POST /api/v1/auth/forgot-password
//   POST /api/v1/auth/reset-password
// ============================================================================

/**
 * POST /forgot-password
 * Request a password reset email
 *
 * Validation: { email: string (valid email format) }
 * Security: Always returns 200 regardless of whether the email exists
 *           to prevent user enumeration attacks.
 * Response: 200 OK with safe success message
 */
authRoutes.post(
  '/forgot-password',
  zValidator(
    'json',
    z.object({
      email: z.string().email('Invalid email format'),
    })
  ),
  authController.forgotPassword
);

/**
 * POST /reset-password
 * Complete password reset using a valid token
 *
 * Validation: { token: string, password: string (min 8 chars) }
 * Guards (in controller): token existence, expiry (1hr), reuse (usedAt)
 * Response: 200 OK with success message
 */
authRoutes.post(
  '/reset-password',
  zValidator(
    'json',
    z.object({
      token: z.string().min(1, 'Reset token is required'),
      password: z.string().min(8, 'Password must be at least 8 characters'),
    })
  ),
  authController.resetPassword
);

// ============================================================================
// EXPORT — must be the final statement; nothing may be registered after this
// ============================================================================
export default authRoutes;
