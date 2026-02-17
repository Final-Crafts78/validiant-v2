/**
 * Auth Store (BFF Pattern)
 * 
 * Zustand store for authentication state management.
 * Ephemeral state only - no persistence (user data fetched server-side).
 * Tokens are managed via HttpOnly cookies (not in store).
 */

import { create } from 'zustand';
import type { AuthUser } from '@/types/auth.types';

/**
 * Auth state interface
 */
interface AuthState {
  // Ephemeral state (not persisted)
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Actions
  setAuth: (data: { user: AuthUser }) => void;
  setUser: (user: AuthUser) => void;
  updateUser: (updates: Partial<AuthUser>) => void;
  clearAuth: () => void;
  setLoading: (isLoading: boolean) => void;
  initialize: () => void;
}

/**
 * Auth Store
 * 
 * IMPORTANT: No persistence middleware.
 * User data is fetched server-side in dashboard layout and passed to client components.
 * This store only manages ephemeral client state during the session.
 */
export const useAuthStore = create<AuthState>()((set, get) => ({
  // Initial state - start with loading false since auth is handled server-side
  user: null,
  isAuthenticated: false,
  isLoading: false,

  // Initialize store (called on app mount)
  initialize: () => {
    try {
      console.log('[Auth] Store initialized');
      // Since we use server-side auth, we don't need to fetch anything here
      // The dashboard layout handles user fetching server-side
      set({
        isLoading: false,
      });
    } catch (error) {
      console.error('[Auth] Initialization error:', error);
      set({
        isLoading: false,
        isAuthenticated: false,
        user: null,
      });
    }
  },

  // Set full auth data (login/register)
  setAuth: ({ user }) => {
    console.log('[Auth] Setting auth data', { userId: user.id, email: user.email });
    set({
      user,
      isAuthenticated: true,
      isLoading: false,
    });
  },

  // Set user data only
  setUser: (user) => {
    console.log('[Auth] Setting user', { userId: user.id, email: user.email });
    set({
      user,
      isAuthenticated: true,
      isLoading: false,
    });
  },

  // Update user data partially
  updateUser: (updates) => {
    const currentUser = get().user;
    if (currentUser) {
      console.log('[Auth] Updating user', { updates });
      set({
        user: { ...currentUser, ...updates },
      });
    }
  },

  // Clear auth state (logout)
  clearAuth: () => {
    console.log('[Auth] Clearing auth state');
    set({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });
  },

  // Set loading state
  setLoading: (isLoading) => {
    console.log('[Auth] Setting loading state', { isLoading });
    set({ isLoading });
  },
}));

/**
 * Auth selectors for optimized re-renders
 */
export const selectUser = (state: AuthState) => state.user;
export const selectIsAuthenticated = (state: AuthState) => state.isAuthenticated;
export const selectIsLoading = (state: AuthState) => state.isLoading;