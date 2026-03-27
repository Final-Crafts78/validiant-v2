import * as notificationController from '../controllers/notification.controller';
import { Hono } from 'hono';
import { getCookie } from 'hono/cookie';
import { logger } from '../utils/logger';

const router = new Hono();

// ============================================================================
// NOTIFICATION ENDPOINTS
// ============================================================================

/**
 * GET /
 * Fetch user notifications for active org
 */
router.get('/', (c) => {
  logger.debug('[Notifications] GET / Entry', {
    hasCookie: !!getCookie(c, 'accessToken'),
    user: c.get('user' as any),
    orgId: c.get('organizationId' as any),
  });
  return notificationController.getNotifications(c);
});

/**
 * PATCH /api/v1/notifications/:id/read
 * Mark as read
 */
router.patch('/:id/read', notificationController.markAsRead);

/**
 * PATCH /api/v1/notifications/read-all
 * Mark all as read
 */
router.patch('/read-all', notificationController.markAllAsRead);

/**
 * DELETE /api/v1/notifications/:id
 * Delete alert
 */
router.delete('/:id', notificationController.deleteNotification);

export default router;
