/**
 * User Service (Drizzle Version)
 * 
 * Handles user profile management, user search, admin operations,
 * and user-related business logic.
 * 
 * Migrated from raw SQL to Drizzle ORM for type safety and better DX.
 */

import { eq, and, isNull, sql, or, like, desc, asc } from 'drizzle-orm';
import { db } from '../db';
import { users } from '../db/schema';
import { cache } from '../config/redis.config';
import {
  NotFoundError,
  ConflictError,
  BadRequestError,
  assertExists,
} from '../utils/errors';
import { logger } from '../utils/logger';
import { UserRole, UserStatus } from '@validiant/shared';

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
  const [user] = await db
    .select({
      id: users.id,
      email: users.email,
      fullName: users.fullName,
      displayName: users.displayName,
      bio: users.bio,
      phoneNumber: users.phoneNumber,
      avatarUrl: users.avatarUrl,
      role: users.role,
      status: users.status,
      emailVerified: users.emailVerified,
      twoFactorEnabled: users.twoFactorEnabled,
      preferences: users.preferences,
      notificationPreferences: users.notificationPreferences,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
      lastLoginAt: users.lastLoginAt,
    })
    .from(users)
    .where(and(eq(users.id, userId), isNull(users.deletedAt)))
    .limit(1);

  assertExists(user, 'User');

  // Cache for 5 minutes
  await cache.set(cacheKey, user, 300);

  return user as User;
};

/**
 * Get user by email
 */
export const getUserByEmail = async (email: string): Promise<User | null> => {
  const [user] = await db
    .select({
      id: users.id,
      email: users.email,
      fullName: users.fullName,
      displayName: users.displayName,
      bio: users.bio,
      phoneNumber: users.phoneNumber,
      avatarUrl: users.avatarUrl,
      role: users.role,
      status: users.status,
      emailVerified: users.emailVerified,
      twoFactorEnabled: users.twoFactorEnabled,
      preferences: users.preferences,
      notificationPreferences: users.notificationPreferences,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
      lastLoginAt: users.lastLoginAt,
    })
    .from(users)
    .where(and(sql`LOWER(${users.email}) = LOWER(${email})`, isNull(users.deletedAt)))
    .limit(1);

  return user ? (user as User) : null;
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
  // Build update object with only provided fields
  const updateData: any = {
    updatedAt: new Date(),
  };

  if (data.fullName !== undefined) {
    updateData.fullName = data.fullName;
  }

  if (data.displayName !== undefined) {
    updateData.displayName = data.displayName;
  }

  if (data.bio !== undefined) {
    updateData.bio = data.bio;
  }

  if (data.phoneNumber !== undefined) {
    updateData.phoneNumber = data.phoneNumber;
  }

  if (data.avatarUrl !== undefined) {
    updateData.avatarUrl = data.avatarUrl;
  }

  if (Object.keys(updateData).length === 1) {
    // Only updatedAt was added
    throw new BadRequestError('No fields to update');
  }

  const [user] = await db
    .update(users)
    .set(updateData)
    .where(and(eq(users.id, userId), isNull(users.deletedAt)))
    .returning({
      id: users.id,
      email: users.email,
      fullName: users.fullName,
      displayName: users.displayName,
      bio: users.bio,
      phoneNumber: users.phoneNumber,
      avatarUrl: users.avatarUrl,
      role: users.role,
      status: users.status,
      emailVerified: users.emailVerified,
      twoFactorEnabled: users.twoFactorEnabled,
      preferences: users.preferences,
      notificationPreferences: users.notificationPreferences,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
      lastLoginAt: users.lastLoginAt,
    });

  // Clear cache
  await cache.del(`user:${userId}`);

  logger.info('User profile updated', { userId });

  return user as User;
};

/**
 * Update user preferences
 */
