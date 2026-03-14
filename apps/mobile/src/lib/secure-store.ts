import * as SecureStore from 'expo-secure-store';

const ACCESS_TOKEN_KEY = 'validiant_access_token';
const REFRESH_TOKEN_KEY = 'validiant_refresh_token';
const BIOMETRIC_ENABLED_KEY = 'validiant_biometric_enabled';

/**
 * Secure Storage Utility
 * Wraps expo-secure-store for secure token management.
 */
export const secureStore = {
  async saveAccessToken(token: string) {
    await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, token);
  },

  async getAccessToken() {
    return await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
  },

  async deleteAccessToken() {
    await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
  },

  async saveRefreshToken(token: string) {
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, token);
  },

  async getRefreshToken() {
    return await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
  },

  async deleteRefreshToken() {
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
  },

  async setBiometricEnabled(enabled: boolean) {
    await SecureStore.setItemAsync(BIOMETRIC_ENABLED_KEY, enabled.toString());
  },

  async isBiometricEnabled() {
    const val = await SecureStore.getItemAsync(BIOMETRIC_ENABLED_KEY);
    return val === 'true';
  },

  async clearAll() {
    await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
    // Note: We might want to keep biometric preference? Usually yes.
  },
};
