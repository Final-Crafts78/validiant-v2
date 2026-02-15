/**
 * Auth Service
 * 
 * Service for authentication-related API calls.
 * Handles login, register, logout, password reset, etc.
 */

import { post } from '@/lib/api';
import { API_CONFIG } from '@/lib/config';
import type { User } from '@/store/auth';

/**
 * Login credentials
 */
export interface LoginCredentials {
  email: string;
  password: string;
}

/**
 * Registration data
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
  accessToken: string;
  refreshToken: string;
}

/**
 * Forgot password data
 */
export interface ForgotPasswordData {
  email: string;
}

/**
 * Reset password data
 */
export interface ResetPasswordData {
  token: string;
  password: string;
}

/**
 * Verify email data
 */
export interface VerifyEmailData {
  token: string;
}

/**
 * Login user
 */
export const login = async (
  credentials: LoginCredentials
): Promise<AuthResponse> => {
  return post<AuthResponse>(
    API_CONFIG.ENDPOINTS.AUTH.LOGIN,
    credentials
  ).then((res) => res.data);
};

/**
 * Register new user
 */
export const register = async (
  data: RegisterData
): Promise<AuthResponse> => {
  return post<AuthResponse>(
    API_CONFIG.ENDPOINTS.AUTH.REGISTER,
    data
  ).then((res) => res.data);
};

/**
 * Logout user
 */
export const logout = async (): Promise<void> => {
  return post<void>(API_CONFIG.ENDPOINTS.AUTH.LOGOUT).then((res) => res.data);
};

/**
 * Refresh access token
 */
export const refreshToken = async (
  refreshToken: string
): Promise<{ accessToken: string }> => {
  return post<{ accessToken: string }>(
    API_CONFIG.ENDPOINTS.AUTH.REFRESH,
    { refreshToken }
  ).then((res) => res.data);
};

/**
 * Get current user
 */
export const getCurrentUser = async (): Promise<User> => {
  return post<User>(API_CONFIG.ENDPOINTS.AUTH.ME).then((res) => res.data);
};

/**
 * Request password reset
 */
export const forgotPassword = async (
  data: ForgotPasswordData
): Promise<{ message: string }> => {
  return post<{ message: string }>(
    API_CONFIG.ENDPOINTS.AUTH.FORGOT_PASSWORD,
    data
  ).then((res) => res.data);
};

/**
 * Reset password with token
 */
export const resetPassword = async (
  data: ResetPasswordData
): Promise<{ message: string }> => {
  return post<{ message: string }>(
    API_CONFIG.ENDPOINTS.AUTH.RESET_PASSWORD,
    data
  ).then((res) => res.data);
};

/**
 * Verify email with token
 */
export const verifyEmail = async (
  data: VerifyEmailData
): Promise<{ message: string }> => {
  return post<{ message: string }>(
    API_CONFIG.ENDPOINTS.AUTH.VERIFY_EMAIL,
    data
  ).then((res) => res.data);
};
