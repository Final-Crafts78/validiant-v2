/**
 * Notification and API Schemas
 * 
 * Zod validation schemas for notifications and common API request patterns.
 */

import { z } from 'zod';
import { PAGINATION } from '../constants';
import {
  NotificationType,
  NotificationChannel,
  NotificationPriority,
} from '../types';

/**
 * Notification enum schemas
 */
export const notificationTypeSchema = z.nativeEnum(NotificationType);
export const notificationChannelSchema = z.nativeEnum(NotificationChannel);
export const notificationPrioritySchema = z.nativeEnum(NotificationPriority);

/**
 * Pagination schema
 */
export const paginationSchema = z.object({
  page: z.number().min(PAGINATION.MIN_PER_PAGE).default(PAGINATION.DEFAULT_PAGE),
  perPage: z.number().min(PAGINATION.MIN_PER_PAGE).max(PAGINATION.MAX_PER_PAGE).default(PAGINATION.DEFAULT_PER_PAGE),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

/**
 * Cursor pagination schema
 */
export const cursorPaginationSchema = z.object({
  first: z.number().min(1).max(PAGINATION.MAX_PER_PAGE).optional(),
  after: z.string().optional(),
  last: z.number().min(1).max(PAGINATION.MAX_PER_PAGE).optional(),
  before: z.string().optional(),
}).refine(
  (data) => {
    // Either first/after or last/before, not both
    const hasForward = data.first !== undefined || data.after !== undefined;
    const hasBackward = data.last !== undefined || data.before !== undefined;
    return !(hasForward && hasBackward);
  },
  { message: 'Cannot use both forward and backward pagination' }
);

/**
 * Date range schema
 */
export const dateRangeSchema = z.object({
  start: z.string().datetime(),
  end: z.string().datetime(),
}).refine(
  (data) => new Date(data.end) > new Date(data.start),
  { message: 'End date must be after start date', path: ['end'] }
);

/**
 * Search query schema
 */
export const searchQuerySchema = z.object({
  query: z.string().min(1).max(200),
  fields: z.array(z.string()).optional(),
  fuzzy: z.boolean().default(false),
  caseSensitive: z.boolean().default(false),
});

/**
 * Create notification schema
 */
export const createNotificationSchema = z.object({
  userId: z.string().uuid(),
  type: notificationTypeSchema,
  title: z.string().min(1).max(200),
  message: z.string().min(1).max(1000),
  priority: notificationPrioritySchema.default(NotificationPriority.NORMAL),
  channels: z.array(notificationChannelSchema).min(1, 'At least one channel is required'),
  data: z.record(z.unknown()).optional(),
  actionUrl: z.string().url().optional(),
  expiresAt: z.string().datetime().optional(),
});

/**
 * Bulk create notifications schema
 */
export const bulkCreateNotificationsSchema = z.object({
  notifications: z.array(
    z.object({
      userId: z.string().uuid(),
      type: notificationTypeSchema,
      title: z.string().min(1).max(200),
      message: z.string().min(1).max(1000),
      priority: notificationPrioritySchema,
      channels: z.array(notificationChannelSchema).min(1),
      data: z.record(z.unknown()).optional(),
      actionUrl: z.string().url().optional(),
    })
  ).min(1).max(100, 'Maximum 100 notifications at once'),
});

/**
 * Update notification preferences schema
 */
export const updateNotificationPreferencesSchema = z.object({
  channels: z.object({
    email: z.boolean().optional(),
    push: z.boolean().optional(),
    sms: z.boolean().optional(),
    inApp: z.boolean().optional(),
  }).optional(),
  types: z.record(z.boolean()).optional(),
  quietHours: z.object({
    enabled: z.boolean(),
    startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format (HH:mm)').optional(),
    endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format (HH:mm)').optional(),
    timezone: z.string().optional(),
  }).optional(),
  digest: z.object({
    enabled: z.boolean(),
    frequency: z.enum(['daily', 'weekly']).optional(),
    time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).optional(),
    dayOfWeek: z.number().min(0).max(6).optional(),
  }).optional(),
});

/**
 * Mark notification as read schema
 */
export const markNotificationReadSchema = z.object({
  notificationId: z.string().uuid(),
});

/**
 * Mark all notifications as read schema
 */
export const markAllNotificationsReadSchema = z.object({
  types: z.array(notificationTypeSchema).optional(),
  before: z.string().datetime().optional(),
});

/**
 * Notification filters schema
 */
export const notificationFiltersSchema = z.object({
  types: z.array(notificationTypeSchema).optional(),
  priority: notificationPrioritySchema.optional(),
  read: z.boolean().optional(),
  channels: z.array(notificationChannelSchema).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

/**
 * Notification sort schema
 */
export const notificationSortSchema = z.object({
  field: z.enum(['createdAt', 'priority', 'read']),
  direction: z.enum(['asc', 'desc']),
});

/**
 * Delete notifications schema
 */
export const deleteNotificationsSchema = z.object({
  notificationIds: z.array(z.string().uuid()).min(1),
});

/**
 * Announcement schema
 */
export const createAnnouncementSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1).max(5000),
  type: z.enum(['info', 'warning', 'critical']),
  targetAudience: z.object({
    organizationIds: z.array(z.string().uuid()).optional(),
    userIds: z.array(z.string().uuid()).optional(),
    roles: z.array(z.string()).optional(),
    allUsers: z.boolean().default(false),
  }),
  expiresAt: z.string().datetime().optional(),
  actionButton: z.object({
    label: z.string().max(50),
    url: z.string().url(),
  }).optional(),
});

