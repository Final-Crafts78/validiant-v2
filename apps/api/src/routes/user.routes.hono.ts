/**
 * User Routes (Hono Version)
 * 
 * User management endpoints with edge-native validation.
 * Migrated from Express to Hono for Cloudflare Workers deployment.
 * 
 * Routes:
 * - GET /me - Get current user profile
 * - PUT /me - Update current user profile
 * - DELETE /me - Delete current user account
 * - PUT /me/preferences - Update user preferences
 * - PUT /me/notifications - Update notification preferences
 * - GET /search - Search users
 * - GET /check-email - Check email availability
 * - GET /stats - Get user statistics (admin)
 * - POST /bulk-delete - Bulk delete users (admin)
 * - GET / - List all users with pagination
 * - GET /:id - Get user by ID
 * - PUT /:id - Update user profile by ID (admin)
 * - DELETE /:id - Delete user by ID (admin)
 * - PATCH /:id/role - Update user role (admin)
 * - PATCH /:id/status - Update user status (admin)
 * - GET /:id/activity - Get user activity log
 * 
 * ELITE PATTERN:
 * - Routes use @hono/zod-validator for edge validation
 * - Controllers blindly trust c.req.valid('json' | 'query')
 * - Middleware handles auth, routes handle validation
 */

import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import {
  updateUserProfileSchema,
  updateUserPreferencesSchema,
  updateUserRoleSchema,
  updateUserStatusSchema,
  userListQuerySchema,
  userSearchQuerySchema,
} from '@validiant/shared';
import * as userController from '../controllers/user.controller.hono';
import { authenticate } from '../middleware/auth.hono';

/**
 * Create user routes Hono instance
 * All routes require authentication
 */
const app = new Hono();

/**
 * Apply authentication middleware to all user routes
 * CRITICAL: Must be authenticated to access any user endpoint
 */
app.use('*', authenticate);

// ============================================================================
// CURRENT USER ENDPOINTS (/me)
// ============================================================================

/**
 * GET /me
 * Get current user profile
 * 
 * No validation needed (uses auth context)
 * Response: 200 OK with user object
 */
app.get('/me', userController.getCurrentUserProfile);

/**
 * PUT /me
 * Update current user profile
 * 
 * Validation: updateUserProfileSchema (fullName, displayName, bio, phoneNumber, avatarUrl)
 * Response: 200 OK with updated user object
 */
app.put(
  '/me',
  zValidator('json', updateUserProfileSchema),
  userController.updateCurrentUserProfile
);

/**
 * DELETE /me
 * Delete current user account (soft delete)
 * 
 * No validation needed
 * Response: 200 OK with success message
 */
app.delete('/me', userController.deleteCurrentUser);

/**
 * PUT /me/preferences
 * Update user preferences (theme, language, timezone, etc.)
 * 
 * Validation: updateUserPreferencesSchema
 * Response: 200 OK with updated user object
 */
app.put(
  '/me/preferences',
  zValidator('json', updateUserPreferencesSchema),
  userController.updateUserPreferences
);

/**
 * PUT /me/notifications
 * Update notification preferences
 * 
 * No validation schema yet - accepts raw JSON
 * Response: 200 OK with updated user object
 */
app.put('/me/notifications', userController.updateNotificationPreferences);

// ============================================================================
// USER SEARCH AND LISTING ENDPOINTS
// ============================================================================

/**
 * GET /search
 * Quick search users by name or email
 * 
 * Validation: userSearchQuerySchema (q, limit)
 * Response: 200 OK with users array
 */
app.get(
  '/search',
  zValidator('query', userSearchQuerySchema),
  userController.searchUsers
);

/**
 * GET /check-email
 * Check if email address is available
 * 
 * Query params: email (string)
 * Response: 200 OK with { available: boolean }
 */
app.get('/check-email', userController.checkEmailAvailability);

// ============================================================================
// ADMIN ENDPOINTS (require admin role - to be enforced in Phase 5)
// ============================================================================

/**
 * GET /stats
 * Get user statistics (total users, active users, etc.)
 * 
 * FUTURE: Add requireAdmin middleware in Phase 5
 * Response: 200 OK with stats object
 */
app.get('/stats', userController.getUserStats);

/**
 * POST /bulk-delete
 * Bulk delete multiple users
 * 
 * FUTURE: Add requireAdmin middleware + validation schema in Phase 5
 * Body: { userIds: string[] }
 * Response: 200 OK with deletion count
 */
app.post('/bulk-delete', userController.bulkDeleteUsers);

// ============================================================================
// USER LIST ENDPOINT (with pagination and filters)
// ============================================================================

/**
 * GET /
 * List all users with pagination, search, and filters
 * 
 * Validation: userListQuerySchema (page, perPage, search, role, status, sortBy, sortOrder)
 * Response: 200 OK with paginated users
 */
app.get(
  '/',
  zValidator('query', userListQuerySchema),
  userController.listUsers
);

// ============================================================================
// INDIVIDUAL USER ENDPOINTS (by ID)
// ============================================================================

/**
 * GET /:id
 * Get user by ID
 * 
 * Params: id (UUID)
 * Response: 200 OK with user object (full details for self/admin, limited for others)
 */
app.get('/:id', userController.getUserById);

/**
 * PUT /:id
 * Update user profile by ID (admin only)
 * 
 * FUTURE: Add requireAdmin middleware in Phase 5
 * Validation: updateUserProfileSchema
 * Response: 200 OK with updated user object
 */
app.put(
  '/:id',
  zValidator('json', updateUserProfileSchema),
  userController.updateUserById
);

/**
 * DELETE /:id
 * Delete user by ID (admin only, soft delete)
 * 
 * FUTURE: Add requireAdmin middleware in Phase 5
 * Response: 200 OK with success message
 */
app.delete('/:id', userController.deleteUserById);

/**
 * PATCH /:id/role
 * Update user role (admin only)
 * 
 * FUTURE: Add requireAdmin middleware in Phase 5
 * Validation: updateUserRoleSchema (role)
 * Response: 200 OK with updated user object
 */
app.patch(
  '/:id/role',
  zValidator('json', updateUserRoleSchema),
  userController.updateUserRole
);

/**
 * PATCH /:id/status
 * Update user status (admin only)
 * 
 * FUTURE: Add requireAdmin middleware in Phase 5
 * Validation: updateUserStatusSchema (status, reason)
 * Response: 200 OK with updated user object
 */
app.patch(
  '/:id/status',
  zValidator('json', updateUserStatusSchema),
  userController.updateUserStatus
);

/**
 * GET /:id/activity
 * Get user activity log (self or admin only)
 * 
 * Params: id (UUID)
 * Query: page, perPage
 * Response: 200 OK with activity logs and pagination
 */
app.get('/:id/activity', userController.getUserActivity);

export default app;
