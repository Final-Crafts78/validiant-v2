/**
 * User Service
 * 
 * Handles user profile management, user search, admin operations,
 * and user-related business logic.
 */

import { db } from '../config/database.config';
import { cache } from '../config/redis.config';
import {
  NotFoundError,
  ConflictError,
  BadRequestError,
  assertExists,
} from '../utils/errors';
import { logger } from '../utils/logger';
import { UserRole, UserStatus } from '@validiant/shared';
import bcrypt from 'bcryptjs';
import { env } from '../config/env.config';

/**
 * User interface
 */
interface User {
  id: string;
  email: string;
  fullName: string;
  displayName?: string;
  bio?: string;
  phoneNumber?: string;
  avatarUrl?: string;
  role: UserRole;
  status: UserStatus;
  emailVerified: boolean;
  twoFactorEnabled: boolean;
  preferences: any;
  notificationPreferences: any;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
}

/**
 * User list with pagination
 */
interface UserList {
  users: User[];
  pagination: {
    total: number;
    page: number;
    perPage: number;
    totalPages: number;
  };
}

/**
 * User statistics
 */
interface UserStats {
  totalUsers: number;
  activeUsers: number;
  newUsersThisMonth: number;
  verifiedUsers: number;
  usersByRole: Record<string, number>;
}

/**
 * Get user by ID
 */
export const getUserById = async (userId: string): Promise<User> => {
  // Try cache first
  const cacheKey = `user:${userId}`;
  const cached = await cache.get<User>(cacheKey);
  
  if (cached) {
    return cached;
  }
  
  // Fetch from database
  const user = await db.one<User>(
    `
      SELECT 
        id, email, full_name as "fullName", display_name as "displayName",
        bio, phone_number as "phoneNumber", avatar_url as "avatarUrl",
        role, status, email_verified as "emailVerified",
        two_factor_enabled as "twoFactorEnabled",
        preferences, notification_preferences as "notificationPreferences",
        created_at as "createdAt", updated_at as "updatedAt",
        last_login_at as "lastLoginAt"
      FROM users
      WHERE id = $1 AND deleted_at IS NULL
    `,
    [userId]
  );
  
  assertExists(user, 'User');
  
  // Cache for 5 minutes
  await cache.set(cacheKey, user, 300);
  
  return user;
};

/**
 * Get user by email
 */
export const getUserByEmail = async (email: string): Promise<User | null> => {
  const user = await db.one<User>(
    `
      SELECT 
        id, email, full_name as "fullName", display_name as "displayName",
        bio, phone_number as "phoneNumber", avatar_url as "avatarUrl",
        role, status, email_verified as "emailVerified",
        two_factor_enabled as "twoFactorEnabled",
        preferences, notification_preferences as "notificationPreferences",
        created_at as "createdAt", updated_at as "updatedAt",
        last_login_at as "lastLoginAt"
      FROM users
      WHERE LOWER(email) = LOWER($1) AND deleted_at IS NULL
    `,
    [email]
  );
  
  return user;
};

/**
 * Update user profile
 */
export const updateProfile = async (
  userId: string,
  data: {
    fullName?: string;
    displayName?: string;
    bio?: string;
    phoneNumber?: string;
    avatarUrl?: string;
  }
): Promise<User> => {
  // Build update query dynamically
  const updates: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;
  
  if (data.fullName !== undefined) {
    updates.push(`full_name = $${paramIndex++}`);
    values.push(data.fullName);
  }
  
  if (data.displayName !== undefined) {
    updates.push(`display_name = $${paramIndex++}`);
    values.push(data.displayName);
  }
  
  if (data.bio !== undefined) {
    updates.push(`bio = $${paramIndex++}`);
    values.push(data.bio);
  }
  
  if (data.phoneNumber !== undefined) {
    updates.push(`phone_number = $${paramIndex++}`);
    values.push(data.phoneNumber);
  }
  
  if (data.avatarUrl !== undefined) {
    updates.push(`avatar_url = $${paramIndex++}`);
    values.push(data.avatarUrl);
  }
  
  if (updates.length === 0) {
    throw new BadRequestError('No fields to update');
  }
  
  values.push(userId);
  
  const user = await db.one<User>(
    `
      UPDATE users
      SET ${updates.join(', ')}, updated_at = NOW()
      WHERE id = $${paramIndex} AND deleted_at IS NULL
      RETURNING 
        id, email, full_name as "fullName", display_name as "displayName",
        bio, phone_number as "phoneNumber", avatar_url as "avatarUrl",
        role, status, email_verified as "emailVerified",
        two_factor_enabled as "twoFactorEnabled",
        preferences, notification_preferences as "notificationPreferences",
        created_at as "createdAt", updated_at as "updatedAt",
        last_login_at as "lastLoginAt"
    `,
    values
  );
  
  // Clear cache
  await cache.del(`user:${userId}`);
  
  logger.info('User profile updated', { userId });
  
  return user;
};

