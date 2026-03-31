import { create } from 'zustand';
import api from '../lib/api';
import { secureStore } from '../lib/secure-store';

interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  role: string | null;
  activeOrganizationId: string | null;
  permissions: string[];
}

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  biometricSupported: boolean;
  biometricEnabled: boolean;

  setAuth: (user: AuthUser) => void;
  setBiometricEnabled: (enabled: boolean) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  restoreSession: () => Promise<boolean>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  biometricSupported: false,
  biometricEnabled: false,

  setAuth: (user) => {
    set({ user, isAuthenticated: true, isLoading: false });
  },

  setBiometricEnabled: async (enabled) => {
    await secureStore.setBiometricEnabled(enabled);
    set({ biometricEnabled: enabled });
  },

  login: async (email, password) => {
    set({ isLoading: true });
    try {
      const { data } = await api.post('/auth/login', { email, password });
      const { user, accessToken, refreshToken } = data.data;

      await secureStore.saveAccessToken(accessToken);
      await secureStore.saveRefreshToken(refreshToken);

      const bioEnabled = await secureStore.isBiometricEnabled();

      set({
        user,
        isAuthenticated: true,
        isLoading: false,
        biometricEnabled: bioEnabled,
      });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) {
      // Ignore logout error
    } finally {
      await secureStore.clearAll();
      set({ user: null, isAuthenticated: false });
    }
  },

  restoreSession: async () => {
    set({ isLoading: true });
    try {
      const accessToken = await secureStore.getAccessToken();
      if (!accessToken) {
        set({ isLoading: false, isAuthenticated: false });
        return false;
      }

      // Fetch current user
      const { data } = await api.get('/auth/me');
      const { user } = data.data;

      const bioEnabled = await secureStore.isBiometricEnabled();

      set({
        user,
        isAuthenticated: true,
        isLoading: false,
        biometricEnabled: bioEnabled,
      });
      return true;
    } catch (error) {
      await secureStore.clearAll();
      set({ isLoading: false, isAuthenticated: false, user: null });
      return false;
    }
  },
}));
