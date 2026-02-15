/**
 * Shared Constants
 * 
 * Constants used across the application.
 */

/**
 * Validation constants for input validation
 */
export const VALIDATION = {
  EMAIL: {
    MIN_LENGTH: 5,
    MAX_LENGTH: 255,
  },
  PASSWORD: {
    MIN_LENGTH: 8,
    MAX_LENGTH: 128,
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
  PHONE_NUMBER: {
    REGEX: /^\+?[1-9]\d{1,14}$/,
  },
  ORGANIZATION_NAME: {
    MIN_LENGTH: 2,
    MAX_LENGTH: 100,
  },
  TEAM_NAME: {
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
    MAX_LENGTH: 5000,
  },
} as const;

/**
 * API version
 */
export const API_VERSION = 'v1';

/**
 * Token types
 */
export const TOKEN_TYPES = {
  ACCESS: 'access',
  REFRESH: 'refresh',
  RESET_PASSWORD: 'reset_password',
  VERIFY_EMAIL: 'verify_email',
} as const;

/**
 * Token expiration times (in seconds)
 */
export const TOKEN_EXPIRATION = {
  ACCESS: 15 * 60, // 15 minutes
  REFRESH: 7 * 24 * 60 * 60, // 7 days
  RESET_PASSWORD: 60 * 60, // 1 hour
  VERIFY_EMAIL: 24 * 60 * 60, // 24 hours
} as const;

/**
 * HTTP status codes
 */
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
} as const;

/**
 * Error codes
 */
export const ERROR_CODES = {
  // Auth errors
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  UNAUTHORIZED: 'UNAUTHORIZED',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  TOKEN_INVALID: 'TOKEN_INVALID',
  EMAIL_ALREADY_EXISTS: 'EMAIL_ALREADY_EXISTS',
  EMAIL_NOT_VERIFIED: 'EMAIL_NOT_VERIFIED',
  
  // Resource errors
  NOT_FOUND: 'NOT_FOUND',
  ALREADY_EXISTS: 'ALREADY_EXISTS',
  
  // Permission errors
  FORBIDDEN: 'FORBIDDEN',
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',
  
  // Validation errors
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',
  
  // Server errors
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
} as const;

/**
 * Pagination defaults
 */
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
} as const;

/**
 * Date formats
 */
export const DATE_FORMATS = {
  ISO: 'YYYY-MM-DD',
  ISO_TIME: 'YYYY-MM-DDTHH:mm:ss',
  DISPLAY: 'MMM DD, YYYY',
  DISPLAY_TIME: 'MMM DD, YYYY HH:mm',
} as const;

/**
 * Project status values
 */
export const PROJECT_STATUS = {
  ACTIVE: 'active',
  COMPLETED: 'completed',
  ON_HOLD: 'on-hold',
  PLANNING: 'planning',
} as const;

/**
 * Task status values
 */
export const TASK_STATUS = {
  TODO: 'todo',
  IN_PROGRESS: 'in-progress',
  COMPLETED: 'completed',
} as const;

/**
 * Task priority values
 */
export const TASK_PRIORITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent',
} as const;

/**
 * Organization role values
 */
export const ORGANIZATION_ROLE = {
  OWNER: 'owner',
  ADMIN: 'admin',
  MEMBER: 'member',
} as const;

/**
 * File upload limits
 */
export const FILE_UPLOAD = {
  MAX_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
} as const;
