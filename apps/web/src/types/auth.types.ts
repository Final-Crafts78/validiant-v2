/**
 * Auth Types for BFF Pattern
 * 
 * These types match the actual API response structure from auth endpoints.
 * The API returns a simplified user object, not the full User type from shared package.
 */

/**
 * Auth User Response
 * This is what the API actually returns in login/register/me endpoints
 * CRITICAL: Uses avatarUrl to match database schema and @validiant/shared
 */
export interface AuthUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  fullName: string;
  avatarUrl?: string; // ✅ FIXED: Use avatarUrl (matches database)
  emailVerified: boolean;
  twoFactorEnabled: boolean;
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
}

/**
 * Login Action Result
 */
export interface LoginActionResult {
  success: boolean;
  user?: AuthUser;
  error?: string;
  message?: string;
}

/**
 * Register Action Result
 */
export interface RegisterActionResult {
  success: boolean;
  user?: AuthUser;
  error?: string;
  message?: string;
}

/**
 * Logout Action Result
 */
export interface LogoutActionResult {
  success: boolean;
  error?: string;
  message?: string;
}

/**
 * Get Current User Action Result
 */
export interface GetCurrentUserActionResult {
  success: boolean;
  user?: AuthUser;
  error?: string;
  message?: string;
}
