/**
 * Auth Store
 * 
 * Zustand store for authentication state management.
 * Handles user state and auth operations.
 * Tokens are managed via HttpOnly cookies (not in store).
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { STORAGE_KEYS } from '@/lib/config';

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
  // State
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
 * Only persists user profile to localStorage.
 * Tokens are stored in HttpOnly cookies by the backend.
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
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
        // Remove user from localStorage
        if (typeof window !== 'undefined') {
          localStorage.removeItem(STORAGE_KEYS.USER);
        }

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
    }),
    {
      name: STORAGE_KEYS.USER,
      storage: createJSONStorage(() => {
        // Use localStorage for web
        if (typeof window !== 'undefined') {
          return localStorage;
        }
        // Fallback for SSR
        return {
          getItem: () => null,
          setItem: () => {},
          removeItem: () => {},
        };
      }),
      // Only persist user data (safe, non-sensitive information)
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
      // Skip hydration during SSR
      skipHydration: typeof window === 'undefined',
    }
  )
);

/**
 * Auth selectors for optimized re-renders
 */
export const selectUser = (state: AuthState) => state.user;
export const selectIsAuthenticated = (state: AuthState) => state.isAuthenticated;
export const selectIsLoading = (state: AuthState) => state.isLoading;
