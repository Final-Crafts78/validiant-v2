/**
 * Notification Service
 *
 * Handles creation, retrieval, and state management of in-app notifications.
 * Integration point for SLA alerts and task updates.
 */

import { eq, and, desc, isNull } from 'drizzle-orm';
import { db } from '../db';
import { notifications, NewNotification } from '../db/schema';
import { logger } from '../utils/logger';
import { broadcastToOrg } from '../utils/broadcast';

/**
 * Get all notifications for a user in an organization
 */
export const getNotifications = async (
  userId: string,
  orgId: string,
  limit = 50
) => {
  return db
    .select()
    .from(notifications)
    .where(
      and(
        eq(notifications.userId, userId),
        eq(notifications.organizationId, orgId),
        isNull(notifications.deletedAt)
      )
    )
    .orderBy(desc(notifications.createdAt))
    .limit(limit);
};

/**
 * Create a new notification and broadcast it in real-time
 */
export const createNotification = async (data: NewNotification) => {
  try {
    const [notification] = await db
      .insert(notifications)
      .values(data)
      .returning();

    if (notification) {
      // Broadcast to organization real-time room
      await broadcastToOrg(
        notification.organizationId,
        'NOTIFICATION_CREATED',
        {
          notificationId: notification.id,
          userId: notification.userId,
          priority: notification.priority,
          type: notification.type,
          title: notification.title,
          body: notification.body,
        }
      );
    }

    return notification;
  } catch (error) {
    logger.error(
      '[NotificationService] Failed to create notification:',
      error as Error
    );
    throw error;
  }
};

/**
 * Mark a single notification as read
 */
export const markAsRead = async (notificationId: string, userId: string) => {
  const [notification] = await db
    .update(notifications)
    .set({ readAt: new Date() })
    .where(
      and(
        eq(notifications.id, notificationId),
        eq(notifications.userId, userId)
      )
    )
    .returning();

  return notification;
};

/**
 * Mark all notifications as read for a user in an organization
 */
export const markAllAsRead = async (userId: string, orgId: string) => {
  return db
    .update(notifications)
    .set({ readAt: new Date() })
    .where(
      and(
        eq(notifications.userId, userId),
        eq(notifications.organizationId, orgId),
        isNull(notifications.readAt)
      )
    )
    .returning();
};

/**
 * Delete a notification (soft delete)
 */
export const deleteNotification = async (
  notificationId: string,
  userId: string
) => {
  const [notification] = await db
    .update(notifications)
    .set({ deletedAt: new Date() })
    .where(
      and(
        eq(notifications.id, notificationId),
        eq(notifications.userId, userId)
      )
    )
    .returning();

  return notification;
};

/**
 * Group notifications (Utility for SLA bursts)
 */
export const createGroupedNotification = async (
  userId: string,
  orgId: string,
  groupKey: string,
  data: Partial<NewNotification>
) => {
  // Check if a grouped notification with this key already exists and is unread
  const [existing] = await db
    .select()
    .from(notifications)
    .where(
      and(
        eq(notifications.userId, userId),
        eq(notifications.organizationId, orgId),
        eq(notifications.groupKey, groupKey),
        isNull(notifications.readAt)
      )
    )
    .limit(1);

  if (existing) {
    // Update existing instead of creating new noise
    const [updated] = await db
      .update(notifications)
      .set({
        ...data,
        updatedAt: new Date(),
        isGrouped: true,
      })
      .where(eq(notifications.id, existing.id))
      .returning();

    return updated;
  }

  // Create new
  return createNotification({
    ...(data as NewNotification),
    userId,
    organizationId: orgId,
    groupKey,
    isGrouped: true,
  });
};
