/**
 * Environment Configuration
 * 
 * Validates and exports environment variables for the API server.
 * Uses Zod for runtime validation to ensure all required variables are present.
 * 
 * Phase 6.1 Enhancement: OAuth 2.0 configuration
 */

import { z } from 'zod';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

/**
 * Environment schema with validation
 */
const envSchema = z.object({
  // Server
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('3001').transform(Number),
  API_VERSION: z.string().default('v1'),
  
  // Database - Supabase PostgreSQL or Neon
  DATABASE_URL: z.string().url('Invalid database URL'),
  DATABASE_POOL_MIN: z.string().default('2').transform(Number),
  DATABASE_POOL_MAX: z.string().default('10').transform(Number),
  
  // Redis - Upstash (Edge Compatible)
  UPSTASH_REDIS_REST_URL: z.string().url('Invalid Upstash Redis REST URL'),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1, 'Upstash Redis REST token is required'),
  
  // JWT
  JWT_SECRET: z.string().min(32, 'JWT secret must be at least 32 characters'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT refresh secret must be at least 32 characters'),
  JWT_ACCESS_EXPIRY: z.string().default('1h'),
  JWT_REFRESH_EXPIRY: z.string().default('7d'),
  
  // OAuth - Google
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_REDIRECT_URI: z.string().url().optional(),
  
  // OAuth - GitHub
  GITHUB_CLIENT_ID: z.string().optional(),
  GITHUB_CLIENT_SECRET: z.string().optional(),
  GITHUB_REDIRECT_URI: z.string().url().optional(),
  
  // OAuth - Microsoft (Future)
  MICROSOFT_CLIENT_ID: z.string().optional(),
  MICROSOFT_CLIENT_SECRET: z.string().optional(),
  MICROSOFT_CALLBACK_URL: z.string().url().optional(),
  
  // Email - SendGrid
  SENDGRID_API_KEY: z.string().optional(),
  SENDGRID_FROM_EMAIL: z.string().email().optional(),
  SENDGRID_FROM_NAME: z.string().optional(),
  
  // SMS - Twilio
  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  TWILIO_PHONE_NUMBER: z.string().optional(),
  
  // File Storage - AWS S3 or Supabase Storage
  STORAGE_PROVIDER: z.enum(['s3', 'supabase']).default('supabase'),
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_REGION: z.string().optional(),
  AWS_S3_BUCKET: z.string().optional(),
  SUPABASE_STORAGE_URL: z.string().url().optional(),
  SUPABASE_SERVICE_KEY: z.string().optional(),
  
  // Push Notifications - Firebase
  FIREBASE_PROJECT_ID: z.string().optional(),
  FIREBASE_PRIVATE_KEY: z.string().optional(),
  FIREBASE_CLIENT_EMAIL: z.string().email().optional(),
  
  // Payment - Stripe
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  STRIPE_PUBLISHABLE_KEY: z.string().optional(),
  
  // Logging
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  LOG_FORMAT: z.enum(['json', 'pretty']).default('json'),
  
  // Security
  CORS_ORIGIN: z.string().default('http://localhost:3000,http://localhost:19006'),
  RATE_LIMIT_WINDOW_MS: z.string().default('900000').transform(Number), // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: z.string().default('100').transform(Number),
  BCRYPT_ROUNDS: z.string().default('12').transform(Number),
  
  // Session
  SESSION_SECRET: z.string().min(32, 'Session secret must be at least 32 characters'),
  SESSION_MAX_AGE: z.string().default('86400000').transform(Number), // 24 hours
  
  // Client URLs
  WEB_APP_URL: z.string().url().default('http://localhost:3000'),
  MOBILE_APP_SCHEME: z.string().default('validiant'),
  
  // Monitoring (optional)
  SENTRY_DSN: z.string().url().optional(),
  
  // Feature Flags
  ENABLE_SWAGGER: z.string().default('true').transform(val => val === 'true'),
  ENABLE_WEBHOOKS: z.string().default('true').transform(val => val === 'true'),
  ENABLE_2FA: z.string().default('true').transform(val => val === 'true'),
});

/**
 * Validate and parse environment variables
 */
const parseEnv = () => {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Environment variable validation failed:');
      error.errors.forEach((err) => {
        console.error(`  - ${err.path.join('.')}: ${err.message}`);
      });
      process.exit(1);
    }
    throw error;
  }
};

/**
 * Validated environment configuration
 */
export const env = parseEnv();

/**
 * Helper to check if running in production
 */
export const isProduction = env.NODE_ENV === 'production';

/**
 * Helper to check if running in development
 */
export const isDevelopment = env.NODE_ENV === 'development';

/**
 * Helper to check if running in test
 */
export const isTest = env.NODE_ENV === 'test';

/**
 * Helper to get CORS origins as array
 */
export const getCorsOrigins = (): string[] => {
  return env.CORS_ORIGIN.split(',').map(origin => origin.trim());
};

/**
 * Helper to check if OAuth provider is configured
 */
export const isOAuthProviderEnabled = (provider: 'google' | 'github' | 'microsoft'): boolean => {
  switch (provider) {
    case 'google':
      return !!(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET && env.GOOGLE_REDIRECT_URI);
    case 'github':
      return !!(env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET && env.GITHUB_REDIRECT_URI);
    case 'microsoft':
      return !!(env.MICROSOFT_CLIENT_ID && env.MICROSOFT_CLIENT_SECRET);
    default:
      return false;
  }
};

/**
 * Helper to check if email service is configured
 */
export const isEmailEnabled = (): boolean => {
  return !!(env.SENDGRID_API_KEY && env.SENDGRID_FROM_EMAIL);
};

/**
 * Helper to check if SMS service is configured
 */
export const isSmsEnabled = (): boolean => {
  return !!(env.TWILIO_ACCOUNT_SID && env.TWILIO_AUTH_TOKEN && env.TWILIO_PHONE_NUMBER);
};

/**
 * Helper to check if push notifications are configured
 */
export const isPushNotificationsEnabled = (): boolean => {
  return !!(env.FIREBASE_PROJECT_ID && env.FIREBASE_PRIVATE_KEY && env.FIREBASE_CLIENT_EMAIL);
};

/**
 * Helper to check if payment processing is enabled
 */
export const isPaymentEnabled = (): boolean => {
  return !!(env.STRIPE_SECRET_KEY);
};

/**
 * Export type for environment config
 */
export type Env = z.infer<typeof envSchema>;
