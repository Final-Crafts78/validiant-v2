/**
 * Secure Storage Utility - JWT Token Management
 * 
 * Uses expo-secure-store for hardware-backed encrypted storage.
 * 
 * SECURITY:
 * - iOS: Keychain Services (hardware-backed)
 * - Android: Keystore (hardware-backed)
 * - Encrypted at rest
 * - Protected from unauthorized access
 * - Survives app updates
 * 
 * STORAGE KEYS:
 * - accessToken: Short-lived JWT (15 minutes)
 * - refreshToken: Long-lived JWT (7 days)
 * 
 * WHY NOT ASYNCSTORAGE:
 * - AsyncStorage is NOT encrypted
 * - Can be accessed by other apps on rooted/jailbroken devices
 * - SecureStore uses hardware encryption (much more secure)
 * 
 * USAGE:
 * ```typescript
 * import { saveTokens, getAccessToken, clearTokens } from '@/utils/storage';
 * 
 * // After login
 * await saveTokens(accessToken, refreshToken);
 * 
 * // For API requests
 * const token = await getAccessToken();
 * 
 * // On logout
 * await clearTokens();
 * ```
 */

import * as SecureStore from 'expo-secure-store';

/**
 * Storage Keys
 */
const STORAGE_KEYS = {
  ACCESS_TOKEN: 'validiant_access_token',
  REFRESH_TOKEN: 'validiant_refresh_token',
} as const;

/**
 * Save access token to SecureStore
 * 
 * @param token - JWT access token
 * @returns Promise<boolean> - True if successful
 */
export const saveAccessToken = async (token: string): Promise<boolean> => {
  try {
    await SecureStore.setItemAsync(STORAGE_KEYS.ACCESS_TOKEN, token);
    return true;
  } catch (error) {
    console.error('[SecureStore] Failed to save access token:', error);
    return false;
  }
};

/**
 * Get access token from SecureStore
 * 
 * @returns Promise<string | null> - Token or null if not found
 */
export const getAccessToken = async (): Promise<string | null> => {
  try {
    const token = await SecureStore.getItemAsync(STORAGE_KEYS.ACCESS_TOKEN);
    return token;
  } catch (error) {
    console.error('[SecureStore] Failed to get access token:', error);
    return null;
  }
};

/**
 * Delete access token from SecureStore
 * 
 * @returns Promise<boolean> - True if successful
 */
export const deleteAccessToken = async (): Promise<boolean> => {
  try {
    await SecureStore.deleteItemAsync(STORAGE_KEYS.ACCESS_TOKEN);
    return true;
  } catch (error) {
    console.error('[SecureStore] Failed to delete access token:', error);
    return false;
  }
};

/**
 * Save refresh token to SecureStore
 * 
 * @param token - JWT refresh token
 * @returns Promise<boolean> - True if successful
 */
export const saveRefreshToken = async (token: string): Promise<boolean> => {
  try {
    await SecureStore.setItemAsync(STORAGE_KEYS.REFRESH_TOKEN, token);
    return true;
  } catch (error) {
    console.error('[SecureStore] Failed to save refresh token:', error);
    return false;
  }
};

/**
 * Get refresh token from SecureStore
 * 
 * @returns Promise<string | null> - Token or null if not found
 */
export const getRefreshToken = async (): Promise<string | null> => {
  try {
    const token = await SecureStore.getItemAsync(STORAGE_KEYS.REFRESH_TOKEN);
    return token;
  } catch (error) {
    console.error('[SecureStore] Failed to get refresh token:', error);
    return null;
  }
};

/**
 * Delete refresh token from SecureStore
 * 
 * @returns Promise<boolean> - True if successful
 */
export const deleteRefreshToken = async (): Promise<boolean> => {
  try {
    await SecureStore.deleteItemAsync(STORAGE_KEYS.REFRESH_TOKEN);
    return true;
  } catch (error) {
    console.error('[SecureStore] Failed to delete refresh token:', error);
    return false;
  }
};

/**
 * Save both access and refresh tokens
 * 
 * @param accessToken - JWT access token
 * @param refreshToken - JWT refresh token
 * @returns Promise<boolean> - True if both saved successfully
 */
export const saveTokens = async (
  accessToken: string,
  refreshToken: string
): Promise<boolean> => {
  try {
    await Promise.all([
      SecureStore.setItemAsync(STORAGE_KEYS.ACCESS_TOKEN, accessToken),
      SecureStore.setItemAsync(STORAGE_KEYS.REFRESH_TOKEN, refreshToken),
    ]);
    return true;
  } catch (error) {
    console.error('[SecureStore] Failed to save tokens:', error);
    return false;
  }
};

/**
 * Get both access and refresh tokens
 * 
 * @returns Promise<{ accessToken: string | null; refreshToken: string | null }>
 */
export const getTokens = async (): Promise<{
  accessToken: string | null;
  refreshToken: string | null;
}> => {
  try {
    const [accessToken, refreshToken] = await Promise.all([
      SecureStore.getItemAsync(STORAGE_KEYS.ACCESS_TOKEN),
      SecureStore.getItemAsync(STORAGE_KEYS.REFRESH_TOKEN),
    ]);
    return { accessToken, refreshToken };
  } catch (error) {
    console.error('[SecureStore] Failed to get tokens:', error);
    return { accessToken: null, refreshToken: null };
  }
};

/**
 * Clear all tokens (logout)
 * 
 * @returns Promise<boolean> - True if all cleared successfully
 */
export const clearTokens = async (): Promise<boolean> => {
  try {
    await Promise.all([
      SecureStore.deleteItemAsync(STORAGE_KEYS.ACCESS_TOKEN),
      SecureStore.deleteItemAsync(STORAGE_KEYS.REFRESH_TOKEN),
    ]);
    console.log('[SecureStore] All tokens cleared');
    return true;
  } catch (error) {
    console.error('[SecureStore] Failed to clear tokens:', error);
    return false;
  }
};

/**
 * Check if user has valid tokens (not expired)
 * 
 * Note: This only checks if tokens exist, not if they're valid.
 * Server-side validation is still required.
 * 
 * @returns Promise<boolean> - True if both tokens exist
 */
export const hasTokens = async (): Promise<boolean> => {
  const { accessToken, refreshToken } = await getTokens();
  return !!(accessToken && refreshToken);
};

/**
 * Decode JWT token (without verification)
 * 
 * SECURITY WARNING: This does NOT verify the token signature.
 * Only use for reading non-sensitive claims like expiration time.
 * All tokens must be validated server-side.
 * 
 * @param token - JWT token
 * @returns Decoded payload or null
 */
export const decodeToken = (token: string): any => {
  try {
    // JWT format: header.payload.signature
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    // Decode base64 payload
    const payload = parts[1];
    const decoded = atob(payload);
    return JSON.parse(decoded);
  } catch (error) {
    console.error('[JWT] Failed to decode token:', error);
    return null;
  }
};

/**
 * Check if token is expired
 * 
 * @param token - JWT token
 * @returns boolean - True if expired
 */
export const isTokenExpired = (token: string): boolean => {
  try {
    const decoded = decodeToken(token);
    if (!decoded || !decoded.exp) {
      return true;
    }

    // exp is in seconds, Date.now() is in milliseconds
    const expirationTime = decoded.exp * 1000;
    const currentTime = Date.now();

    // Add 30 second buffer to account for clock skew
    return currentTime >= expirationTime - 30000;
  } catch (error) {
    console.error('[JWT] Failed to check token expiration:', error);
    return true;
  }
};

/**
 * Export storage keys for testing
 */
export const STORAGE_KEYS_FOR_TESTING = STORAGE_KEYS;
