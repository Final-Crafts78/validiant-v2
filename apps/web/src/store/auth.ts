/**
 * Auth Store
 * 
 * Zustand store for authentication state management.
 * Ephemeral state only - no persistence (user data fetched server-side).
 * Tokens are managed via HttpOnly cookies (not in store).
 */

import { create } from 'zustand';

/**
 * User interface
 */
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role?: 'admin' | 'user' | 'member';
  isEmailVerified?: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Auth state interface
 */
interface AuthState {
  // Ephemeral state (not persisted)
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Actions
  setAuth: (data: { user: User }) => void;
  setUser: (user: User) => void;
  updateUser: (updates: Partial<User>) => void;
  clearAuth: () => void;
  setLoading: (isLoading: boolean) => void;
}

/**
 * Auth Store
 * 
 * IMPORTANT: No persistence middleware.
 * User data is fetched server-side in dashboard layout and passed to client components.
 * This store only manages ephemeral client state during the session.
 */
export const useAuthStore = create<AuthState>()((set, get) => ({
  // Initial state
  user: null,
  isAuthenticated: false,
  isLoading: true,

  // Set full auth data (login/register)
  setAuth: ({ user }) => {
    set({
      user,
      isAuthenticated: true,
      isLoading: false,
    });
  },

  // Set user data only
  setUser: (user) => {
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
      set({
        user: { ...currentUser, ...updates },
      });
    }
  },

  // Clear auth state (logout)
  clearAuth: () => {
    set({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });
  },

  // Set loading state
  setLoading: (isLoading) => {
    set({ isLoading });
  },
}));

/**
 * Auth selectors for optimized re-renders
 */
export const selectUser = (state: AuthState) => state.user;
export const selectIsAuthenticated = (state: AuthState) => state.isAuthenticated;
export const selectIsLoading = (state: AuthState) => state.isLoading;
