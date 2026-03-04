/**
 * Notification Routes (Phase 20)
 *
 * In-app notification endpoints — requires authentication.
 */

import { Hono } from 'hono';
import { authenticate } from '../middleware/auth';
import * as notificationController from '../controllers/notification.controller';

const notificationRoutes = new Hono();

notificationRoutes.use('*', authenticate);

// GET /api/v1/notifications — List notifications (supports ?unread=true&page=1&limit=20)
notificationRoutes.get('/', notificationController.getNotifications);

// GET /api/v1/notifications/unread-count — Get unread count for bell badge
notificationRoutes.get('/unread-count', notificationController.getUnreadCount);

// PATCH /api/v1/notifications/read-all — Mark all as read
notificationRoutes.patch('/read-all', notificationController.markAllAsRead);

// PATCH /api/v1/notifications/:id/read — Mark single notification as read
notificationRoutes.patch('/:id/read', notificationController.markAsRead);

export default notificationRoutes;
