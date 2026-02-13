/**
 * API Service
 * 
 * Configured axios instance for API requests with authentication.
 */

import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '@/store/auth';
import { API_URL } from '@/constants/config';

/**
 * Create axios instance
 */
export const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Request interceptor - Add auth token
 */
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = useAuthStore.getState().token;
    
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Response interceptor - Handle token refresh
 */
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // If 401 and not already retrying, try to refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = useAuthStore.getState().refreshToken;
        
        if (!refreshToken) {
          throw new Error('No refresh token');
        }

        // Call refresh token endpoint
        const { data } = await axios.post(`${API_URL}/api/v1/auth/refresh`, {
          refreshToken,
        });

        const { token, refreshToken: newRefreshToken, user } = data.data;

        // Update stored auth
        await useAuthStore.getState().setAuth(user, token, newRefreshToken);

        // Retry original request with new token
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${token}`;
        }
        
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed, clear auth and redirect to login
        await useAuthStore.getState().clearAuth();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

/**
 * API Error type
 */
export interface ApiError {
  message: string;
  code?: string;
  field?: string;
}

/**
 * Extract error message from API error
 */
export const getErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const apiError = error.response?.data as ApiError | undefined;
    return apiError?.message || error.message || 'An error occurred';
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  return 'An unknown error occurred';
};

/**
 * Check if error is network error
 */
export const isNetworkError = (error: unknown): boolean => {
  if (axios.isAxiosError(error)) {
    return !error.response && error.code === 'ERR_NETWORK';
  }
  return false;
};
