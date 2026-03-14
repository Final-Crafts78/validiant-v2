import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { secureStore } from './secure-store';

/**
 * Mobile API Client
 *
 * Configured with a token refresh interceptor to prevent session loss for field workers.
 */
const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001/api/v1',
  timeout: 30000,
});

// Request Interceptor: Attach access token
api.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const token = await secureStore.getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response Interceptor: Handle 401 & Token Refresh
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as any;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = await secureStore.getRefreshToken();
        if (!refreshToken) throw new Error('No refresh token available');

        // Call refresh endpoint
        const { data } = await axios.post(
          `${api.defaults.baseURL}/auth/refresh`,
          {},
          {
            headers: { Authorization: `Bearer ${refreshToken}` },
          }
        );

        const { accessToken } = data.data;

        // Save new token
        await secureStore.saveAccessToken(accessToken);

        // Retry original request
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed (e.g. refresh token expired)
        await secureStore.clearAll();
        // Redirect to login should be handled by the auth store/guard
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
