/**
 * Auth Routes
 * 
 * Authentication endpoints.
 */

import { Router } from 'express';
import * as authController from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { loginSchema, registerSchema } from '@validiant/shared';

const router = Router();

/**
 * POST /auth/register
 * Register a new user
 */
router.post(
  '/register',
  validateBody(registerSchema),
  authController.register
);

/**
 * POST /auth/login
 * Login user
 */
router.post(
  '/login',
  validateBody(loginSchema),
  authController.login
);

/**
 * POST /auth/refresh
 * Refresh access token using refresh token from cookie
 */
router.post(
  '/refresh',
  authController.refresh
);

/**
 * GET /auth/me
 * Get current user
 */
router.get(
  '/me',
  authenticate,
  authController.getMe
);

/**
 * POST /auth/logout
 * Logout user
 */
router.post(
  '/logout',
  authenticate,
  authController.logout
);

export default router;
