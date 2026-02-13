/**
 * Application Configuration
 * 
 * Centralized configuration for the web application.
 * Environment variables, API endpoints, feature flags, etc.
 */

/**
 * Environment type
 */
type Environment = 'development' | 'staging' | 'production';

/**
 * Get current environment
 */
export const ENV: Environment =
  (process.env.NODE_ENV as Environment) || 'development';

/**
 * API Configuration
 */
export const API_CONFIG = {
  // Base URL for API requests
  BASE_URL:
    process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1',

  // Timeout for API requests (milliseconds)
  TIMEOUT: 30000,

  // Endpoints
  ENDPOINTS: {
    // Auth endpoints
    AUTH: {
      LOGIN: '/auth/login',
      REGISTER: '/auth/register',
      LOGOUT: '/auth/logout',
      REFRESH: '/auth/refresh',
      FORGOT_PASSWORD: '/auth/forgot-password',
      RESET_PASSWORD: '/auth/reset-password',
      VERIFY_EMAIL: '/auth/verify-email',
      ME: '/auth/me',
    },

    // User endpoints
    USERS: {
      LIST: '/users',
      DETAIL: (id: string) => `/users/${id}`,
      UPDATE: (id: string) => `/users/${id}`,
      DELETE: (id: string) => `/users/${id}`,
    },

    // Project endpoints
    PROJECTS: {
      LIST: '/projects',
      DETAIL: (id: string) => `/projects/${id}`,
      CREATE: '/projects',
      UPDATE: (id: string) => `/projects/${id}`,
      DELETE: (id: string) => `/projects/${id}`,
    },

    // Task endpoints
    TASKS: {
      LIST: '/tasks',
      DETAIL: (id: string) => `/tasks/${id}`,
      CREATE: '/tasks',
      UPDATE: (id: string) => `/tasks/${id}`,
      DELETE: (id: string) => `/tasks/${id}`,
    },

    // Organization endpoints
    ORGANIZATIONS: {
      LIST: '/organizations',
      DETAIL: (id: string) => `/organizations/${id}`,
      CREATE: '/organizations',
      UPDATE: (id: string) => `/organizations/${id}`,
      DELETE: (id: string) => `/organizations/${id}`,
    },
  },
} as const;

/**
 * Storage Keys
 */
export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'validiant_access_token',
  REFRESH_TOKEN: 'validiant_refresh_token',
  USER: 'validiant_user',
  THEME: 'validiant_theme',
  LANGUAGE: 'validiant_language',
} as const;

/**
 * Query Keys for React Query
 */
export const QUERY_KEYS = {
  // Auth
  AUTH_USER: ['auth', 'user'] as const,

  // Users
  USERS: ['users'] as const,
  USER_DETAIL: (id: string) => ['users', id] as const,

  // Projects
  PROJECTS: ['projects'] as const,
  PROJECT_DETAIL: (id: string) => ['projects', id] as const,

  // Tasks
  TASKS: ['tasks'] as const,
  TASK_DETAIL: (id: string) => ['tasks', id] as const,

  // Organizations
  ORGANIZATIONS: ['organizations'] as const,
  ORGANIZATION_DETAIL: (id: string) => ['organizations', id] as const,
} as const;

/**
 * Application Routes
 */
export const ROUTES = {
  // Public routes
  HOME: '/',
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  FORGOT_PASSWORD: '/auth/forgot-password',
  RESET_PASSWORD: '/auth/reset-password',

  // Protected routes
  DASHBOARD: '/dashboard',
  PROJECTS: '/projects',
  PROJECT_DETAIL: (id: string) => `/projects/${id}`,
  TASKS: '/tasks',
  TASK_DETAIL: (id: string) => `/tasks/${id}`,
  ORGANIZATIONS: '/organizations',
  ORGANIZATION_DETAIL: (id: string) => `/organizations/${id}`,
  PROFILE: '/profile',
  SETTINGS: '/settings',
} as const;

/**
 * Feature Flags
 */
export const FEATURES = {
  // Enable dark mode
  DARK_MODE: true,

  // Enable real-time updates
  REAL_TIME: false,

  // Enable analytics
  ANALYTICS: ENV === 'production',

  // Enable error tracking
  ERROR_TRACKING: ENV === 'production',

  // Enable beta features
  BETA_FEATURES: ENV === 'development',
} as const;

/**
 * Validation Rules
 */
export const VALIDATION = {
  PASSWORD: {
    MIN_LENGTH: 8,
    MAX_LENGTH: 128,
    REQUIRE_UPPERCASE: true,
    REQUIRE_LOWERCASE: true,
    REQUIRE_NUMBER: true,
    REQUIRE_SPECIAL: true,
  },
  EMAIL: {
    MAX_LENGTH: 255,
  },
  NAME: {
    MIN_LENGTH: 2,
    MAX_LENGTH: 50,
  },
} as const;

/**
 * Pagination Defaults
 */
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_PER_PAGE: 20,
  MAX_PER_PAGE: 100,
} as const;

/**
 * App Metadata
 */
export const APP_INFO = {
  NAME: 'Validiant',
  VERSION: process.env.NEXT_PUBLIC_APP_VERSION || '2.0.0',
  DESCRIPTION: 'Modern project management platform for teams',
  AUTHOR: 'Validiant Team',
  WEBSITE: 'https://validiant.com',
  SUPPORT_EMAIL: 'support@validiant.com',
} as const;
