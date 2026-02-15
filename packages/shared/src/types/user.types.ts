/**
 * User Types
 * 
 * Core type definitions for user entities, authentication, and authorization.
 * These types are shared across all applications (mobile, web, API).
 */

/**
 * User role enumeration (runtime const + type pattern)
 * Defines the hierarchy of user roles in the system
 */
export const UserRole = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  MANAGER: 'manager',
  MEMBER: 'member',
  GUEST: 'guest',
} as const;

export type UserRole = typeof UserRole[keyof typeof UserRole];

/**
 * User status enumeration (runtime const + type pattern)
 * Tracks the current state of a user account
 */
export const UserStatus = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  PENDING: 'pending',
  SUSPENDED: 'suspended',
  DELETED: 'deleted',
} as const;

export type UserStatus = typeof UserStatus[keyof typeof UserStatus];

/**
 * OAuth provider enumeration
 * Supported third-party authentication providers
 */
export enum OAuthProvider {
  GOOGLE = 'google',
  GITHUB = 'github',
  MICROSOFT = 'microsoft',
}

/**
 * User preference settings
 * Customizable user preferences for the application
 */
export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  language: string;
  timezone: string;
  dateFormat: 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD';
  timeFormat: '12h' | '24h';
  weekStartsOn: 0 | 1 | 6; // 0 = Sunday, 1 = Monday, 6 = Saturday
  emailNotifications: boolean;
  pushNotifications: boolean;
  desktopNotifications: boolean;
}

/**
 * User notification preferences
 * Fine-grained control over notification settings
 */
export interface NotificationPreferences {
  taskAssigned: boolean;
  taskCompleted: boolean;
  taskDueSoon: boolean;
  taskOverdue: boolean;
  commentMention: boolean;
  commentReply: boolean;
  projectInvite: boolean;
  projectUpdate: boolean;
  weeklyDigest: boolean;
  dailyReminder: boolean;
}

/**
 * Core User interface
 * Represents the complete user entity
 */
export interface User {
  id: string;
  email: string;
  emailVerified: boolean;
  fullName: string;
  displayName?: string;
  avatarUrl?: string;
  role: UserRole;
  status: UserStatus;
  bio?: string;
  phoneNumber?: string;
  phoneVerified: boolean;
  preferences: UserPreferences;
  notificationPreferences: NotificationPreferences;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

/**
 * User profile interface
 * Public-facing user information
 */
export interface UserProfile {
  id: string;
  fullName: string;
  displayName?: string;
  avatarUrl?: string;
  bio?: string;
  role: UserRole;
  createdAt: Date;
}

/**
 * User authentication credentials
 */
export interface UserCredentials {
  email: string;
  password: string;
}

/**
 * User registration data
 */
export interface UserRegistrationData {
  email: string;
  password: string;
  fullName: string;
  acceptedTerms: boolean;
}

/**
 * OAuth connection
 * Links a user account with an OAuth provider
 */
export interface OAuthConnection {
  id: string;
  userId: string;
  provider: OAuthProvider;
  providerUserId: string;
  providerEmail: string;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: Date;
  connectedAt: Date;
}

/**
 * User session
 * Represents an active user session
 */
export interface UserSession {
  id: string;
  userId: string;
  token: string;
  refreshToken: string;
  deviceInfo: DeviceInfo;
  ipAddress?: string;
  expiresAt: Date;
  createdAt: Date;
  lastActivityAt: Date;
}

/**
 * Device information
 * Tracks device details for sessions
 */
export interface DeviceInfo {
  deviceId: string;
  deviceType: 'mobile' | 'tablet' | 'desktop' | 'unknown';
  platform: 'ios' | 'android' | 'web' | 'windows' | 'macos' | 'linux' | 'unknown';
  browser?: string;
  browserVersion?: string;
  osVersion?: string;
  appVersion?: string;
}

/**
 * JWT token payload
 * Data encoded in authentication tokens
 */
export interface TokenPayload {
  userId: string;
  email: string;
  role: UserRole;
  sessionId: string;
  iat: number; // Issued at
  exp: number; // Expiration
}

/**
 * Authentication response
 * Returned after successful authentication
 */
export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

/**
 * Password reset request
 */
export interface PasswordResetRequest {
  email: string;
}

/**
 * Password reset confirmation
 */
export interface PasswordResetConfirmation {
  token: string;
  newPassword: string;
}

/**
 * Email verification
 */
export interface EmailVerification {
  userId: string;
  token: string;
  expiresAt: Date;
  createdAt: Date;
}

/**
 * User activity log
 * Tracks important user actions for audit purposes
 */
export interface UserActivity {
  id: string;
  userId: string;
  action: string;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

/**
 * User permission
 * Granular permission for specific resources
 */
export interface UserPermission {
  resource: string;
  action: 'create' | 'read' | 'update' | 'delete' | 'manage';
  granted: boolean;
}

/**
 * Role hierarchy mapping for permission checks
 */
const roleHierarchy: Record<UserRole, number> = {
  [UserRole.SUPER_ADMIN]: 5,
  [UserRole.ADMIN]: 4,
  [UserRole.MANAGER]: 3,
  [UserRole.MEMBER]: 2,
  [UserRole.GUEST]: 1,
};

/**
 * Type guard to check if a user has a specific role
 */
export const hasRole = (user: User, role: UserRole): boolean => {
  return roleHierarchy[user.role] >= roleHierarchy[role];
};

/**
 * Type guard to check if a user is active
 */
export const isActiveUser = (user: User): boolean => {
  return user.status === UserStatus.ACTIVE && !user.deletedAt;
};

/**
 * Default user preferences
 */
export const DEFAULT_USER_PREFERENCES: UserPreferences = {
  theme: 'system',
  language: 'en',
  timezone: 'UTC',
  dateFormat: 'MM/DD/YYYY',
  timeFormat: '12h',
  weekStartsOn: 1,
  emailNotifications: true,
  pushNotifications: true,
  desktopNotifications: false,
};

/**
 * Default notification preferences
 */
export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  taskAssigned: true,
  taskCompleted: true,
  taskDueSoon: true,
  taskOverdue: true,
  commentMention: true,
  commentReply: true,
  projectInvite: true,
  projectUpdate: false,
  weeklyDigest: true,
  dailyReminder: false,
};
