/**
 * App Configuration Constants
 * 
 * Central configuration for the mobile app.
 */

import Constants from 'expo-constants';

/**
 * Environment type
 */
export type Environment = 'development' | 'staging' | 'production';

/**
 * Get current environment
 */
export const ENV: Environment =
  (Constants.expoConfig?.extra?.environment as Environment) || 'development';

/**
 * API Configuration
 */
export const API_CONFIG = {
  development: {
    url: 'http://localhost:3000',
    timeout: 30000,
  },
  staging: {
    url: 'https://staging-api.validiant.com',
    timeout: 30000,
  },
  production: {
    url: 'https://api.validiant.com',
    timeout: 30000,
  },
};

/**
 * API Base URL based on environment
 */
export const API_URL = API_CONFIG[ENV].url;

/**
 * API Timeout
 */
export const API_TIMEOUT = API_CONFIG[ENV].timeout;

/**
 * App Configuration
 */
export const APP_CONFIG = {
  name: 'Validiant',
  version: Constants.expoConfig?.version || '2.0.0',
  scheme: 'validiant',
};

/**
 * Storage Keys
 */
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  REFRESH_TOKEN: 'refresh_token',
  USER_DATA: 'user_data',
  THEME: 'theme',
  LANGUAGE: 'language',
};

/**
 * Query Keys for React Query
 */
export const QUERY_KEYS = {
  // Auth
  ME: ['me'],
  
  // Users
  USERS: ['users'],
  USER: (id: string) => ['users', id],
  
  // Organizations
  ORGANIZATIONS: ['organizations'],
  ORGANIZATION: (id: string) => ['organizations', id],
  ORGANIZATION_MEMBERS: (id: string) => ['organizations', id, 'members'],
  
  // Projects
  PROJECTS: ['projects'],
  PROJECT: (id: string) => ['projects', id],
  PROJECT_MEMBERS: (id: string) => ['projects', id, 'members'],
  PROJECT_TASKS: (id: string) => ['projects', id, 'tasks'],
  
  // Tasks
  TASKS: ['tasks'],
  TASK: (id: string) => ['tasks', id],
  TASK_SUBTASKS: (id: string) => ['tasks', id, 'subtasks'],
};

/**
 * Pagination Configuration
 */
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
};

/**
 * Date Formats
 */
export const DATE_FORMATS = {
  DISPLAY: 'MMM dd, yyyy',
  DISPLAY_WITH_TIME: 'MMM dd, yyyy HH:mm',
  API: "yyyy-MM-dd'T'HH:mm:ss.SSSxxx",
  SHORT: 'MM/dd/yyyy',
};

/**
 * Feature Flags
 */
export const FEATURES = {
  TIME_TRACKING: false,
  FILE_UPLOADS: false,
  NOTIFICATIONS: false,
  DARK_MODE: true,
};

/**
 * Debug Mode
 */
export const IS_DEV = __DEV__;
export const ENABLE_LOGGING = IS_DEV;
