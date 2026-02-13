/**
 * Application Constants
 * 
 * Global constants used across all applications.
 * Includes validation rules, limits, formats, and configuration values.
 */

/**
 * API Configuration
 */
export const API = {
  VERSION: 'v1',
  BASE_PATH: '/api/v1',
  TIMEOUT: 30000, // 30 seconds
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // 1 second
} as const;

/**
 * API Routes
 */
export const API_ROUTES = {
  // Authentication
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    VERIFY_EMAIL: '/auth/verify-email',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
    CHANGE_PASSWORD: '/auth/change-password',
  },
  
  // Users
  USERS: {
    BASE: '/users',
    ME: '/users/me',
    BY_ID: (id: string) => `/users/${id}`,
    PROFILE: (id: string) => `/users/${id}/profile`,
    PREFERENCES: '/users/me/preferences',
    SESSIONS: '/users/me/sessions',
    ACTIVITY: (id: string) => `/users/${id}/activity`,
  },
  
  // Organizations
  ORGANIZATIONS: {
    BASE: '/organizations',
    BY_ID: (id: string) => `/organizations/${id}`,
    MEMBERS: (id: string) => `/organizations/${id}/members`,
    INVITATIONS: (id: string) => `/organizations/${id}/invitations`,
    TEAMS: (id: string) => `/organizations/${id}/teams`,
    SETTINGS: (id: string) => `/organizations/${id}/settings`,
  },
  
  // Teams
  TEAMS: {
    BASE: '/teams',
    BY_ID: (id: string) => `/teams/${id}`,
    MEMBERS: (id: string) => `/teams/${id}/members`,
    PROJECTS: (id: string) => `/teams/${id}/projects`,
  },
  
  // Projects
  PROJECTS: {
    BASE: '/projects',
    BY_ID: (id: string) => `/projects/${id}`,
    MEMBERS: (id: string) => `/projects/${id}/members`,
    TASKS: (id: string) => `/projects/${id}/tasks`,
    MILESTONES: (id: string) => `/projects/${id}/milestones`,
    LABELS: (id: string) => `/projects/${id}/labels`,
    SETTINGS: (id: string) => `/projects/${id}/settings`,
  },
  
  // Tasks
  TASKS: {
    BASE: '/tasks',
    BY_ID: (id: string) => `/tasks/${id}`,
    COMMENTS: (id: string) => `/tasks/${id}/comments`,
    ATTACHMENTS: (id: string) => `/tasks/${id}/attachments`,
    SUBTASKS: (id: string) => `/tasks/${id}/subtasks`,
    DEPENDENCIES: (id: string) => `/tasks/${id}/dependencies`,
    ACTIVITY: (id: string) => `/tasks/${id}/activity`,
  },
  
  // Time Tracking
  TIME: {
    ENTRIES: '/time-entries',
    ENTRY_BY_ID: (id: string) => `/time-entries/${id}`,
    TIMER: '/time-entries/timer',
    START_TIMER: '/time-entries/timer/start',
    STOP_TIMER: '/time-entries/timer/stop',
    PAUSE_TIMER: '/time-entries/timer/pause',
    RESUME_TIMER: '/time-entries/timer/resume',
    TIMESHEETS: '/timesheets',
    TIMESHEET_BY_ID: (id: string) => `/timesheets/${id}`,
    REPORTS: '/time-entries/reports',
  },
  
  // Notifications
  NOTIFICATIONS: {
    BASE: '/notifications',
    BY_ID: (id: string) => `/notifications/${id}`,
    MARK_READ: (id: string) => `/notifications/${id}/read`,
    MARK_ALL_READ: '/notifications/read-all',
    SETTINGS: '/notifications/settings',
    UNREAD_COUNT: '/notifications/unread-count',
  },
  
  // File Upload
  UPLOAD: {
    FILE: '/upload',
    AVATAR: '/upload/avatar',
    ATTACHMENT: '/upload/attachment',
  },
} as const;

/**
 * Validation Rules
 */
export const VALIDATION = {
  EMAIL: {
    MIN_LENGTH: 5,
    MAX_LENGTH: 254,
    REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  },
  PASSWORD: {
    MIN_LENGTH: 8,
    MAX_LENGTH: 128,
    REQUIRE_UPPERCASE: true,
    REQUIRE_LOWERCASE: true,
    REQUIRE_NUMBER: true,
    REQUIRE_SPECIAL: true,
    REGEX: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
  },
  USERNAME: {
    MIN_LENGTH: 3,
    MAX_LENGTH: 30,
    REGEX: /^[a-zA-Z0-9_-]+$/,
  },
  FULL_NAME: {
    MIN_LENGTH: 2,
    MAX_LENGTH: 100,
  },
  PROJECT_NAME: {
    MIN_LENGTH: 3,
    MAX_LENGTH: 100,
  },
  PROJECT_KEY: {
    MIN_LENGTH: 2,
    MAX_LENGTH: 10,
    REGEX: /^[A-Z][A-Z0-9]*$/,
  },
  TASK_TITLE: {
    MIN_LENGTH: 3,
    MAX_LENGTH: 200,
  },
  DESCRIPTION: {
    MAX_LENGTH: 10000,
  },
  ORGANIZATION_NAME: {
    MIN_LENGTH: 3,
    MAX_LENGTH: 100,
  },
  TEAM_NAME: {
    MIN_LENGTH: 3,
    MAX_LENGTH: 100,
  },
  PHONE_NUMBER: {
    REGEX: /^\+?[1-9]\d{1,14}$/,
  },
} as const;

