/**
 * Authentication Store
 * 
 * Manages authentication state and secure token storage.
 */

import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import type { User } from '@validiant/shared';

/**
 * Storage keys
 */
const TOKEN_KEY = 'auth_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const USER_KEY = 'user_data';

/**
 * Auth state interface
 */
interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  // Actions
  setAuth: (user: User, token: string, refreshToken: string) => Promise<void>;
  clearAuth: () => Promise<void>;
  updateUser: (user: User) => Promise<void>;
  loadStoredAuth: () => Promise<void>;
  setLoading: (loading: boolean) => void;
}

/**
 * Create auth store
 */
export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: true,

  /**
   * Set authentication data
   */
  setAuth: async (user, token, refreshToken) => {
    // Store in secure storage
    await Promise.all([
      SecureStore.setItemAsync(TOKEN_KEY, token),
      SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken),
      SecureStore.setItemAsync(USER_KEY, JSON.stringify(user)),
    ]);

    set({
      user,
      token,
      refreshToken,
      isAuthenticated: true,
      isLoading: false,
    });
  },

  /**
   * Clear authentication data
   */
  clearAuth: async () => {
    // Remove from secure storage
    await Promise.all([
      SecureStore.deleteItemAsync(TOKEN_KEY),
      SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY),
      SecureStore.deleteItemAsync(USER_KEY),
    ]);

    set({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
    });
  },

  /**
   * Update user data
   */
  updateUser: async (user) => {
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
    set({ user });
  },

  /**
   * Load stored authentication data
   */
  loadStoredAuth: async () => {
    try {
      const [token, refreshToken, userJson] = await Promise.all([
        SecureStore.getItemAsync(TOKEN_KEY),
        SecureStore.getItemAsync(REFRESH_TOKEN_KEY),
        SecureStore.getItemAsync(USER_KEY),
      ]);

      if (token && refreshToken && userJson) {
        const user = JSON.parse(userJson) as User;
        set({
          user,
          token,
          refreshToken,
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        set({ isLoading: false });
      }
    } catch (error) {
      console.error('Failed to load stored auth:', error);
      set({ isLoading: false });
    }
  },

  /**
   * Set loading state
   */
  setLoading: (loading) => {
    set({ isLoading: loading });
  },
}));

/**
 * Initialize auth store on app start
 */
export const initializeAuth = async () => {
  await useAuthStore.getState().loadStoredAuth();
};
