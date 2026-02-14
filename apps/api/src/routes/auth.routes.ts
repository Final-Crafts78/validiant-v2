/**
 * Auth Routes
 * 
 * Authentication endpoints with edge-native validation.
 * Edge-compatible Hono implementation for Cloudflare Workers.
 * 
 * Routes:
 * - POST /register - Create new user account
 * - POST /login - Authenticate user
 * - POST /refresh - Refresh access token
 * - GET /me - Get current user profile
 * - POST /logout - Logout user (denylist tokens)
 * 
 * ELITE PATTERN:
 * - Routes use @hono/zod-validator for edge validation
 * - Controllers blindly trust c.req.valid('json')
 * - Middleware handles auth, routes handle validation
 */

import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { loginSchema, registerSchema } from '@validiant/shared';
import * as authController from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth';

/**
 * Create auth routes Hono instance
 */
const app = new Hono();

/**
 * POST /register
 * Register a new user account
 * 
 * Validation: registerSchema (email, password, firstName, lastName)
 * Response: 201 Created with user object + HttpOnly cookies
 */
app.post(
  '/register',
  zValidator('json', registerSchema),
  authController.register
);

/**
 * POST /login
 * Authenticate user with email and password
 * 
 * Validation: loginSchema (email, password)
 * Response: 200 OK with user object + HttpOnly cookies
 */
app.post(
  '/login',
  zValidator('json', loginSchema),
  authController.login
);

/**
 * POST /refresh
 * Refresh access token using refresh token from cookie
 * 
 * No body validation needed (reads from cookies)
 * Response: 200 OK with new access token in cookie
 */
app.post(
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
app.get(
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
app.post(
  '/logout',
  authenticate,
  authController.logout
);

export default app;
