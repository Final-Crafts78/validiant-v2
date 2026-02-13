/**
 * Notification Types
 * 
 * Type definitions for notifications, alerts, and user communication.
 */

/**
 * Notification type enumeration
 * Categorizes different types of notifications
 */
export enum NotificationType {
  // Task-related
  TASK_ASSIGNED = 'task_assigned',
  TASK_UPDATED = 'task_updated',
  TASK_COMPLETED = 'task_completed',
  TASK_DUE_SOON = 'task_due_soon',
  TASK_OVERDUE = 'task_overdue',
  TASK_COMMENTED = 'task_commented',
  
  // Project-related
  PROJECT_INVITATION = 'project_invitation',
  PROJECT_MEMBER_ADDED = 'project_member_added',
  PROJECT_MEMBER_REMOVED = 'project_member_removed',
  PROJECT_UPDATED = 'project_updated',
  
  // Organization-related
  ORGANIZATION_INVITATION = 'organization_invitation',
  ORGANIZATION_ROLE_CHANGED = 'organization_role_changed',
  ORGANIZATION_MEMBER_JOINED = 'organization_member_joined',
  
  // Team-related
  TEAM_INVITATION = 'team_invitation',
  TEAM_MEMBER_ADDED = 'team_member_added',
  TEAM_MEMBER_REMOVED = 'team_member_removed',
  
  // Comment-related
  COMMENT_MENTION = 'comment_mention',
  COMMENT_REPLY = 'comment_reply',
  
  // Time tracking
  TIMESHEET_SUBMITTED = 'timesheet_submitted',
  TIMESHEET_APPROVED = 'timesheet_approved',
  TIMESHEET_REJECTED = 'timesheet_rejected',
  TIMESHEET_REMINDER = 'timesheet_reminder',
  
  // System
  SYSTEM_ANNOUNCEMENT = 'system_announcement',
  SYSTEM_UPDATE = 'system_update',
  ACCOUNT_SECURITY = 'account_security',
}

/**
 * Notification priority
 */
export enum NotificationPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent',
}

/**
 * Notification channel
 * Where the notification is delivered
 */
export enum NotificationChannel {
  IN_APP = 'in_app',
  EMAIL = 'email',
  PUSH = 'push',
  SMS = 'sms',
}

/**
 * Core Notification interface
 */
export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  message: string;
  actionUrl?: string;
  actionText?: string;
  entityType?: 'task' | 'project' | 'organization' | 'team' | 'comment';
  entityId?: string;
  senderId?: string;
  metadata?: Record<string, unknown>;
  read: boolean;
  readAt?: Date;
  channels: NotificationChannel[];
  createdAt: Date;
  expiresAt?: Date;
}

/**
 * Notification with sender details
 */
export interface NotificationWithDetails extends Notification {
  sender?: {
    id: string;
    fullName: string;
    avatarUrl?: string;
  };
}

/**
 * Push notification payload
 * For mobile push notifications
 */
export interface PushNotificationPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
  badge?: number;
  sound?: string;
  priority?: 'default' | 'high';
  channelId?: string;
  imageUrl?: string;
}

/**
 * Email notification data
 */
export interface EmailNotificationData {
  to: string;
  subject: string;
  htmlBody: string;
  textBody?: string;
  from?: string;
  replyTo?: string;
  cc?: string[];
  bcc?: string[];
  attachments?: EmailAttachment[];
}

/**
 * Email attachment
 */
export interface EmailAttachment {
  filename: string;
  content: string | Buffer;
  contentType: string;
}

/**
 * Notification preferences per event type
 */
export interface NotificationEventPreference {
  eventType: NotificationType;
  enabled: boolean;
  channels: NotificationChannel[];
  frequency: 'instant' | 'daily_digest' | 'weekly_digest';
  quietHoursEnabled: boolean;
}

/**
 * User notification settings
 */
export interface UserNotificationSettings {
  userId: string;
  globalEnabled: boolean;
  channels: {
    inApp: boolean;
    email: boolean;
    push: boolean;
    sms: boolean;
  };
  quietHours: {
    enabled: boolean;
    startTime: string; // HH:MM format
    endTime: string; // HH:MM format
    timezone: string;
  };
  digestPreferences: {
    daily: boolean;
    dailyTime: string; // HH:MM format
    weekly: boolean;
    weeklyDay: number; // 0-6 (Sunday-Saturday)
    weeklyTime: string; // HH:MM format
  };
  eventPreferences: NotificationEventPreference[];
}

