/**
 * Authentication Service
 * 
 * API calls for authentication operations.
 */

import { api } from './api';
import type { User } from '@validiant/shared';

/**
 * Login credentials
 */
export interface LoginCredentials {
  email: string;
  password: string;
}

/**
 * Register data
 */
export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

/**
 * Auth response
 */
export interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
}

/**
 * API Response wrapper
 */
interface ApiResponse<T> {
  data: T;
  message: string;
}

/**
 * Login
 */
export const login = async (credentials: LoginCredentials): Promise<AuthResponse> => {
  const response = await api.post<ApiResponse<AuthResponse>>(
    '/api/v1/auth/login',
    credentials
  );
  return response.data.data;
};

/**
 * Register
 */
export const register = async (data: RegisterData): Promise<AuthResponse> => {
  const response = await api.post<ApiResponse<AuthResponse>>(
    '/api/v1/auth/register',
    data
  );
  return response.data.data;
};

/**
 * Logout
 */
export const logout = async (): Promise<void> => {
  await api.post('/api/v1/auth/logout');
};

/**
 * Refresh token
 */
export const refreshToken = async (refreshToken: string): Promise<AuthResponse> => {
  const response = await api.post<ApiResponse<AuthResponse>>(
    '/api/v1/auth/refresh',
    { refreshToken }
  );
  return response.data.data;
};

/**
 * Get current user
 */
export const getCurrentUser = async (): Promise<User> => {
  const response = await api.get<ApiResponse<{ user: User }>>('/api/v1/auth/me');
  return response.data.data.user;
};

/**
 * Forgot password
 */
export const forgotPassword = async (email: string): Promise<void> => {
  await api.post('/api/v1/auth/forgot-password', { email });
};

/**
 * Reset password
 */
export const resetPassword = async (
  token: string,
  password: string
): Promise<void> => {
  await api.post('/api/v1/auth/reset-password', { token, password });
};

/**
 * Verify email
 */
export const verifyEmail = async (token: string): Promise<void> => {
  await api.post('/api/v1/auth/verify-email', { token });
};
