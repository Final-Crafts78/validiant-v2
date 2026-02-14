/**
 * Mobile API Client - JWT Token Management
 * 
 * Axios client configured for mobile JWT authentication.
 * 
 * CRITICAL FEATURES:
 * - Automatic token injection from SecureStore
 * - Automatic token refresh on 401
 * - Retry failed requests after refresh
 * 
 * AUTHENTICATION FLOW:
 * 1. User logs in → Backend returns { accessToken, refreshToken }
 * 2. Mobile saves tokens to SecureStore (encrypted)
 * 3. All API requests automatically inject: Authorization: Bearer <accessToken>
 * 4. If 401 → Try refresh token → Get new accessToken → Retry request
 * 5. If refresh fails → Logout user
 * 
 * TOKEN REFRESH FLOW:
 * ```
 * API Request (401)
 *   ↓
 * Get refreshToken from SecureStore
 *   ↓
 * POST /api/v1/auth/refresh with Bearer <refreshToken>
 *   ↓
 * Backend returns { accessToken }
 *   ↓
 * Save new accessToken to SecureStore
 *   ↓
 * Retry original request with new accessToken
 * ```
 * 
 * SECURITY:
 * - Tokens stored in SecureStore (hardware-backed encryption)
 * - No tokens in AsyncStorage or memory
 * - Automatic token rotation
 * - Token denylist (backend Redis)
 */

import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import Constants from 'expo-constants';
import {
  getAccessToken,
  getRefreshToken,
  saveAccessToken,
  clearTokens,
} from '../utils/storage';

/**
 * API Configuration
 */
const API_BASE_URL = Constants.expoConfig?.extra?.apiUrl || 'http://localhost:3001';
const API_TIMEOUT = 30000; // 30 seconds

/**
 * API Error Interface
 */
export interface APIError {
  success: false;
  error: string;
  message: string;
  statusCode: number;
  details?: any;
}

/**
 * API Success Response Interface
 */
export interface APIResponse<T = any> {
  success: true;
  data?: T;
  message?: string;
  pagination?: {
    total: number;
    page: number;
    perPage: number;
    totalPages: number;
  };
}

/**
 * Create Axios Instance
 * 
 * Note: Does NOT set withCredentials (cookies not used in mobile)
 */
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
  // No withCredentials - mobile uses JWT tokens, not cookies
});

/**
 * Flag to prevent infinite refresh loops
 */
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: any) => void;
  reject: (reason?: any) => void;
}> = [];

/**
 * Process queued requests after token refresh
 */
const processQueue = (error: any = null, token: string | null = null) => {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else {
      promise.resolve(token);
    }
  });
  failedQueue = [];
};

/**
 * Request Interceptor - Inject JWT Token
 * 
 * Retrieves accessToken from SecureStore and adds to Authorization header.
 */
apiClient.interceptors.request.use(
  async (config) => {
    // Get access token from SecureStore
    const accessToken = await getAccessToken();

    // Inject token into Authorization header
    if (accessToken && config.headers) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    // Log requests in development
    if (__DEV__) {
      console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`);
    }

    return config;
  },
  (error) => {
    console.error('[API] Request error:', error);
    return Promise.reject(error);
  }
);

/**
 * Response Interceptor - Handle 401 with Auto-Refresh
 * 
 * If request fails with 401:
 * 1. Try to refresh token
 * 2. Retry original request with new token
 * 3. If refresh fails, logout user
 */
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    // Return successful response
    return response;
  },
  async (error: AxiosError<APIError>) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

    // Handle network errors
    if (!error.response) {
      console.error('[API] Network error:', error.message);
      return Promise.reject({
        success: false,
        error: 'NetworkError',
        message: 'Unable to connect to server. Please check your internet connection.',
        statusCode: 0,
      } as APIError);
    }

    const { response } = error;
    const statusCode = response.status;

    // Handle 401 (Unauthorized) - Try to refresh token
    if (statusCode === 401 && !originalRequest._retry) {
      // Prevent refresh endpoint itself from triggering refresh
      if (originalRequest.url?.includes('/auth/refresh')) {
        // Refresh failed, logout user
        console.error('[API] Refresh token expired, logging out');
        await clearTokens();
        // TODO: Navigate to login screen
        return Promise.reject(error.response.data);
      }

      // If already refreshing, queue this request
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return apiClient(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Get refresh token from SecureStore
        const refreshToken = await getRefreshToken();

        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        // Call refresh endpoint with refresh token in Authorization header
        const refreshResponse = await axios.post<APIResponse<{ accessToken: string }>>(
          `${API_BASE_URL}/api/v1/auth/refresh`,
          {},
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${refreshToken}`,
            },
          }
        );

        const { accessToken: newAccessToken } = refreshResponse.data.data!;

        // Save new access token to SecureStore
        await saveAccessToken(newAccessToken);

        // Update Authorization header
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        }

        // Process queued requests with new token
        processQueue(null, newAccessToken);

        // Retry original request with new token
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh failed, logout user
        console.error('[API] Token refresh failed:', refreshError);
        processQueue(refreshError, null);
        await clearTokens();
        // TODO: Navigate to login screen
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Handle permission errors (403)
    if (statusCode === 403) {
      console.error('[API] Permission denied:', response.data?.message);
    }

    // Handle server errors (500+)
    if (statusCode >= 500) {
      console.error('[API] Server error:', response.data?.message);
    }

    // Return structured error
    const apiError: APIError = {
      success: false,
      error: response.data?.error || 'UnknownError',
      message: response.data?.message || error.message || 'An unexpected error occurred',
      statusCode,
      details: response.data?.details,
    };

    return Promise.reject(apiError);
  }
);

/**
 * API Request Helper Functions
 */

/**
 * GET request
 */
export const get = <T = any>(
  url: string,
  config?: AxiosRequestConfig
): Promise<AxiosResponse<T>> => {
  return apiClient.get<T>(url, config);
};

/**
 * POST request
 */
export const post = <T = any, D = any>(
  url: string,
  data?: D,
  config?: AxiosRequestConfig
): Promise<AxiosResponse<T>> => {
  return apiClient.post<T>(url, data, config);
};

/**
 * PUT request
 */
export const put = <T = any, D = any>(
  url: string,
  data?: D,
  config?: AxiosRequestConfig
): Promise<AxiosResponse<T>> => {
  return apiClient.put<T>(url, data, config);
};

/**
 * PATCH request
 */
export const patch = <T = any, D = any>(
  url: string,
  data?: D,
  config?: AxiosRequestConfig
): Promise<AxiosResponse<T>> => {
  return apiClient.patch<T>(url, data, config);
};

/**
 * DELETE request
 */
export const del = <T = any>(
  url: string,
  config?: AxiosRequestConfig
): Promise<AxiosResponse<T>> => {
  return apiClient.delete<T>(url, config);
};

/**
 * Export configured client for custom requests
 */
export default apiClient;

/**
 * Type guard to check if error is APIError
 */
export const isAPIError = (error: any): error is APIError => {
  return error && typeof error === 'object' && 'success' in error && error.success === false;
};

/**
 * Get error message from any error type
 */
export const getErrorMessage = (error: any): string => {
  if (isAPIError(error)) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unexpected error occurred';
};
