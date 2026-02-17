/**
 * Auth Service
 * 
 * Service for authentication-related API calls.
 * Handles login, register, logout, password reset, etc.
 */

import { get, post } from '@/lib/api';
import { API_CONFIG } from '@/lib/config';
import type { User } from '@validiant/shared';
import type { APIResponse } from '@/lib/api';

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
  fullName: string;
  acceptedTerms: boolean;
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
  return post<APIResponse<AuthResponse>>(
    API_CONFIG.ENDPOINTS.AUTH.LOGIN,
    credentials
  ).then((res) => res.data.data!);
};

/**
 * Register new user
 */
export const register = async (
  data: RegisterData
): Promise<AuthResponse> => {
  return post<APIResponse<AuthResponse>>(
    API_CONFIG.ENDPOINTS.AUTH.REGISTER,
    data
  ).then((res) => res.data.data!);
};

/**
 * Logout user
 */
export const logout = async (): Promise<void> => {
  return post<APIResponse<{ message: string }>>(
    API_CONFIG.ENDPOINTS.AUTH.LOGOUT
  ).then(() => undefined);
};

/**
 * Refresh access token
 */
export const refreshToken = async (
  refreshToken: string
): Promise<{ accessToken: string }> => {
  return post<APIResponse<{ accessToken: string; message: string }>>(
    API_CONFIG.ENDPOINTS.AUTH.REFRESH,
    { refreshToken }
  ).then((res) => ({ accessToken: res.data.data!.accessToken }));
};

/**
 * Get current user
 * Fixed: Changed from POST to GET to match backend route definition
 */
export const getCurrentUser = async (): Promise<User> => {
  return get<APIResponse<{ user: User }>>(
    API_CONFIG.ENDPOINTS.AUTH.ME
  ).then((res) => res.data.data!.user);
};

/**
 * Request password reset
 */
export const forgotPassword = async (
  data: ForgotPasswordData
): Promise<{ message: string }> => {
  return post<APIResponse<{ message: string }>>(
    API_CONFIG.ENDPOINTS.AUTH.FORGOT_PASSWORD,
    data
  ).then((res) => ({ message: res.data.data?.message || res.data.message || 'Password reset email sent' }));
};

/**
 * Reset password with token
 */
export const resetPassword = async (
  data: ResetPasswordData
): Promise<{ message: string }> => {
  return post<APIResponse<{ message: string }>>(
    API_CONFIG.ENDPOINTS.AUTH.RESET_PASSWORD,
    data
  ).then((res) => ({ message: res.data.data?.message || res.data.message || 'Password reset successful' }));
};

/**
 * Verify email with token
 */
export const verifyEmail = async (
  data: VerifyEmailData
): Promise<{ message: string }> => {
  return post<APIResponse<{ message: string }>>(
    API_CONFIG.ENDPOINTS.AUTH.VERIFY_EMAIL,
    data
  ).then((res) => ({ message: res.data.data?.message || res.data.message || 'Email verified successfully' }));
};