export const updatePreferences = async (userId: string, preferences: any): Promise<User> => {
  const [user] = await db
    .update(users)
    .set({
      preferences,
      updatedAt: new Date(),
    })
    .where(and(eq(users.id, userId), isNull(users.deletedAt)))
    .returning({
      id: users.id,
      email: users.email,
      fullName: users.fullName,
      displayName: users.displayName,
      bio: users.bio,
      phoneNumber: users.phoneNumber,
      avatarUrl: users.avatarUrl,
      role: users.role,
      status: users.status,
      emailVerified: users.emailVerified,
      twoFactorEnabled: users.twoFactorEnabled,
      preferences: users.preferences,
      notificationPreferences: users.notificationPreferences,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
      lastLoginAt: users.lastLoginAt,
    });

  assertExists(user, 'User');

  // Clear cache
  await cache.del(`user:${userId}`);

  return user as User;
};

/**
 * Update notification preferences
 */
export const updateNotificationPreferences = async (
  userId: string,
  notificationPreferences: any
): Promise<User> => {
  const [user] = await db
    .update(users)
    .set({
      notificationPreferences,
      updatedAt: new Date(),
    })
    .where(and(eq(users.id, userId), isNull(users.deletedAt)))
    .returning({
      id: users.id,
      email: users.email,
      fullName: users.fullName,
      displayName: users.displayName,
      bio: users.bio,
      phoneNumber: users.phoneNumber,
      avatarUrl: users.avatarUrl,
      role: users.role,
      status: users.status,
      emailVerified: users.emailVerified,
      twoFactorEnabled: users.twoFactorEnabled,
      preferences: users.preferences,
      notificationPreferences: users.notificationPreferences,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
      lastLoginAt: users.lastLoginAt,
    });

  assertExists(user, 'User');

  // Clear cache
  await cache.del(`user:${userId}`);

  return user as User;
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
  const sortBy = params.sortBy || 'createdAt';
  const sortOrder = params.sortOrder || 'desc';

  // Build WHERE conditions
  const conditions: any[] = [isNull(users.deletedAt)];

  if (params.search) {
    conditions.push(
      or(
        sql`LOWER(${users.fullName}) LIKE LOWER(${`%${params.search}%`})`,
        sql`LOWER(${users.email}) LIKE LOWER(${`%${params.search}%`})`
      )
    );
  }

  if (params.role) {
    conditions.push(eq(users.role, params.role));
  }

  if (params.status) {
    conditions.push(eq(users.status, params.status));
  }

  const whereClause = and(...conditions);

  // Get total count
  const [{ count }] = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(users)
    .where(whereClause);

  const total = Number(count);

  // Get users with sorting
  const orderByColumn =
    sortBy === 'createdAt'
      ? users.createdAt
      : sortBy === 'updatedAt'
      ? users.updatedAt
      : sortBy === 'fullName'
      ? users.fullName
      : sortBy === 'email'
      ? users.email
      : users.createdAt;

  const orderByClause = sortOrder === 'asc' ? asc(orderByColumn) : desc(orderByColumn);

  const userList = await db
    .select({
      id: users.id,
      email: users.email,
      fullName: users.fullName,
      displayName: users.displayName,
      avatarUrl: users.avatarUrl,
      role: users.role,
      status: users.status,
      emailVerified: users.emailVerified,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
      lastLoginAt: users.lastLoginAt,
    })
    .from(users)
    .where(whereClause)
    .orderBy(orderByClause)
    .limit(perPage)
    .offset(offset);

  return {
    users: userList as User[],
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
  await db.update(users).set({ deletedAt: new Date() }).where(eq(users.id, userId));

  // Clear cache
  await cache.del(`user:${userId}`);

  logger.info('User deleted', { userId });
};

/**
 * Admin: Update user role
 */
export const updateUserRole = async (userId: string, role: UserRole): Promise<User> => {
  const [user] = await db
    .update(users)
    .set({
      role,
      updatedAt: new Date(),
    })
    .where(and(eq(users.id, userId), isNull(users.deletedAt)))
    .returning({
      id: users.id,
      email: users.email,
      fullName: users.fullName,
      displayName: users.displayName,
      bio: users.bio,
      phoneNumber: users.phoneNumber,
      avatarUrl: users.avatarUrl,
      role: users.role,
      status: users.status,
      emailVerified: users.emailVerified,
      twoFactorEnabled: users.twoFactorEnabled,
      preferences: users.preferences,
      notificationPreferences: users.notificationPreferences,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
      lastLoginAt: users.lastLoginAt,
    });

  assertExists(user, 'User');

  // Clear cache
  await cache.del(`user:${userId}`);

  logger.info('User role updated', { userId, role });

  return user as User;
};

/**
 * Admin: Update user status
 */
export const updateUserStatus = async (userId: string, status: UserStatus): Promise<User> => {
  const [user] = await db
    .update(users)
    .set({
      status,
      updatedAt: new Date(),
    })
    .where(and(eq(users.id, userId), isNull(users.deletedAt)))
    .returning({
      id: users.id,
      email: users.email,
      fullName: users.fullName,
      displayName: users.displayName,
      bio: users.bio,
      phoneNumber: users.phoneNumber,
      avatarUrl: users.avatarUrl,
      role: users.role,
      status: users.status,
      emailVerified: users.emailVerified,
      twoFactorEnabled: users.twoFactorEnabled,
      preferences: users.preferences,
      notificationPreferences: users.notificationPreferences,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
      lastLoginAt: users.lastLoginAt,
    });

  assertExists(user, 'User');

  // Clear cache
  await cache.del(`user:${userId}`);

  logger.info('User status updated', { userId, status });

  return user as User;
};

/**
 * Get user statistics (admin)
 */
export const getUserStats = async (): Promise<UserStats> => {
  // Get aggregate stats
  const [stats] = await db
    .select({
      totalUsers: sql<number>`COUNT(*)`,
      activeUsers: sql<number>`COUNT(*) FILTER (WHERE ${users.status} = 'active')`,
      newUsersThisMonth: sql<number>`COUNT(*) FILTER (WHERE ${users.createdAt} >= NOW() - INTERVAL '30 days')`,
      verifiedUsers: sql<number>`COUNT(*) FILTER (WHERE ${users.emailVerified} = true)`,
    })
    .from(users)
    .where(isNull(users.deletedAt));

  // Get users by role
  const roleStats = await db
    .select({
      role: users.role,
      count: sql<number>`COUNT(*)`::int,
    })
    .from(users)
    .where(isNull(users.deletedAt))
    .groupBy(users.role);

  const usersByRole: Record<string, number> = {};
  roleStats.forEach((stat) => {
    usersByRole[stat.role] = Number(stat.count);
  });

  return {
    totalUsers: Number(stats.totalUsers),
    activeUsers: Number(stats.activeUsers),
    newUsersThisMonth: Number(stats.newUsersThisMonth),
    verifiedUsers: Number(stats.verifiedUsers),
    usersByRole,
  };
};

/**
 * Search users
 */
export const searchUsers = async (query: string, limit: number = 10): Promise<User[]> => {
  const userList = await db
    .select({
      id: users.id,
      email: users.email,
      fullName: users.fullName,
      displayName: users.displayName,
      avatarUrl: users.avatarUrl,
      role: users.role,
      status: users.status,
    })
    .from(users)
    .where(
      and(
        or(
          sql`LOWER(${users.fullName}) LIKE LOWER(${`%${query}%`})`,
          sql`LOWER(${users.email}) LIKE LOWER(${`%${query}%`})`
        ),
        isNull(users.deletedAt)
      )
    )
    .orderBy(
      sql`CASE WHEN LOWER(${users.fullName}) LIKE LOWER(${`${query}%`}) THEN 1 ELSE 2 END`,
      users.fullName
    )
    .limit(limit);

  return userList as User[];
};

/**
 * Check if email is available
 */
export const isEmailAvailable = async (
  email: string,
  excludeUserId?: string
): Promise<boolean> => {
  const conditions = [sql`LOWER(${users.email}) = LOWER(${email})`, isNull(users.deletedAt)];

  if (excludeUserId) {
    conditions.push(sql`${users.id} != ${excludeUserId}`);
  }

  const [existingUser] = await db
    .select({ id: users.id })
    .from(users)
    .where(and(...conditions))
    .limit(1);

  return !existingUser;
};
