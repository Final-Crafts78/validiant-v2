/**
 * Notification Controller (Phase 20)
 *
 * In-app notification management — list, read, mark as read.
 * Notifications are created by other services (task assignment, comments, etc.)
 * Updated to use real Drizzle queries against the notifications table.
 */

import { Context } from 'hono';
import { eq, and, desc, sql } from 'drizzle-orm';
import { db, schema } from '../db';
import type { UserContext } from '../middleware/auth';

/**
 * Get user notifications
 * GET /api/v1/notifications
 */
export const getNotifications = async (c: Context) => {
  try {
    const user = c.get('user') as UserContext;
    const page = parseInt(c.req.query('page') || '1');
    const limit = parseInt(c.req.query('limit') || '20');
    const unreadOnly = c.req.query('unread') === 'true';
    const offset = (page - 1) * limit;

    const conditions = [eq(schema.notifications.userId, user.userId)];
    if (unreadOnly) {
      conditions.push(eq(schema.notifications.isRead, false));
    }

    const notifications = await db
      .select()
      .from(schema.notifications)
      .where(and(...conditions))
      .orderBy(desc(schema.notifications.createdAt))
      .limit(limit)
      .offset(offset);

    // Get unread count for badge
    const [unreadCount] = await db
      .select({
        count: sql<number>`COUNT(${schema.notifications.id})`.mapWith(Number),
      })
      .from(schema.notifications)
      .where(
        and(
          eq(schema.notifications.userId, user.userId),
          eq(schema.notifications.isRead, false)
        )
      );

    return c.json({
      success: true,
      data: {
        notifications,
        unreadCount: unreadCount?.count || 0,
        pagination: { page, limit },
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    return c.json(
      {
        success: false,
        error: 'Failed to get notifications',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      500
    );
  }
};

/**
 * Mark notification as read
 * PATCH /api/v1/notifications/:id/read
 */
export const markAsRead = async (c: Context) => {
  try {
    const user = c.get('user') as UserContext;
    const id = c.req.param('id');

    if (!id) {
      return c.json(
        {
          success: false,
          error: 'Bad Request',
          message: 'Notification ID is required',
          timestamp: new Date().toISOString(),
        },
        400
      );
    }

    const [updated] = await db
      .update(schema.notifications)
      .set({
        isRead: true,
        readAt: new Date(),
      })
      .where(
        and(
          eq(schema.notifications.id, id),
          eq(schema.notifications.userId, user.userId)
        )
      )
      .returning();

    if (!updated) {
      return c.json(
        {
          success: false,
          error: 'Not Found',
          message: 'Notification not found',
          timestamp: new Date().toISOString(),
        },
        404
      );
    }

    return c.json({
      success: true,
      message: 'Notification marked as read',
      data: { notification: updated },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Mark notification as read error:', error);
    return c.json(
      {
        success: false,
        error: 'Failed to mark notification as read',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      500
    );
  }
};

/**
 * Mark all notifications as read
 * PATCH /api/v1/notifications/read-all
 */
export const markAllAsRead = async (c: Context) => {
  try {
    const user = c.get('user') as UserContext;

    const result = await db
      .update(schema.notifications)
      .set({
        isRead: true,
        readAt: new Date(),
      })
      .where(
        and(
          eq(schema.notifications.userId, user.userId),
          eq(schema.notifications.isRead, false)
        )
      )
      .returning();

    return c.json({
      success: true,
      message: 'All notifications marked as read',
      data: { count: result.length },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Mark all notifications as read error:', error);
    return c.json(
      {
        success: false,
        error: 'Failed to mark all notifications as read',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      500
    );
  }
};

/**
 * Get unread notification count
 * GET /api/v1/notifications/unread-count
 */
export const getUnreadCount = async (c: Context) => {
  try {
    const user = c.get('user') as UserContext;

    const [result] = await db
      .select({
        count: sql<number>`COUNT(${schema.notifications.id})`.mapWith(Number),
      })
      .from(schema.notifications)
      .where(
        and(
          eq(schema.notifications.userId, user.userId),
          eq(schema.notifications.isRead, false)
        )
      );

    return c.json({
      success: true,
      data: { unreadCount: result?.count || 0 },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Get unread count error:', error);
    return c.json(
      {
        success: false,
        error: 'Failed to get unread count',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      500
    );
  }
};