/**
 * Update user preferences
 */
export const updatePreferences = async (
  userId: string,
  preferences: any
): Promise<User> => {
  const user = await db.one<User>(
    `
      UPDATE users
      SET preferences = $1, updated_at = NOW()
      WHERE id = $2 AND deleted_at IS NULL
      RETURNING 
        id, email, full_name as "fullName", display_name as "displayName",
        bio, phone_number as "phoneNumber", avatar_url as "avatarUrl",
        role, status, email_verified as "emailVerified",
        two_factor_enabled as "twoFactorEnabled",
        preferences, notification_preferences as "notificationPreferences",
        created_at as "createdAt", updated_at as "updatedAt",
        last_login_at as "lastLoginAt"
    `,
    [JSON.stringify(preferences), userId]
  );
  
  assertExists(user, 'User');
  
  // Clear cache
  await cache.del(`user:${userId}`);
  
  return user;
};

/**
 * Update notification preferences
 */
export const updateNotificationPreferences = async (
  userId: string,
  notificationPreferences: any
): Promise<User> => {
  const user = await db.one<User>(
    `
      UPDATE users
      SET notification_preferences = $1, updated_at = NOW()
      WHERE id = $2 AND deleted_at IS NULL
      RETURNING 
        id, email, full_name as "fullName", display_name as "displayName",
        bio, phone_number as "phoneNumber", avatar_url as "avatarUrl",
        role, status, email_verified as "emailVerified",
        two_factor_enabled as "twoFactorEnabled",
        preferences, notification_preferences as "notificationPreferences",
        created_at as "createdAt", updated_at as "updatedAt",
        last_login_at as "lastLoginAt"
    `,
    [JSON.stringify(notificationPreferences), userId]
  );
  
  assertExists(user, 'User');
  
  // Clear cache
  await cache.del(`user:${userId}`);
  
  return user;
};

/**
 * List users with pagination and filters
 */
export const listUsers = async (params: {
  page?: number;
  perPage?: number;
  search?: string;
  role?: UserRole;
  status?: UserStatus;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}): Promise<UserList> => {
  const page = params.page || 1;
  const perPage = Math.min(params.perPage || 20, 100);
  const offset = (page - 1) * perPage;
  const sortBy = params.sortBy || 'created_at';
  const sortOrder = params.sortOrder || 'desc';
  
  // Build WHERE clause
  const conditions: string[] = ['deleted_at IS NULL'];
  const values: any[] = [];
  let paramIndex = 1;
  
  if (params.search) {
    conditions.push(
      `(LOWER(full_name) LIKE LOWER($${paramIndex}) OR LOWER(email) LIKE LOWER($${paramIndex}))`
    );
    values.push(`%${params.search}%`);
    paramIndex++;
  }
  
  if (params.role) {
    conditions.push(`role = $${paramIndex}`);
    values.push(params.role);
    paramIndex++;
  }
  
  if (params.status) {
    conditions.push(`status = $${paramIndex}`);
    values.push(params.status);
    paramIndex++;
  }
  
  const whereClause = conditions.join(' AND ');
  
  // Get total count
  const countResult = await db.one<{ count: number }>(
    `SELECT COUNT(*) as count FROM users WHERE ${whereClause}`,
    values
  );
  
  const total = countResult?.count || 0;
  
  // Get users
  const users = await db.any<User>(
    `
      SELECT 
        id, email, full_name as "fullName", display_name as "displayName",
        avatar_url as "avatarUrl", role, status,
        email_verified as "emailVerified",
        created_at as "createdAt", updated_at as "updatedAt",
        last_login_at as "lastLoginAt"
      FROM users
      WHERE ${whereClause}
      ORDER BY ${sortBy} ${sortOrder}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `,
    [...values, perPage, offset]
  );
  
  return {
    users,
    pagination: {
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage),
    },
  };
};

/**
 * Delete user (soft delete)
 */
export const deleteUser = async (userId: string): Promise<void> => {
  await db.raw(
    'UPDATE users SET deleted_at = NOW() WHERE id = $1',
    [userId]
  );
  
  // Clear cache
  await cache.del(`user:${userId}`);
  
  logger.info('User deleted', { userId });
};

