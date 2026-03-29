import { Context } from 'hono';
import * as notificationService from '../services/notification.service';
import { logger } from '../utils/logger';
import { UserContext } from '../middleware/auth';

/**
 * Get notifications for the authenticated user
 * GET /api/v1/notifications
 */
export const getNotifications = async (c: Context) => {
  try {
    const user = c.get('user') as UserContext;
    const contextOrgId = c.get('orgId');
    const orgId = contextOrgId || user?.organizationId;

    if (!user || !user.userId || !orgId) {
      logger.warn('[NotificationController] 401 Unauthorized triggered', {
        hasUser: !!user,
        hasUserId: !!user?.userId,
        hasOrgId: !!orgId,
        contextOrgId: contextOrgId || 'MISSING',
        jwtOrgId: user?.organizationId || 'MISSING',
        userId: user?.userId,
        path: c.req.path,
      });
      return c.json(
        {
          error: 'Unauthorized',
          message: 'Active organization context required',
        },
        401
      );
    }

    console.info(
      `[NotificationController] Fetching for { userId: '${user.userId}', orgId: '${orgId}' }`
    );

    const notifications = await notificationService.getNotifications(
      user.userId,
      orgId
    );

    return c.json({ data: notifications });
  } catch (error) {
    logger.error(
      '[NotificationController] Error getting notifications:',
      error as Error
    );
    return c.json({ error: 'Failed to fetch notifications' }, 500);
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

    if (!user || !user.userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const notification = await notificationService.markAsRead(id, user.userId);

    if (!notification) {
      return c.json({ error: 'Notification not found' }, 404);
    }

    return c.json({ data: notification });
  } catch (error) {
    logger.error('[NotificationController] Error marking as read:', error as Error);
    return c.json({ error: 'Failed to update notification' }, 500);
  }
};

/**
 * Mark all as read
 * PATCH /api/v1/notifications/read-all
 */
export const markAllAsRead = async (c: Context) => {
  try {
    const user = c.get('user') as UserContext;
    const orgId = user?.organizationId;

    if (!user || !user.userId || !orgId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    await notificationService.markAllAsRead(user.userId, orgId);

    return c.json({ success: true });
  } catch (error) {
    logger.error('[NotificationController] Error marking all as read:', error as Error);
    return c.json({ error: 'Failed to update notifications' }, 500);
  }
};

/**
 * Delete notification
 * DELETE /api/v1/notifications/:id
 */
export const deleteNotification = async (c: Context) => {
  try {
    const user = c.get('user') as UserContext;
    const id = c.req.param('id');

    if (!user || !user.userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    await notificationService.deleteNotification(id, user.userId);

    return c.json({ success: true });
  } catch (error) {
    logger.error(
      '[NotificationController] Error deleting notification:',
      error as Error
    );
    return c.json({ error: 'Failed to delete notification' }, 500);
  }
};
