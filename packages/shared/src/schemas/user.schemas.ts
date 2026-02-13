/**
 * User and Authentication Schemas
 * 
 * Zod validation schemas for user-related operations.
 * These provide runtime validation matching our TypeScript types.
 */

import { z } from 'zod';
import { VALIDATION } from '../constants';
import { UserRole, UserStatus, OAuthProvider } from '../types';

/**
 * User role enum schema
 */
export const userRoleSchema = z.nativeEnum(UserRole);

/**
 * User status enum schema
 */
export const userStatusSchema = z.nativeEnum(UserStatus);

/**
 * OAuth provider enum schema
 */
export const oauthProviderSchema = z.nativeEnum(OAuthProvider);

/**
 * Email validation schema
 */
export const emailSchema = z
  .string()
  .min(VALIDATION.EMAIL.MIN_LENGTH, `Email must be at least ${VALIDATION.EMAIL.MIN_LENGTH} characters`)
  .max(VALIDATION.EMAIL.MAX_LENGTH, `Email must not exceed ${VALIDATION.EMAIL.MAX_LENGTH} characters`)
  .email('Invalid email format')
  .toLowerCase()
  .trim();

/**
 * Password validation schema
 */
export const passwordSchema = z
  .string()
  .min(VALIDATION.PASSWORD.MIN_LENGTH, `Password must be at least ${VALIDATION.PASSWORD.MIN_LENGTH} characters`)
  .max(VALIDATION.PASSWORD.MAX_LENGTH, `Password must not exceed ${VALIDATION.PASSWORD.MAX_LENGTH} characters`)
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/\d/, 'Password must contain at least one number')
  .regex(/[@$!%*?&]/, 'Password must contain at least one special character (@$!%*?&)');

/**
 * Username validation schema
 */
export const usernameSchema = z
  .string()
  .min(VALIDATION.USERNAME.MIN_LENGTH, `Username must be at least ${VALIDATION.USERNAME.MIN_LENGTH} characters`)
  .max(VALIDATION.USERNAME.MAX_LENGTH, `Username must not exceed ${VALIDATION.USERNAME.MAX_LENGTH} characters`)
  .regex(VALIDATION.USERNAME.REGEX, 'Username can only contain letters, numbers, hyphens, and underscores')
  .toLowerCase()
  .trim();

/**
 * Full name validation schema
 */
export const fullNameSchema = z
  .string()
  .min(VALIDATION.FULL_NAME.MIN_LENGTH, `Name must be at least ${VALIDATION.FULL_NAME.MIN_LENGTH} characters`)
  .max(VALIDATION.FULL_NAME.MAX_LENGTH, `Name must not exceed ${VALIDATION.FULL_NAME.MAX_LENGTH} characters`)
  .trim();

/**
 * Phone number validation schema
 */
export const phoneNumberSchema = z
  .string()
  .regex(VALIDATION.PHONE_NUMBER.REGEX, 'Invalid phone number format')
  .optional();

/**
 * User preferences schema
 */
export const userPreferencesSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']),
  language: z.string().min(2).max(5),
  timezone: z.string(),
  dateFormat: z.enum(['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD']),
  timeFormat: z.enum(['12h', '24h']),
  weekStartsOn: z.union([z.literal(0), z.literal(1), z.literal(6)]),
  emailNotifications: z.boolean(),
  pushNotifications: z.boolean(),
  desktopNotifications: z.boolean(),
});

/**
 * Notification preferences schema
 */
export const notificationPreferencesSchema = z.object({
  taskAssigned: z.boolean(),
  taskCompleted: z.boolean(),
  taskDueSoon: z.boolean(),
  taskOverdue: z.boolean(),
  commentMention: z.boolean(),
  commentReply: z.boolean(),
  projectInvite: z.boolean(),
  projectUpdate: z.boolean(),
  weeklyDigest: z.boolean(),
  dailyReminder: z.boolean(),
});

/**
 * User registration schema
 */
export const userRegistrationSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  fullName: fullNameSchema,
  acceptedTerms: z.boolean().refine(val => val === true, {
    message: 'You must accept the terms and conditions',
  }),
});

/**
 * User login schema
 */
export const userLoginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

/**
 * Password reset request schema
 */
export const passwordResetRequestSchema = z.object({
  email: emailSchema,
});

/**
 * Password reset confirmation schema
 */
export const passwordResetConfirmationSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  newPassword: passwordSchema,
});

/**
 * Change password schema
 */
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: passwordSchema,
});

/**
 * Email verification schema
 */
export const emailVerificationSchema = z.object({
  token: z.string().min(1, 'Verification token is required'),
});

/**
 * OAuth callback schema
 */
export const oauthCallbackSchema = z.object({
  provider: oauthProviderSchema,
  code: z.string().min(1, 'Authorization code is required'),
  state: z.string().optional(),
});

/**
 * User profile update schema
 */
