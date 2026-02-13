/**
 * API Service
 * 
 * Axios-based HTTP client with request/response interceptors,
 * token management, and error handling.
 */

import axios, {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios';
import { API_CONFIG, STORAGE_KEYS } from './config';
import { useAuthStore } from '@/store/auth';

/**
 * API Error Response
 */
export interface ApiError {
  message: string;
  code?: string;
  statusCode?: number;
  errors?: Record<string, string[]>;
}

/**
 * API Response wrapper
 */
export interface ApiResponse<T = unknown> {
  data: T;
  message?: string;
  meta?: {
    page?: number;
    perPage?: number;
    total?: number;
    totalPages?: number;
  };
}

/**
 * Create axios instance
 */
const createApiInstance = (): AxiosInstance => {
  const instance = axios.create({
    baseURL: API_CONFIG.BASE_URL,
    timeout: API_CONFIG.TIMEOUT,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Request interceptor - Add auth token
  instance.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      // Get token from localStorage
      const token =
        typeof window !== 'undefined'
          ? localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)
          : null;

      // Add token to headers if available
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      return config;
    },
    (error: AxiosError) => {
      return Promise.reject(error);
    }
  );

  // Response interceptor - Handle errors and token refresh
  instance.interceptors.response.use(
    (response: AxiosResponse) => {
      return response;
    },
    async (error: AxiosError<ApiError>) => {
      const originalRequest = error.config as InternalAxiosRequestConfig & {
        _retry?: boolean;
      };

      // Handle 401 Unauthorized - Token expired
      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;

        try {
          // Get refresh token
          const refreshToken =
            typeof window !== 'undefined'
              ? localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN)
              : null;

          if (!refreshToken) {
            // No refresh token, logout
            useAuthStore.getState().clearAuth();
            if (typeof window !== 'undefined') {
              window.location.href = '/auth/login';
            }
            return Promise.reject(error);
          }

          // Request new access token
          const response = await axios.post<
            ApiResponse<{ accessToken: string }>
          >(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.AUTH.REFRESH}`, {
            refreshToken,
          });

          const { accessToken } = response.data.data;

          // Save new token
          if (typeof window !== 'undefined') {
            localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
          }

          // Retry original request with new token
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          }
          return instance(originalRequest);
        } catch (refreshError) {
          // Refresh failed, logout
          useAuthStore.getState().clearAuth();
          if (typeof window !== 'undefined') {
            window.location.href = '/auth/login';
          }
          return Promise.reject(refreshError);
        }
      }

      // Handle other errors
      return Promise.reject(error);
    }
  );

  return instance;
};

/**
 * API instance
 */
export const api = createApiInstance();

/**
 * Get error message from API error
 */
export const getErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const apiError = error.response?.data as ApiError | undefined;
    
    // Return API error message if available
    if (apiError?.message) {
      return apiError.message;
    }

    // Return validation errors if available
    if (apiError?.errors) {
      const firstError = Object.values(apiError.errors)[0];
      if (firstError && firstError[0]) {
        return firstError[0];
      }
    }

    // Return generic error based on status code
    if (error.response?.status) {
      switch (error.response.status) {
        case 400:
          return 'Bad request. Please check your input.';
        case 401:
          return 'Unauthorized. Please login again.';
        case 403:
          return 'Forbidden. You do not have permission.';
        case 404:
          return 'Resource not found.';
        case 500:
          return 'Server error. Please try again later.';
        case 503:
          return 'Service unavailable. Please try again later.';
        default:
          return 'An unexpected error occurred.';
      }
    }

    // Network error
    if (error.message === 'Network Error') {
      return 'Network error. Please check your connection.';
    }

    // Timeout error
    if (error.code === 'ECONNABORTED') {
      return 'Request timeout. Please try again.';
    }
  }

  // Unknown error
  if (error instanceof Error) {
    return error.message;
  }

  return 'An unexpected error occurred.';
};

/**
 * Type-safe API request helper
 */
export const request = async <T = unknown>(
  config: AxiosRequestConfig
): Promise<T> => {
  try {
    const response = await api.request<ApiResponse<T>>(config);
    return response.data.data;
  } catch (error) {
    throw error;
  }
};

/**
 * GET request helper
 */
export const get = async <T = unknown>(
  url: string,
  config?: AxiosRequestConfig
): Promise<T> => {
  return request<T>({ ...config, method: 'GET', url });
};

/**
 * POST request helper
 */
export const post = async <T = unknown>(
  url: string,
  data?: unknown,
  config?: AxiosRequestConfig
): Promise<T> => {
  return request<T>({ ...config, method: 'POST', url, data });
};

/**
 * PUT request helper
 */
export const put = async <T = unknown>(
  url: string,
  data?: unknown,
  config?: AxiosRequestConfig
): Promise<T> => {
  return request<T>({ ...config, method: 'PUT', url, data });
};

/**
 * PATCH request helper
 */
export const patch = async <T = unknown>(
  url: string,
  data?: unknown,
  config?: AxiosRequestConfig
): Promise<T> => {
  return request<T>({ ...config, method: 'PATCH', url, data });
};

/**
 * DELETE request helper
 */
export const del = async <T = unknown>(
  url: string,
  config?: AxiosRequestConfig
): Promise<T> => {
  return request<T>({ ...config, method: 'DELETE', url });
};
