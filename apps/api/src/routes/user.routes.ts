/**
 * User Routes
 * 
 * Defines all user management endpoints with proper middleware.
 */

import { Router } from 'express';
import * as userController from '../controllers/user.controller';
import {
  authenticate,
  requireAdmin,
  requireEmailVerified,
} from '../middleware/auth.middleware';
import { validate } from '../middleware';
import {
  updateUserProfileSchema,
  updateUserPreferencesSchema,
  updateUserRoleSchema,
  updateUserStatusSchema,
  userListQuerySchema,
  userSearchQuerySchema,
} from '@validiant/shared';

const router = Router();

/**
 * All user routes require authentication
 */
router.use(authenticate);

/**
 * Current user endpoints
 */

/**
 * @route   GET /api/v1/users/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/me', userController.getCurrentUserProfile);

/**
 * @route   PUT /api/v1/users/me
 * @desc    Update current user profile
 * @access  Private
 */
router.put(
  '/me',
  validate(updateUserProfileSchema, 'body'),
  userController.updateCurrentUserProfile
);

/**
 * @route   DELETE /api/v1/users/me
 * @desc    Delete current user account
 * @access  Private
 */
router.delete('/me', userController.deleteCurrentUser);

/**
 * @route   PUT /api/v1/users/me/preferences
 * @desc    Update user preferences
 * @access  Private
 */
router.put(
  '/me/preferences',
  validate(updateUserPreferencesSchema, 'body'),
  userController.updateUserPreferences
);

/**
 * @route   PUT /api/v1/users/me/notifications
 * @desc    Update notification preferences
 * @access  Private
 */
router.put('/me/notifications', userController.updateNotificationPreferences);

/**
 * User search and listing endpoints
 */

/**
 * @route   GET /api/v1/users/search
 * @desc    Search users
 * @access  Private
 */
router.get(
  '/search',
  validate(userSearchQuerySchema, 'query'),
  userController.searchUsers
);

/**
 * @route   GET /api/v1/users/check-email
 * @desc    Check if email is available
 * @access  Private
 */
router.get('/check-email', userController.checkEmailAvailability);

/**
 * Admin-only endpoints
 */

/**
 * @route   GET /api/v1/users/stats
 * @desc    Get user statistics
 * @access  Admin
 */
router.get('/stats', requireAdmin, userController.getUserStats);

/**
 * @route   POST /api/v1/users/bulk-delete
 * @desc    Bulk delete users
 * @access  Admin
 */
router.post('/bulk-delete', requireAdmin, userController.bulkDeleteUsers);

/**
 * @route   GET /api/v1/users
 * @desc    List all users with pagination and filters
 * @access  Private (full details for admins, limited for others)
 */
router.get(
  '/',
  validate(userListQuerySchema, 'query'),
  userController.listUsers
);

/**
 * Individual user endpoints (by ID)
 */

/**
 * @route   GET /api/v1/users/:id
 * @desc    Get user by ID
 * @access  Private (full details for self/admin, limited for others)
 */
router.get('/:id', userController.getUserById);

/**
 * @route   PUT /api/v1/users/:id
 * @desc    Update user profile by ID
 * @access  Admin
 */
router.put(
  '/:id',
  requireAdmin,
  validate(updateUserProfileSchema, 'body'),
  userController.updateUserById
);

/**
 * @route   DELETE /api/v1/users/:id
 * @desc    Delete user by ID
 * @access  Admin
 */
router.delete('/:id', requireAdmin, userController.deleteUserById);

/**
 * @route   PATCH /api/v1/users/:id/role
 * @desc    Update user role
 * @access  Admin
 */
router.patch(
  '/:id/role',
  requireAdmin,
  validate(updateUserRoleSchema, 'body'),
  userController.updateUserRole
);

/**
 * @route   PATCH /api/v1/users/:id/status
 * @desc    Update user status
 * @access  Admin
 */
router.patch(
  '/:id/status',
  requireAdmin,
  validate(updateUserStatusSchema, 'body'),
  userController.updateUserStatus
);

/**
 * @route   GET /api/v1/users/:id/activity
 * @desc    Get user activity log
 * @access  Private (self) / Admin (others)
 */
router.get('/:id/activity', userController.getUserActivity);

/**
 * Export router
 */
export default router;
