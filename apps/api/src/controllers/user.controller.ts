/**
 * User Controller
 * 
 * Handles HTTP requests for user management endpoints.
 * Includes profile management, user listing, and admin operations.
 * 
 * Edge-compatible Hono implementation.
 * Functions: 16 total (profile, preferences, admin operations, etc.)
 * 
 * ELITE PATTERN: Controllers NEVER parse/validate - they blindly trust c.req.valid()
 * All validation happens at route level via @hono/zod-validator
 */

import { Context } from 'hono';
import { z } from 'zod';
import * as userService from '../services/user.service';
import {
  updateUserProfileSchema,
  updateUserPreferencesSchema,
  userListQuerySchema,
  userSearchQuerySchema,
  updateUserRoleSchema,
  updateUserStatusSchema,
} from '@validiant/shared';

/**
 * Get current user profile
 * GET /api/v1/users/me
 */
export const getCurrentUserProfile = async (c: Context) => {
  try {
    const user = c.get('user');

    if (!user || !user.userId) {
      return c.json(
        {
          success: false,
          error: 'Unauthorized',
          message: 'User not authenticated',
        },
        401
      );
    }

    const userProfile = await userService.getUserById(user.userId);

    return c.json({
      success: true,
      data: { user: userProfile },
    });
  } catch (error) {
    console.error('Get current user profile error:', error);
    return c.json(
      {
        success: false,
        error: 'Failed to get profile',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
};

/**
 * Update current user profile
 * PUT /api/v1/users/me
 * 
 * Payload validated by zValidator(updateUserProfileSchema) at route level
 */
export const updateCurrentUserProfile = async (c: Context) => {
  try {
    const user = c.get('user');

    if (!user || !user.userId) {
      return c.json(
        {
          success: false,
          error: 'Unauthorized',
          message: 'User not authenticated',
        },
        401
      );
    }

    // ELITE PATTERN: Explicit type casting for decoupled validation
    const validatedData = (await c.req.json()) as z.infer<typeof updateUserProfileSchema>;

    const updatedUser = await userService.updateProfile(user.userId, validatedData);

    return c.json({
      success: true,
      message: 'Profile updated successfully',
      data: { user: updatedUser },
    });
  } catch (error) {
    console.error('Update current user profile error:', error);
    return c.json(
      {
        success: false,
        error: 'Failed to update profile',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
};

/**
 * Update user preferences
 * PUT /api/v1/users/me/preferences
 * 
 * Payload validated by zValidator(updateUserPreferencesSchema) at route level
 */
export const updateUserPreferences = async (c: Context) => {
  try {
    const user = c.get('user');

    if (!user || !user.userId) {
      return c.json(
        {
          success: false,
          error: 'Unauthorized',
          message: 'User not authenticated',
        },
        401
      );
    }

    // ELITE PATTERN: Explicit type casting for decoupled validation
    const { preferences } = (await c.req.json()) as z.infer<typeof updateUserPreferencesSchema>;

    const updatedUser = await userService.updatePreferences(
      user.userId,
      preferences
    );

    return c.json({
      success: true,
      message: 'Preferences updated successfully',
      data: { user: updatedUser },
    });
  } catch (error) {
    console.error('Update user preferences error:', error);
    return c.json(
      {
        success: false,
        error: 'Failed to update preferences',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
};

/**
 * Update notification preferences
 * PUT /api/v1/users/me/notifications
 * 
 * No validation schema yet - accepts raw JSON
 */
export const updateNotificationPreferences = async (c: Context) => {
  try {
    const user = c.get('user');

    if (!user || !user.userId) {
      return c.json(
        {
          success: false,
          error: 'Unauthorized',
          message: 'User not authenticated',
        },
        401
      );
    }

    const body = await c.req.json();
    const { notificationPreferences } = body;

    if (!notificationPreferences) {
      return c.json(
        {
          success: false,
          error: 'Bad Request',
          message: 'notificationPreferences is required',
        },
        400
      );
    }

    const updatedUser = await userService.updateNotificationPreferences(
      user.userId,
      notificationPreferences
    );

    return c.json({
      success: true,
      message: 'Notification preferences updated successfully',
      data: { user: updatedUser },
    });
  } catch (error) {
    console.error('Update notification preferences error:', error);
    return c.json(
      {
        success: false,
        error: 'Failed to update notification preferences',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
};

/**
 * Delete current user account
 * DELETE /api/v1/users/me
 */
export const deleteCurrentUser = async (c: Context) => {
  try {
    const user = c.get('user');

    if (!user || !user.userId) {
      return c.json(
        {
          success: false,
          error: 'Unauthorized',
          message: 'User not authenticated',
        },
        401
      );
    }

    await userService.deleteUser(user.userId);

    return c.json({
      success: true,
      message: 'Account deleted successfully',
      data: null,
    });
  } catch (error) {
    console.error('Delete current user error:', error);
    return c.json(
      {
        success: false,
        error: 'Failed to delete account',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
};

/**
 * Get user by ID
 * GET /api/v1/users/:id
 */
export const getUserById = async (c: Context) => {
  try {
    const id = c.req.param('id');
    const currentUser = c.get('user');

    if (!id) {
      return c.json(
        {
          success: false,
          error: 'Bad Request',
          message: 'User ID is required',
        },
        400
      );
    }

    const user = await userService.getUserById(id);

    // Remove sensitive data if not self or admin
    const isAdmin =
      currentUser?.role === 'admin' || currentUser?.role === 'super_admin';
    const isSelf = currentUser?.userId === id;

    if (!isSelf && !isAdmin) {
      const publicUser = {
        id: user.id,
        fullName: user.fullName,
        displayName: user.displayName,
        bio: user.bio,
        avatarUrl: user.avatarUrl,
        role: user.role,
      };
      return c.json({
        success: true,
        data: { user: publicUser },
      });
    }

    return c.json({
      success: true,
      data: { user },
    });
  } catch (error) {
    console.error('Get user by ID error:', error);
    return c.json(
      {
        success: false,
        error: 'Failed to get user',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
};

/**
 * List users with pagination and filters
 * GET /api/v1/users
 * 
 * Query validated by zValidator(userListQuerySchema) at route level
 */
export const listUsers = async (c: Context) => {
  try {
    // ELITE PATTERN: Explicit type casting for decoupled validation
    const validatedQuery = c.req.query() as unknown as z.infer<typeof userListQuerySchema>;

    const result = await userService.listUsers({
      page: validatedQuery.page,
      perPage: validatedQuery.perPage,
      search: validatedQuery.search,
      role: validatedQuery.role,
      status: validatedQuery.status,
      sortBy: validatedQuery.sortBy,
      sortOrder: validatedQuery.sortOrder,
    });

    return c.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('List users error:', error);
    return c.json(
      {
        success: false,
        error: 'Failed to list users',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
};

/**
 * Search users
 * GET /api/v1/users/search
 * 
 * Query validated by zValidator(userSearchQuerySchema) at route level
 */
export const searchUsers = async (c: Context) => {
  try {
    // ELITE PATTERN: Explicit type casting for decoupled validation
    const { q, limit } = c.req.query() as unknown as z.infer<typeof userSearchQuerySchema>;

    const users = await userService.searchUsers(q, limit || 10);

    return c.json({
      success: true,
      data: { users },
    });
  } catch (error) {
    console.error('Search users error:', error);
    return c.json(
      {
        success: false,
        error: 'Failed to search users',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
};

/**
 * Check email availability
 * GET /api/v1/users/check-email
 */
export const checkEmailAvailability = async (c: Context) => {
  try {
    const email = c.req.query('email');
    const currentUser = c.get('user');

    if (!email || typeof email !== 'string') {
      return c.json(
        {
          success: false,
          error: 'Bad Request',
          message: 'Email is required',
        },
        400
      );
    }

    const isAvailable = await userService.isEmailAvailable(email, currentUser?.userId);

    return c.json({
      success: true,
      data: { available: isAvailable },
    });
  } catch (error) {
    console.error('Check email availability error:', error);
    return c.json(
      {
        success: false,
        error: 'Failed to check email availability',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
};

/**
 * Update user profile by ID (admin only)
 * PUT /api/v1/users/:id
 * 
 * Payload validated by zValidator(updateUserProfileSchema) at route level
 */
export const updateUserById = async (c: Context) => {
  try {
    const id = c.req.param('id');
    const currentUser = c.get('user');

    if (!id) {
      return c.json(
        {
          success: false,
          error: 'Bad Request',
          message: 'User ID is required',
        },
        400
      );
    }

    // Prevent self-modification via this endpoint
    if (currentUser?.userId === id) {
      return c.json(
        {
          success: false,
          error: 'Forbidden',
          message: 'Use /users/me endpoint to update your own profile',
        },
        403
      );
    }

    // ELITE PATTERN: Explicit type casting for decoupled validation
    const validatedData = (await c.req.json()) as z.infer<typeof updateUserProfileSchema>;

    const user = await userService.updateProfile(id, validatedData);

    return c.json({
      success: true,
      message: 'User profile updated successfully',
      data: { user },
    });
  } catch (error) {
    console.error('Update user by ID error:', error);
    return c.json(
      {
        success: false,
        error: 'Failed to update user profile',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
};

/**
 * Update user role (admin only)
 * PATCH /api/v1/users/:id/role
 * 
 * Payload validated by zValidator(updateUserRoleSchema) at route level
 */
export const updateUserRole = async (c: Context) => {
  try {
    const id = c.req.param('id');
    const currentUser = c.get('user');

    if (!id) {
      return c.json(
        {
          success: false,
          error: 'Bad Request',
          message: 'User ID is required',
        },
        400
      );
    }

    // Prevent self-modification
    if (currentUser?.userId === id) {
      return c.json(
        {
          success: false,
          error: 'Forbidden',
          message: 'Cannot modify your own role',
        },
        403
      );
    }

    // ELITE PATTERN: Explicit type casting for decoupled validation
    const { role } = (await c.req.json()) as z.infer<typeof updateUserRoleSchema>;

    const user = await userService.updateUserRole(id, role);

    return c.json({
      success: true,
      message: 'User role updated successfully',
      data: { user },
    });
  } catch (error) {
    console.error('Update user role error:', error);
    return c.json(
      {
        success: false,
        error: 'Failed to update user role',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
};

/**
 * Update user status (admin only)
 * PATCH /api/v1/users/:id/status
 * 
 * Payload validated by zValidator(updateUserStatusSchema) at route level
 */
export const updateUserStatus = async (c: Context) => {
  try {
    const id = c.req.param('id');
    const currentUser = c.get('user');

    if (!id) {
      return c.json(
        {
          success: false,
          error: 'Bad Request',
          message: 'User ID is required',
        },
        400
      );
    }

    // Prevent self-modification
    if (currentUser?.userId === id) {
      return c.json(
        {
          success: false,
          error: 'Forbidden',
          message: 'Cannot modify your own status',
        },
        403
      );
    }

    // ELITE PATTERN: Explicit type casting for decoupled validation
    const { status } = (await c.req.json()) as z.infer<typeof updateUserStatusSchema>;

    const user = await userService.updateUserStatus(id, status);

    return c.json({
      success: true,
      message: 'User status updated successfully',
      data: { user },
    });
  } catch (error) {
    console.error('Update user status error:', error);
    return c.json(
      {
        success: false,
        error: 'Failed to update user status',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
};

/**
 * Delete user by ID (admin only)
 * DELETE /api/v1/users/:id
 */
export const deleteUserById = async (c: Context) => {
  try {
    const id = c.req.param('id');
    const currentUser = c.get('user');

    if (!id) {
      return c.json(
        {
          success: false,
          error: 'Bad Request',
          message: 'User ID is required',
        },
        400
      );
    }

    // Prevent self-deletion via this endpoint
    if (currentUser?.userId === id) {
      return c.json(
        {
          success: false,
          error: 'Forbidden',
          message: 'Use /users/me endpoint to delete your own account',
        },
        403
      );
    }

    await userService.deleteUser(id);

    return c.json({
      success: true,
      message: 'User deleted successfully',
      data: null,
    });
  } catch (error) {
    console.error('Delete user by ID error:', error);
    return c.json(
      {
        success: false,
        error: 'Failed to delete user',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
};

/**
 * Get user statistics (admin only)
 * GET /api/v1/users/stats
 */
export const getUserStats = async (c: Context) => {
  try {
    const stats = await userService.getUserStats();

    return c.json({
      success: true,
      data: { stats },
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    return c.json(
      {
        success: false,
        error: 'Failed to get user statistics',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
};

/**
 * Get user activity log
 * GET /api/v1/users/:id/activity
 */
export const getUserActivity = async (c: Context) => {
  try {
    const id = c.req.param('id');
    const currentUser = c.get('user');
    const page = parseInt(c.req.query('page') || '1', 10);
    const perPage = Math.min(parseInt(c.req.query('perPage') || '20', 10), 100);

    if (!id) {
      return c.json(
        {
          success: false,
          error: 'Bad Request',
          message: 'User ID is required',
        },
        400
      );
    }

    // Users can only view their own activity unless admin
    const isAdmin =
      currentUser?.role === 'admin' || currentUser?.role === 'super_admin';
    const isSelf = currentUser?.userId === id;

    if (!isSelf && !isAdmin) {
      return c.json(
        {
          success: false,
          error: 'Forbidden',
          message: "Cannot view other users' activity",
        },
        403
      );
    }

    const offset = (page - 1) * perPage;

    // Import database
    const { db } = await import('../db/index');

    // Get total count
    const countResult = await db.execute(
      'SELECT COUNT(*) as count FROM user_activity_log WHERE user_id = $1',
      [id]
    );

    const total = countResult?.rows?.[0]?.count || 0;

    // Get activity logs
    const activities = await db.execute(
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
      [id, perPage, offset]
    );

    return c.json({
      success: true,
      data: {
        activities: activities.rows || [],
        pagination: {
          total: typeof total === 'number' ? total : parseInt(String(total), 10),
          page,
          perPage,
          totalPages: Math.ceil((typeof total === 'number' ? total : parseInt(String(total), 10)) / perPage),
        },
      },
    });
  } catch (error) {
    console.error('Get user activity error:', error);
    return c.json(
      {
        success: false,
        error: 'Failed to get user activity',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
};

/**
 * Bulk delete users (admin only)
 * POST /api/v1/users/bulk-delete
 * 
 * No validation schema yet - accepts raw JSON with userIds array
 */
export const bulkDeleteUsers = async (c: Context) => {
  try {
    const body = await c.req.json();
    const { userIds } = body;
    const currentUser = c.get('user');

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return c.json(
        {
          success: false,
          error: 'Bad Request',
          message: 'userIds must be a non-empty array',
        },
        400
      );
    }

    // Prevent self-deletion
    if (userIds.includes(currentUser?.userId)) {
      return c.json(
        {
          success: false,
          error: 'Forbidden',
          message: 'Cannot delete your own account via bulk delete',
        },
        403
      );
    }

    // Delete users
    for (const userId of userIds) {
      await userService.deleteUser(userId);
    }

    return c.json({
      success: true,
      message: `${userIds.length} users deleted successfully`,
      data: { deletedCount: userIds.length },
    });
  } catch (error) {
    console.error('Bulk delete users error:', error);
    return c.json(
      {
        success: false,
        error: 'Failed to delete users',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
};
