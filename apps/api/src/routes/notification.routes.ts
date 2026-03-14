import { Hono } from 'hono';
import * as notificationController from '../controllers/notification.controller';
import { authenticate } from '../middleware/auth';
import { tenantIsolation } from '../middleware/tenant';

const router = new Hono();

// Apply auth and tenant isolation to all notification routes
router.use('*', authenticate, tenantIsolation);

/**
 * GET /api/v1/notifications
 * Fetch user notifications for active org
 */
router.get('/', notificationController.getNotifications);

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