/**
 * Admin: Update user role
 */
export const updateUserRole = async (
  userId: string,
  role: UserRole
): Promise<User> => {
  const user = await db.one<User>(
    `
      UPDATE users
      SET role = $1, updated_at = NOW()
      WHERE id = $2 AND deleted_at IS NULL
      RETURNING 
        id, email, full_name as "fullName", display_name as "displayName",
        bio, phone_number as "phoneNumber", avatar_url as "avatarUrl",
        role, status, email_verified as "emailVerified",
        two_factor_enabled as "twoFactorEnabled",
        preferences, notification_preferences as "notificationPreferences",
        created_at as "createdAt", updated_at as "updatedAt",
        last_login_at as "lastLoginAt"
    `,
    [role, userId]
  );
  
  assertExists(user, 'User');
  
  // Clear cache
  await cache.del(`user:${userId}`);
  
  logger.info('User role updated', { userId, role });
  
  return user;
};

/**
 * Admin: Update user status
 */
export const updateUserStatus = async (
  userId: string,
  status: UserStatus
): Promise<User> => {
  const user = await db.one<User>(
    `
      UPDATE users
      SET status = $1, updated_at = NOW()
      WHERE id = $2 AND deleted_at IS NULL
      RETURNING 
        id, email, full_name as "fullName", display_name as "displayName",
        bio, phone_number as "phoneNumber", avatar_url as "avatarUrl",
        role, status, email_verified as "emailVerified",
        two_factor_enabled as "twoFactorEnabled",
        preferences, notification_preferences as "notificationPreferences",
        created_at as "createdAt", updated_at as "updatedAt",
        last_login_at as "lastLoginAt"
    `,
    [status, userId]
  );
  
  assertExists(user, 'User');
  
  // Clear cache
  await cache.del(`user:${userId}`);
  
  logger.info('User status updated', { userId, status });
  
  return user;
};

/**
 * Get user statistics (admin)
 */
export const getUserStats = async (): Promise<UserStats> => {
  const stats = await db.one<any>(
    `
      SELECT
        COUNT(*) as total_users,
        COUNT(*) FILTER (WHERE status = 'active') as active_users,
        COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days') as new_users_this_month,
        COUNT(*) FILTER (WHERE email_verified = true) as verified_users
      FROM users
      WHERE deleted_at IS NULL
    `
  );
  
  // Get users by role
  const roleStats = await db.any<{ role: string; count: number }>(
    `
      SELECT role, COUNT(*) as count
      FROM users
      WHERE deleted_at IS NULL
      GROUP BY role
    `
  );
  
  const usersByRole: Record<string, number> = {};
  roleStats.forEach((stat) => {
    usersByRole[stat.role] = parseInt(stat.count.toString(), 10);
  });
  
  return {
    totalUsers: parseInt(stats.total_users, 10),
    activeUsers: parseInt(stats.active_users, 10),
    newUsersThisMonth: parseInt(stats.new_users_this_month, 10),
    verifiedUsers: parseInt(stats.verified_users, 10),
    usersByRole,
  };
};

/**
 * Search users
 */
export const searchUsers = async (
  query: string,
  limit: number = 10
): Promise<User[]> => {
  const users = await db.any<User>(
    `
      SELECT 
        id, email, full_name as "fullName", display_name as "displayName",
        avatar_url as "avatarUrl", role, status
      FROM users
      WHERE 
        (LOWER(full_name) LIKE LOWER($1) OR LOWER(email) LIKE LOWER($1))
        AND deleted_at IS NULL
      ORDER BY 
        CASE WHEN LOWER(full_name) LIKE LOWER($2) THEN 1 ELSE 2 END,
        full_name
      LIMIT $3
    `,
    [`%${query}%`, `${query}%`, limit]
  );
  
  return users;
};

/**
 * Check if email is available
 */
export const isEmailAvailable = async (email: string, excludeUserId?: string): Promise<boolean> => {
  const query = excludeUserId
    ? 'SELECT id FROM users WHERE LOWER(email) = LOWER($1) AND id != $2 AND deleted_at IS NULL'
    : 'SELECT id FROM users WHERE LOWER(email) = LOWER($1) AND deleted_at IS NULL';
  
  const params = excludeUserId ? [email, excludeUserId] : [email];
  
  const user = await db.one<{ id: string }>(query, params);
  
  return !user;
};
