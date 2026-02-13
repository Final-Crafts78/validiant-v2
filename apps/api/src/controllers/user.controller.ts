/**
 * User Controller
 * 
 * Handles HTTP requests for user management endpoints.
 * Includes profile management, user listing, and admin operations.
 */

import { Response } from 'express';
import { AuthRequest, asyncHandler } from '../middleware';
import * as userService from '../services/user.service';
import { BadRequestError, ForbiddenError } from '../utils/errors';
import { logger } from '../utils/logger';
import {
  updateUserProfileSchema,
  updateUserPreferencesSchema,
  updateUserRoleSchema,
  updateUserStatusSchema,
  userListQuerySchema,
  userSearchQuerySchema,
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
 * Get current user profile
 * GET /api/v1/users/me
 */
export const getCurrentUserProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw new BadRequestError('User not authenticated');
  }

  const user = await userService.getUserById(req.user.id);
  sendSuccess(res, { user });
});

/**
 * Update current user profile
 * PUT /api/v1/users/me
 */
export const updateCurrentUserProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw new BadRequestError('User not authenticated');
  }

  const validatedData = updateUserProfileSchema.parse(req.body);

  const user = await userService.updateProfile(req.user.id, validatedData);

  sendSuccess(res, { user }, 'Profile updated successfully');
});

/**
 * Update user preferences
 * PUT /api/v1/users/me/preferences
 */
export const updateUserPreferences = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw new BadRequestError('User not authenticated');
  }

  const validatedData = updateUserPreferencesSchema.parse(req.body);

  const user = await userService.updatePreferences(req.user.id, validatedData.preferences);

  sendSuccess(res, { user }, 'Preferences updated successfully');
});

/**
 * Update notification preferences
 * PUT /api/v1/users/me/notifications
 */
export const updateNotificationPreferences = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      throw new BadRequestError('User not authenticated');
    }

    const { notificationPreferences } = req.body;

    if (!notificationPreferences) {
      throw new BadRequestError('notificationPreferences is required');
    }

    const user = await userService.updateNotificationPreferences(
      req.user.id,
      notificationPreferences
    );

    sendSuccess(res, { user }, 'Notification preferences updated successfully');
  }
);

/**
 * Delete current user account
 * DELETE /api/v1/users/me
 */
export const deleteCurrentUser = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw new BadRequestError('User not authenticated');
  }

  await userService.deleteUser(req.user.id);

  sendSuccess(res, null, 'Account deleted successfully');
});

/**
 * Get user by ID
 * GET /api/v1/users/:id
 */
export const getUserById = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  if (!id) {
    throw new BadRequestError('User ID is required');
  }

  const user = await userService.getUserById(id);

  // Remove sensitive data if not self or admin
  if (req.user?.id !== id && req.user?.role !== 'admin' && req.user?.role !== 'super_admin') {
    const publicUser = {
      id: user.id,
      fullName: user.fullName,
      displayName: user.displayName,
      bio: user.bio,
      avatarUrl: user.avatarUrl,
      role: user.role,
    };
    return sendSuccess(res, { user: publicUser });
  }

  sendSuccess(res, { user });
});

/**
 * List users with pagination and filters
 * GET /api/v1/users
 */
export const listUsers = asyncHandler(async (req: AuthRequest, res: Response) => {
  const validatedQuery = userListQuerySchema.parse(req.query);

  const result = await userService.listUsers({
    page: validatedQuery.page,
    perPage: validatedQuery.perPage,
    search: validatedQuery.search,
    role: validatedQuery.role,
    status: validatedQuery.status,
    sortBy: validatedQuery.sortBy,
    sortOrder: validatedQuery.sortOrder,
  });

  sendSuccess(res, result);
});

/**
 * Search users
 * GET /api/v1/users/search
 */
export const searchUsers = asyncHandler(async (req: AuthRequest, res: Response) => {
  const validatedQuery = userSearchQuerySchema.parse(req.query);

  if (!validatedQuery.q) {
    throw new BadRequestError('Search query (q) is required');
  }

  const users = await userService.searchUsers(
    validatedQuery.q,
    validatedQuery.limit || 10
  );

  sendSuccess(res, { users });
});

/**
 * Check email availability
 * GET /api/v1/users/check-email
 */
export const checkEmailAvailability = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { email } = req.query;

  if (!email || typeof email !== 'string') {
    throw new BadRequestError('Email is required');
  }

  const isAvailable = await userService.isEmailAvailable(email, req.user?.id);

  sendSuccess(res, { available: isAvailable });
});