/**
 * File Upload Limits
 */
export const FILE_UPLOAD = {
  MAX_SIZE: 10 * 1024 * 1024, // 10 MB
  MAX_SIZE_AVATAR: 5 * 1024 * 1024, // 5 MB
  MAX_SIZE_ATTACHMENT: 50 * 1024 * 1024, // 50 MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
  ALLOWED_DOCUMENT_TYPES: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'text/csv',
  ],
  ALLOWED_EXTENSIONS: ['.jpg', '.jpeg', '.png', '.gif', '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.txt', '.csv'],
} as const;

/**
 * Pagination Defaults
 */
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_PER_PAGE: 20,
  MAX_PER_PAGE: 100,
  MIN_PER_PAGE: 1,
} as const;

/**
 * Date and Time Formats
 */
export const DATE_FORMATS = {
  API: 'YYYY-MM-DD',
  API_WITH_TIME: 'YYYY-MM-DD HH:mm:ss',
  DISPLAY: 'MMM D, YYYY',
  DISPLAY_WITH_TIME: 'MMM D, YYYY h:mm A',
  SHORT: 'MM/DD/YYYY',
  ISO: "yyyy-MM-dd'T'HH:mm:ss.SSSxxx",
  TIME_12H: 'h:mm A',
  TIME_24H: 'HH:mm',
} as const;

/**
 * Time Intervals (in milliseconds)
 */
export const TIME_INTERVALS = {
  SECOND: 1000,
  MINUTE: 60 * 1000,
  HOUR: 60 * 60 * 1000,
  DAY: 24 * 60 * 60 * 1000,
  WEEK: 7 * 24 * 60 * 60 * 1000,
  MONTH: 30 * 24 * 60 * 60 * 1000,
} as const;

/**
 * Token Expiration Times (in seconds)
 */
export const TOKEN_EXPIRY = {
  ACCESS_TOKEN: 60 * 60, // 1 hour
  REFRESH_TOKEN: 7 * 24 * 60 * 60, // 7 days
  EMAIL_VERIFICATION: 24 * 60 * 60, // 24 hours
  PASSWORD_RESET: 60 * 60, // 1 hour
  INVITATION: 7 * 24 * 60 * 60, // 7 days
} as const;

/**
 * Rate Limiting
 */
export const RATE_LIMITS = {
  AUTH: {
    WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    MAX_REQUESTS: 5,
  },
  API: {
    WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    MAX_REQUESTS: 100,
  },
  FILE_UPLOAD: {
    WINDOW_MS: 60 * 60 * 1000, // 1 hour
    MAX_REQUESTS: 50,
  },
} as const;

/**
 * Cache TTL (Time To Live) in seconds
 */
export const CACHE_TTL = {
  SHORT: 60, // 1 minute
  MEDIUM: 5 * 60, // 5 minutes
  LONG: 60 * 60, // 1 hour
  VERY_LONG: 24 * 60 * 60, // 24 hours
} as const;

/**
 * WebSocket Events
 */
export const WS_EVENTS = {
  // Connection
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  ERROR: 'error',
  
  // Task events
  TASK_CREATED: 'task:created',
  TASK_UPDATED: 'task:updated',
  TASK_DELETED: 'task:deleted',
  TASK_ASSIGNED: 'task:assigned',
  TASK_STATUS_CHANGED: 'task:status_changed',
  
  // Project events
  PROJECT_UPDATED: 'project:updated',
  PROJECT_MEMBER_ADDED: 'project:member_added',
  PROJECT_MEMBER_REMOVED: 'project:member_removed',
  
  // Comment events
  COMMENT_ADDED: 'comment:added',
  COMMENT_UPDATED: 'comment:updated',
  COMMENT_DELETED: 'comment:deleted',
  
  // Notification events
  NOTIFICATION_RECEIVED: 'notification:received',
  
  // Timer events
  TIMER_STARTED: 'timer:started',
  TIMER_STOPPED: 'timer:stopped',
  TIMER_UPDATED: 'timer:updated',
} as const;