/**
 * Notification digest
 * Grouped notifications sent as summary
 */
export interface NotificationDigest {
  id: string;
  userId: string;
  period: 'daily' | 'weekly';
  startDate: Date;
  endDate: Date;
  notifications: Notification[];
  summary: {
    total: number;
    byType: Record<NotificationType, number>;
    unreadCount: number;
  };
  sentAt?: Date;
}

/**
 * In-app announcement
 */
export interface Announcement {
  id: string;
  title: string;
  content: string;
  type: 'info' | 'warning' | 'success' | 'error';
  targetAudience: 'all' | 'organization' | 'team' | 'user';
  targetIds?: string[]; // organization/team/user IDs
  startDate: Date;
  endDate?: Date;
  dismissible: boolean;
  actionUrl?: string;
  actionText?: string;
  createdBy: string;
  createdAt: Date;
}

/**
 * Alert (real-time critical notification)
 */
export interface Alert {
  id: string;
  userId: string;
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  acknowledged: boolean;
  acknowledgedAt?: Date;
  autoAcknowledge: boolean;
  autoAcknowledgeDelay: number; // in seconds
  createdAt: Date;
}

/**
 * Notification batch request
 * For sending multiple notifications at once
 */
export interface NotificationBatchRequest {
  userIds: string[];
  type: NotificationType;
  title: string;
  message: string;
  actionUrl?: string;
  channels?: NotificationChannel[];
  metadata?: Record<string, unknown>;
}

/**
 * Notification statistics
 */
export interface NotificationStats {
  userId: string;
  period: {
    start: Date;
    end: Date;
  };
  total: number;
  unread: number;
  read: number;
  byType: Record<NotificationType, number>;
  byChannel: Record<NotificationChannel, number>;
  byPriority: Record<NotificationPriority, number>;
}

/**
 * Helper to check if notification is urgent
 */
export const isUrgentNotification = (notification: Notification): boolean => {
  return notification.priority === NotificationPriority.URGENT ||
         notification.priority === NotificationPriority.HIGH;
};

/**
 * Helper to check if notification is expired
 */
export const isNotificationExpired = (notification: Notification): boolean => {
  if (!notification.expiresAt) return false;
  return new Date(notification.expiresAt) < new Date();
};

/**
 * Helper to check if user should receive notification based on preferences
 */
export const shouldSendNotification = (
  type: NotificationType,
  channel: NotificationChannel,
  settings: UserNotificationSettings
): boolean => {
  // Check if globally enabled
  if (!settings.globalEnabled) return false;
  
  // Check if channel is enabled
  if (channel === NotificationChannel.IN_APP && !settings.channels.inApp) return false;
  if (channel === NotificationChannel.EMAIL && !settings.channels.email) return false;
  if (channel === NotificationChannel.PUSH && !settings.channels.push) return false;
  if (channel === NotificationChannel.SMS && !settings.channels.sms) return false;
  
  // Check event-specific preferences
  const eventPref = settings.eventPreferences.find(p => p.eventType === type);
  if (!eventPref) return true; // Default to enabled if no specific preference
  
  return eventPref.enabled && eventPref.channels.includes(channel);
};

/**
 * Helper to check if current time is within quiet hours
 */
export const isQuietHours = (settings: UserNotificationSettings): boolean => {
  if (!settings.quietHours.enabled) return false;
  
  const now = new Date();
  const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  
  const start = settings.quietHours.startTime;
  const end = settings.quietHours.endTime;
  
  // Handle overnight quiet hours (e.g., 22:00 to 08:00)
  if (start > end) {
    return currentTime >= start || currentTime <= end;
  }
  
  return currentTime >= start && currentTime <= end;
};

/**
 * Default notification settings
 */
export const DEFAULT_NOTIFICATION_SETTINGS: UserNotificationSettings = {
  userId: '',
  globalEnabled: true,
  channels: {
    inApp: true,
    email: true,
    push: true,
    sms: false,
  },
  quietHours: {
    enabled: false,
    startTime: '22:00',
    endTime: '08:00',
    timezone: 'UTC',
  },
  digestPreferences: {
    daily: false,
    dailyTime: '09:00',
    weekly: true,
    weeklyDay: 1, // Monday
    weeklyTime: '09:00',
  },
  eventPreferences: [],
};