/**
 * Update user profile by ID (admin only)
 * PUT /api/v1/users/:id
 */
export const updateUserById = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  if (!id) {
    throw new BadRequestError('User ID is required');
  }

  // Prevent self-modification via this endpoint
  if (req.user?.id === id) {
    throw new ForbiddenError('Use /users/me endpoint to update your own profile');
  }

  const validatedData = updateUserProfileSchema.parse(req.body);

  const user = await userService.updateProfile(id, validatedData);

  sendSuccess(res, { user }, 'User profile updated successfully');
});

/**
 * Update user role (admin only)
 * PATCH /api/v1/users/:id/role
 */
export const updateUserRole = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  if (!id) {
    throw new BadRequestError('User ID is required');
  }

  // Prevent self-modification
  if (req.user?.id === id) {
    throw new ForbiddenError('Cannot modify your own role');
  }

  const validatedData = updateUserRoleSchema.parse(req.body);

  const user = await userService.updateUserRole(id, validatedData.role);

  sendSuccess(res, { user }, 'User role updated successfully');
});

/**
 * Update user status (admin only)
 * PATCH /api/v1/users/:id/status
 */
export const updateUserStatus = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  if (!id) {
    throw new BadRequestError('User ID is required');
  }

  // Prevent self-modification
  if (req.user?.id === id) {
    throw new ForbiddenError('Cannot modify your own status');
  }

  const validatedData = updateUserStatusSchema.parse(req.body);

  const user = await userService.updateUserStatus(id, validatedData.status);

  sendSuccess(res, { user }, 'User status updated successfully');
});

/**
 * Delete user by ID (admin only)
 * DELETE /api/v1/users/:id
 */
export const deleteUserById = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  if (!id) {
    throw new BadRequestError('User ID is required');
  }

  // Prevent self-deletion via this endpoint
  if (req.user?.id === id) {
    throw new ForbiddenError('Use /users/me endpoint to delete your own account');
  }

  await userService.deleteUser(id);

  sendSuccess(res, null, 'User deleted successfully');
});

/**
 * Get user statistics (admin only)
 * GET /api/v1/users/stats
 */
export const getUserStats = asyncHandler(async (req: AuthRequest, res: Response) => {
  const stats = await userService.getUserStats();

  sendSuccess(res, { stats });
});

/**
 * Get user activity log
 * GET /api/v1/users/:id/activity
 */
export const getUserActivity = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { page = 1, perPage = 20 } = req.query;

  if (!id) {
    throw new BadRequestError('User ID is required');
  }

  // Users can only view their own activity unless admin
  if (req.user?.id !== id && req.user?.role !== 'admin' && req.user?.role !== 'super_admin') {
    throw new ForbiddenError('Cannot view other users\' activity');
  }

  const pageNum = parseInt(page as string, 10);
  const perPageNum = Math.min(parseInt(perPage as string, 10), 100);
  const offset = (pageNum - 1) * perPageNum;

  const { db } = await import('../config/database.config');

  // Get total count
  const countResult = await db.one<{ count: number }>(
    'SELECT COUNT(*) as count FROM user_activity_log WHERE user_id = $1',
    [id]
  );

  const total = countResult?.count || 0;

  // Get activity logs
  const activities = await db.any(
    `
      SELECT 
        id, action, entity_type as "entityType", entity_id as "entityId",
        metadata, ip_address as "ipAddress", user_agent as "userAgent",
        created_at as "createdAt"
      FROM user_activity_log
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
    `,
    [id, perPageNum, offset]
  );

  sendSuccess(res, {
    activities,
    pagination: {
      total,
      page: pageNum,
      perPage: perPageNum,
      totalPages: Math.ceil(total / perPageNum),
    },
  });
});

/**
 * Bulk delete users (admin only)
 * POST /api/v1/users/bulk-delete
 */
export const bulkDeleteUsers = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { userIds } = req.body;

  if (!Array.isArray(userIds) || userIds.length === 0) {
    throw new BadRequestError('userIds must be a non-empty array');
  }

  // Prevent self-deletion
  if (userIds.includes(req.user?.id)) {
    throw new ForbiddenError('Cannot delete your own account via bulk delete');
  }

  // Delete users
  for (const userId of userIds) {
    await userService.deleteUser(userId);
  }

  sendSuccess(res, { deletedCount: userIds.length }, `${userIds.length} users deleted successfully`);
});