/**
 * Local Storage Keys
 */
export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'validiant_access_token',
  REFRESH_TOKEN: 'validiant_refresh_token',
  USER: 'validiant_user',
  THEME: 'validiant_theme',
  LANGUAGE: 'validiant_language',
  RECENT_PROJECTS: 'validiant_recent_projects',
  ACTIVE_TIMER: 'validiant_active_timer',
  DRAFT_TASK: 'validiant_draft_task',
  SIDEBAR_STATE: 'validiant_sidebar_state',
} as const;

/**
 * Query Keys (for React Query / TanStack Query)
 */
export const QUERY_KEYS = {
  // Auth
  CURRENT_USER: ['currentUser'],
  
  // Users
  USERS: ['users'],
  USER: (id: string) => ['user', id],
  USER_PROFILE: (id: string) => ['userProfile', id],
  
  // Organizations
  ORGANIZATIONS: ['organizations'],
  ORGANIZATION: (id: string) => ['organization', id],
  ORGANIZATION_MEMBERS: (id: string) => ['organizationMembers', id],
  
  // Teams
  TEAMS: ['teams'],
  TEAM: (id: string) => ['team', id],
  TEAM_MEMBERS: (id: string) => ['teamMembers', id],
  
  // Projects
  PROJECTS: ['projects'],
  PROJECT: (id: string) => ['project', id],
  PROJECT_TASKS: (id: string) => ['projectTasks', id],
  PROJECT_MEMBERS: (id: string) => ['projectMembers', id],
  
  // Tasks
  TASKS: ['tasks'],
  TASK: (id: string) => ['task', id],
  TASK_COMMENTS: (id: string) => ['taskComments', id],
  TASK_ACTIVITY: (id: string) => ['taskActivity', id],
  
  // Time Tracking
  TIME_ENTRIES: ['timeEntries'],
  ACTIVE_TIMER: ['activeTimer'],
  TIMESHEETS: ['timesheets'],
  
  // Notifications
  NOTIFICATIONS: ['notifications'],
  UNREAD_COUNT: ['notificationsUnreadCount'],
} as const;

/**
 * Error Messages
 */
export const ERROR_MESSAGES = {
  GENERIC: 'Something went wrong. Please try again.',
  NETWORK: 'Network error. Please check your connection.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  FORBIDDEN: 'Access denied.',
  NOT_FOUND: 'The requested resource was not found.',
  VALIDATION: 'Please check your input and try again.',
  SESSION_EXPIRED: 'Your session has expired. Please log in again.',
  RATE_LIMIT: 'Too many requests. Please try again later.',
} as const;

/**
 * Success Messages
 */
export const SUCCESS_MESSAGES = {
  CREATED: 'Successfully created.',
  UPDATED: 'Successfully updated.',
  DELETED: 'Successfully deleted.',
  SAVED: 'Changes saved successfully.',
  LOGIN: 'Welcome back!',
  LOGOUT: 'You have been logged out.',
  REGISTER: 'Account created successfully.',
  EMAIL_SENT: 'Email sent successfully.',
  PASSWORD_CHANGED: 'Password changed successfully.',
} as const;

/**
 * App Metadata
 */
export const APP_METADATA = {
  NAME: 'Validiant',
  VERSION: '1.0.0',
  DESCRIPTION: 'Modern project management and collaboration platform',
  COMPANY: 'Validiant',
  SUPPORT_EMAIL: 'support@validiant.com',
  CONTACT_EMAIL: 'contact@validiant.com',
} as const;

/**
 * Feature Flags
 */
export const FEATURES = {
  TIME_TRACKING: true,
  NOTIFICATIONS: true,
  WEBHOOKS: true,
  INTEGRATIONS: true,
  CUSTOM_FIELDS: true,
  ADVANCED_REPORTING: true,
  TWO_FACTOR_AUTH: true,
  OAUTH_LOGIN: true,
} as const;

/**
 * Color Palette
 * Consistent colors used across the application
 */
export const COLORS = {
  // Status colors
  SUCCESS: '#10B981',
  WARNING: '#F59E0B',
  ERROR: '#EF4444',
  INFO: '#3B82F6',
  
  // Priority colors
  PRIORITY_NONE: '#9CA3AF',
  PRIORITY_LOW: '#10B981',
  PRIORITY_MEDIUM: '#F59E0B',
  PRIORITY_HIGH: '#F97316',
  PRIORITY_URGENT: '#EF4444',
  
  // Task status colors
  STATUS_TODO: '#6B7280',
  STATUS_IN_PROGRESS: '#3B82F6',
  STATUS_IN_REVIEW: '#8B5CF6',
  STATUS_BLOCKED: '#EF4444',
  STATUS_COMPLETED: '#10B981',
  STATUS_CANCELLED: '#9CA3AF',
} as const;