export const updateUserProfileSchema = z.object({
  fullName: fullNameSchema.optional(),
  displayName: z.string().min(2).max(50).optional(),
  bio: z.string().max(500).optional(),
  phoneNumber: phoneNumberSchema,
  avatarUrl: z.string().url('Invalid avatar URL').optional(),
});

/**
 * User preferences update schema
 */
export const updateUserPreferencesSchema = userPreferencesSchema.partial();

/**
 * Notification preferences update schema
 */
export const updateNotificationPreferencesSchema = notificationPreferencesSchema.partial();

/**
 * Device info schema
 */
export const deviceInfoSchema = z.object({
  deviceId: z.string(),
  deviceType: z.enum(['mobile', 'tablet', 'desktop', 'unknown']),
  platform: z.enum(['ios', 'android', 'web', 'windows', 'macos', 'linux', 'unknown']),
  browser: z.string().optional(),
  browserVersion: z.string().optional(),
  osVersion: z.string().optional(),
  appVersion: z.string().optional(),
});

/**
 * User session creation schema
 */
export const createSessionSchema = z.object({
  deviceInfo: deviceInfoSchema,
  ipAddress: z.string().ip().optional(),
});

/**
 * Refresh token schema
 */
export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

/**
 * User query filters schema
 */
export const userFiltersSchema = z.object({
  search: z.string().optional(),
  role: userRoleSchema.optional(),
  status: userStatusSchema.optional(),
  emailVerified: z.boolean().optional(),
});

/**
 * User sort schema
 */
export const userSortSchema = z.object({
  field: z.enum(['createdAt', 'updatedAt', 'fullName', 'email', 'lastLoginAt']),
  direction: z.enum(['asc', 'desc']),
});

/**
 * Update user role schema (admin only)
 */
export const updateUserRoleSchema = z.object({
  role: userRoleSchema,
});

/**
 * Update user status schema (admin only)
 */
export const updateUserStatusSchema = z.object({
  status: userStatusSchema,
  reason: z.string().optional(),
});

/**
 * User activity log schema
 */
export const userActivitySchema = z.object({
  action: z.string(),
  entityType: z.string().optional(),
  entityId: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

/**
 * Bulk user action schema
 */
export const bulkUserActionSchema = z.object({
  userIds: z.array(z.string().uuid()).min(1, 'At least one user ID is required'),
  action: z.enum(['activate', 'deactivate', 'suspend', 'delete']),
});

/**
 * User invitation schema
 */
export const userInvitationSchema = z.object({
  email: emailSchema,
  role: userRoleSchema,
  message: z.string().max(500).optional(),
});

/**
 * Accept invitation schema
 */
export const acceptInvitationSchema = z.object({
  token: z.string().min(1, 'Invitation token is required'),
  fullName: fullNameSchema,
  password: passwordSchema,
});

/**
 * Two-factor authentication setup schema
 */
export const setupTwoFactorSchema = z.object({
  method: z.enum(['totp', 'sms', 'email']),
  phoneNumber: phoneNumberSchema,
});

/**
 * Two-factor authentication verify schema
 */
export const verifyTwoFactorSchema = z.object({
  code: z.string().length(6, 'Verification code must be 6 digits').regex(/^\d{6}$/, 'Code must contain only numbers'),
});

/**
 * Disable two-factor authentication schema
 */
export const disableTwoFactorSchema = z.object({
  password: z.string().min(1, 'Password is required'),
  code: z.string().length(6),
});

/**
 * User export request schema
 */
export const userExportRequestSchema = z.object({
  format: z.enum(['csv', 'json', 'xlsx']),
  filters: userFiltersSchema.optional(),
  fields: z.array(z.string()).optional(),
});

/**
 * Helper: Validate partial user update
 */
export const partialUserUpdateSchema = z.object({
  fullName: fullNameSchema.optional(),
  displayName: z.string().min(2).max(50).optional(),
  bio: z.string().max(500).optional(),
  phoneNumber: phoneNumberSchema,
  avatarUrl: z.string().url().optional(),
  preferences: updateUserPreferencesSchema.optional(),
  notificationPreferences: updateNotificationPreferencesSchema.optional(),
}).strict();

/**
 * Type inference helpers
 */
export type UserRegistrationInput = z.infer<typeof userRegistrationSchema>;
export type UserLoginInput = z.infer<typeof userLoginSchema>;
export type PasswordResetRequestInput = z.infer<typeof passwordResetRequestSchema>;
export type PasswordResetConfirmationInput = z.infer<typeof passwordResetConfirmationSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type UpdateUserProfileInput = z.infer<typeof updateUserProfileSchema>;
export type UpdateUserPreferencesInput = z.infer<typeof updateUserPreferencesSchema>;
export type DeviceInfoInput = z.infer<typeof deviceInfoSchema>;
export type UserFiltersInput = z.infer<typeof userFiltersSchema>;
export type BulkUserActionInput = z.infer<typeof bulkUserActionSchema>;
export type UserInvitationInput = z.infer<typeof userInvitationSchema>;