/**
 * Update announcement schema
 */
export const updateAnnouncementSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  content: z.string().min(1).max(5000).optional(),
  type: z.enum(['info', 'warning', 'critical']).optional(),
  expiresAt: z.string().datetime().optional().nullable(),
  actionButton: z.object({
    label: z.string().max(50),
    url: z.string().url(),
  }).optional().nullable(),
});

/**
 * Alert schema
 */
export const createAlertSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  condition: z.object({
    metric: z.string(),
    operator: z.enum(['gt', 'gte', 'lt', 'lte', 'eq', 'ne']),
    threshold: z.number(),
  }),
  recipients: z.array(z.string().uuid()).min(1, 'At least one recipient is required'),
  channels: z.array(notificationChannelSchema).min(1),
  cooldownMinutes: z.number().min(1).max(1440).default(60),
  enabled: z.boolean().default(true),
});

/**
 * Update alert schema
 */
export const updateAlertSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  condition: z.object({
    metric: z.string(),
    operator: z.enum(['gt', 'gte', 'lt', 'lte', 'eq', 'ne']),
    threshold: z.number(),
  }).optional(),
  recipients: z.array(z.string().uuid()).min(1).optional(),
  channels: z.array(notificationChannelSchema).min(1).optional(),
  cooldownMinutes: z.number().min(1).max(1440).optional(),
  enabled: z.boolean().optional(),
});

/**
 * Webhook schema
 */
export const createWebhookSchema = z.object({
  name: z.string().min(1).max(100),
  url: z.string().url(),
  events: z.array(z.string()).min(1, 'At least one event is required'),
  secret: z.string().min(16).max(128).optional(),
  headers: z.record(z.string()).optional(),
  enabled: z.boolean().default(true),
});

/**
 * Update webhook schema
 */
export const updateWebhookSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  url: z.string().url().optional(),
  events: z.array(z.string()).min(1).optional(),
  secret: z.string().min(16).max(128).optional(),
  headers: z.record(z.string()).optional(),
  enabled: z.boolean().optional(),
});

/**
 * Bulk operation schema
 */
export const bulkOperationSchema = z.object({
  ids: z.array(z.string().uuid()).min(1, 'At least one ID is required').max(1000, 'Maximum 1000 items at once'),
  action: z.string().min(1),
  data: z.record(z.unknown()).optional(),
});

/**
 * Export request schema
 */
export const exportRequestSchema = z.object({
  format: z.enum(['csv', 'xlsx', 'json', 'pdf']),
  filters: z.record(z.unknown()).optional(),
  fields: z.array(z.string()).optional(),
  includeHeaders: z.boolean().default(true),
});

/**
 * File upload schema
 */
export const fileUploadSchema = z.object({
  filename: z.string().min(1).max(255),
  mimeType: z.string(),
  size: z.number().min(1),
  entityType: z.string().optional(),
  entityId: z.string().uuid().optional(),
});

/**
 * Health check response schema
 */
export const healthCheckSchema = z.object({
  status: z.enum(['healthy', 'degraded', 'unhealthy']),
  version: z.string(),
  uptime: z.number(),
  timestamp: z.string().datetime(),
  services: z.object({
    database: z.enum(['up', 'down']),
    redis: z.enum(['up', 'down']),
    storage: z.enum(['up', 'down']),
  }),
});

/**
 * Rate limit info schema
 */
export const rateLimitInfoSchema = z.object({
  limit: z.number(),
  remaining: z.number(),
  reset: z.number(),
  retryAfter: z.number().optional(),
});

/**
 * Batch request schema
 */
export const batchRequestSchema = z.object({
  requests: z.array(
    z.object({
      id: z.string(),
      method: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']),
      url: z.string(),
      body: z.unknown().optional(),
      headers: z.record(z.string()).optional(),
    })
  ).min(1).max(50, 'Maximum 50 requests per batch'),
});

/**
 * Type inference helpers
 */
export type PaginationInput = z.infer<typeof paginationSchema>;
export type CursorPaginationInput = z.infer<typeof cursorPaginationSchema>;
export type DateRangeInput = z.infer<typeof dateRangeSchema>;
export type SearchQueryInput = z.infer<typeof searchQuerySchema>;
export type CreateNotificationInput = z.infer<typeof createNotificationSchema>;
export type BulkCreateNotificationsInput = z.infer<typeof bulkCreateNotificationsSchema>;
export type UpdateNotificationPreferencesInput = z.infer<typeof updateNotificationPreferencesSchema>;
export type NotificationFiltersInput = z.infer<typeof notificationFiltersSchema>;
export type CreateAnnouncementInput = z.infer<typeof createAnnouncementSchema>;
export type UpdateAnnouncementInput = z.infer<typeof updateAnnouncementSchema>;
export type CreateAlertInput = z.infer<typeof createAlertSchema>;
export type UpdateAlertInput = z.infer<typeof updateAlertSchema>;
export type CreateWebhookInput = z.infer<typeof createWebhookSchema>;
export type UpdateWebhookInput = z.infer<typeof updateWebhookSchema>;
export type BulkOperationInput = z.infer<typeof bulkOperationSchema>;
export type ExportRequestInput = z.infer<typeof exportRequestSchema>;
export type FileUploadInput = z.infer<typeof fileUploadSchema>;
export type BatchRequestInput = z.infer<typeof batchRequestSchema>;
