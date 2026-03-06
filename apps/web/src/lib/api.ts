/**
 * API Client Configuration - HttpOnly Cookie Hardened
 *
 * Axios client configured for HttpOnly cookie authentication.
 *
 * CRITICAL SECURITY FEATURE:
 * - withCredentials: true enables automatic cookie sending/receiving
 * - JWTs are stored in HttpOnly cookies (XSS immune)
 * - Frontend JavaScript CANNOT read the tokens
 * - Authentication state determined via /api/v1/auth/me endpoint
 *
 * Authentication Flow:
 * 1. User logs in → Backend sets HttpOnly cookies
 * 2. All subsequent requests automatically include cookies
 * 3. Frontend calls /auth/me to get user data
 * 4. No manual token management needed
 *
 * Edge-Compatible:
 * - Works with Cloudflare Workers backend
 * - Supports all modern browsers
 * - React Native compatible (with cookie manager)
 */

import axios, {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
} from 'axios';
import type {
  Task,
  Project,
  CreateTaskData,
  UpdateTaskData,
  CreateProjectData,
  UpdateProjectData,
  Organization,
  CreateOrganizationData,
  UpdateOrganizationData,
  OrganizationMember,
} from '@validiant/shared';
import { useAuthStore } from '../store/auth';
import { logger } from './logger';

/**
 * API Configuration with URL Normalization
 * Ensures /api/v1 prefix is present and prevents double prefixes
 */
const getBaseUrl = () => {
  const raw = (
    process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'
  ).replace(/\/+$/, '');
  return raw.endsWith('/api/v1') ? raw : `${raw}/api/v1`;
};

const API_TIMEOUT = 30000; // 30 seconds

/**
 * API Error Interface
 */
export interface APIError {
  success: false;
  error: string;
  message: string;
  statusCode: number;
  details?: unknown;
}

/**
 * API Success Response Interface
 */
export interface APIResponse<T = unknown> {
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
 * Create Axios Instance with HttpOnly Cookie Support
 *
 * CRITICAL: withCredentials: true enables cookie-based auth
 */
const apiClient: AxiosInstance = axios.create({
  baseURL: getBaseUrl(),
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
  // 🔒 CRITICAL: Enable credentials (cookies) for all requests
  withCredentials: true,
});

/**
 * Request Interceptor
 *
 * Logs requests in development.
 * Future: Could add request signing, rate limiting, etc.
 */
apiClient.interceptors.request.use(
  (config) => {
    // Log requests in development
    if (process.env.NODE_ENV === 'development') {
      logger.log(`[API] ${config.method?.toUpperCase()} ${config.url}`);
    }
    return config;
  },
  (error) => {
    logger.error('[API] Request error:', error);
    return Promise.reject(error);
  }
);

/**
 * Response Interceptor
 *
 * Handles errors globally:
 * - 401: Clear Zustand auth state, then redirect to /auth/login (session expired)
 * - 403: Show permission error
 * - 500: Show server error
 */
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    // Return successful response
    return response;
  },
  (error: AxiosError<APIError>) => {
    // Handle network errors
    if (!error.response) {
      logger.error('[API] Network error:', error.message);
      return Promise.reject({
        success: false,
        error: 'NetworkError',
        message:
          'Unable to connect to server. Please check your internet connection.',
        statusCode: 0,
      } as APIError);
    }

    const { response } = error;
    const statusCode = response.status;

    // Handle authentication errors (401)
    if (statusCode === 401) {
      // Check if we're not already on login page to avoid redirect loop
      if (
        typeof window !== 'undefined' &&
        !window.location.pathname.includes('/auth/login')
      ) {
        logger.warn('[API] Authentication required, redirecting to login...');

        // CRITICAL FIX: Clear Zustand auth state before redirecting.
        // Without this, the login page's auth guard sees isAuthenticated=true
        // and immediately redirects back to the dashboard, causing an
        // infinite redirect loop.
        useAuthStore.getState().clearAuth();

        // Redirect to login page
        window.location.href =
          '/auth/login?redirect=' +
          encodeURIComponent(window.location.pathname);
      }
    }

    // Handle permission errors (403)
    if (statusCode === 403) {
      logger.error('[API] Permission denied:', response.data?.message);
    }

    // Handle server errors (500+)
    if (statusCode >= 500) {
      logger.error('[API] Server error:', response.data?.message);
    }

    // Return structured error
    const apiError: APIError = {
      success: false,
      error: response.data?.error || 'UnknownError',
      message:
        response.data?.message ||
        error.message ||
        'An unexpected error occurred',
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
export const get = <T = unknown>(
  url: string,
  config?: AxiosRequestConfig
): Promise<AxiosResponse<T>> => {
  return apiClient.get<T>(url, config);
};

/**
 * POST request
 */
export const post = <T = unknown, D = unknown>(
  url: string,
  data?: D,
  config?: AxiosRequestConfig
): Promise<AxiosResponse<T>> => {
  return apiClient.post<T>(url, data, config);
};

/**
 * PUT request
 */
export const put = <T = unknown, D = unknown>(
  url: string,
  data?: D,
  config?: AxiosRequestConfig
): Promise<AxiosResponse<T>> => {
  return apiClient.put<T>(url, data, config);
};

/**
 * PATCH request
 */
export const patch = <T = unknown, D = unknown>(
  url: string,
  data?: D,
  config?: AxiosRequestConfig
): Promise<AxiosResponse<T>> => {
  return apiClient.patch<T>(url, data, config);
};

/**
 * DELETE request
 */
export const del = <T = unknown>(
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
export const isAPIError = (error: unknown): error is APIError => {
  return (
    typeof error === 'object' &&
    error !== null &&
    'success' in error &&
    (error as Record<string, unknown>).success === false
  );
};

/**
 * Get error message from any error type
 */
export const getErrorMessage = (error: unknown): string => {
  if (isAPIError(error)) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unexpected error occurred';
};

// ---------------------------------------------------------------------------
// Tasks API Service
// ---------------------------------------------------------------------------

/**
 * tasksApi — CRUD operations for Tasks.
 *
 * All methods use the shared Axios instance (withCredentials, interceptors)
 * and are typed against the shared @validiant/shared Task types.
 *
 * Endpoint notes:
 *   getAll   → GET /tasks/my   (user-scoped task list)
 *   getById  → GET /tasks/:id
 *   create   → POST /tasks
 *   update   → PATCH /tasks/:id
 *   delete   → DELETE /tasks/:id
 *
 * Types used:
 *   Task            — full task entity returned by the API
 *   CreateTaskData  — payload for creating a new task
 *   UpdateTaskData  — partial payload for updating an existing task
 */
export const tasksApi = {
  /** Fetch the current user's tasks */
  getAll: (): Promise<AxiosResponse<APIResponse<{ tasks: Task[] }>>> =>
    get<APIResponse<{ tasks: Task[] }>>('/tasks/my'),

  /** Fetch a single task by ID */
  getById: (id: string): Promise<AxiosResponse<APIResponse<Task>>> =>
    get<APIResponse<Task>>(`/tasks/${id}`),

  /** Create a new task */
  create: (data: CreateTaskData): Promise<AxiosResponse<APIResponse<Task>>> =>
    post<APIResponse<Task>>('/tasks', data),

  /** Partially update an existing task */
  update: (
    id: string,
    data: Partial<UpdateTaskData>
  ): Promise<AxiosResponse<APIResponse<Task>>> =>
    patch<APIResponse<Task>>(`/tasks/${id}`, data),

  /** Delete a task by ID */
  delete: (
    id: string
  ): Promise<AxiosResponse<APIResponse<{ success: boolean }>>> =>
    del<APIResponse<{ success: boolean }>>(`/tasks/${id}`),

  /** Update only the status of a task (optimistic-friendly) */
  updateStatus: (
    id: string,
    status: string
  ): Promise<AxiosResponse<APIResponse<Task>>> =>
    patch<APIResponse<Task>>(`/tasks/${id}`, { status }),

  /** Bulk-create tasks from a parsed spreadsheet */
  bulkCreate: (
    projectId: string,
    tasks: Record<string, unknown>[]
  ): Promise<AxiosResponse<APIResponse<{ created: number }>>> =>
    post<APIResponse<{ created: number }>>('/tasks/bulk', { projectId, tasks }),
};

// ---------------------------------------------------------------------------
// Projects API Service
// ---------------------------------------------------------------------------

/**
 * projectsApi — CRUD operations for Projects.
 *
 * Mirrors the structure of tasksApi, pointing to /projects endpoints
 * and typed against the shared @validiant/shared Project types.
 *
 * Types used:
 *   Project            — full project entity returned by the API
 *   CreateProjectData  — payload for creating a new project
 *   UpdateProjectData  — partial payload for updating an existing project
 */
export const projectsApi = {
  /** Fetch all projects */
  getAll: (): Promise<AxiosResponse<APIResponse<{ projects: Project[] }>>> =>
    get<APIResponse<{ projects: Project[] }>>('/projects/my'),

  /** Fetch a single project by ID */
  getById: (id: string): Promise<AxiosResponse<APIResponse<Project>>> =>
    get<APIResponse<Project>>(`/projects/${id}`),

  /** Create a new project */
  create: (
    data: CreateProjectData
  ): Promise<AxiosResponse<APIResponse<Project>>> =>
    post<APIResponse<Project>>('/projects', data),

  /** Partially update an existing project */
  update: (
    id: string,
    data: Partial<UpdateProjectData>
  ): Promise<AxiosResponse<APIResponse<Project>>> =>
    patch<APIResponse<Project>>(`/projects/${id}`, data),

  /** Delete a project by ID */
  delete: (
    id: string
  ): Promise<AxiosResponse<APIResponse<{ success: boolean }>>> =>
    del<APIResponse<{ success: boolean }>>(`/projects/${id}`),

  archive: (id: string): Promise<AxiosResponse<APIResponse<null>>> =>
    post<APIResponse<null>>(`/projects/${id}/archive`),

  unarchive: (id: string): Promise<AxiosResponse<APIResponse<null>>> =>
    post<APIResponse<null>>(`/projects/${id}/unarchive`),

  complete: (id: string): Promise<AxiosResponse<APIResponse<null>>> =>
    post<APIResponse<null>>(`/projects/${id}/complete`),

  leave: (id: string): Promise<AxiosResponse<APIResponse<null>>> =>
    post<APIResponse<null>>(`/projects/${id}/leave`),
};

// ---------------------------------------------------------------------------
// Users API Service
// ---------------------------------------------------------------------------

export const usersApi = {
  /** Update the current user's profile */
  updateProfile: (data: {
    fullName?: string;
    phoneNumber?: string;
    bio?: string;
  }): Promise<AxiosResponse<APIResponse<unknown>>> =>
    put<APIResponse<unknown>>('/users/me', data),
};

// ---------------------------------------------------------------------------
// Passkey API Service (WebAuthn / FIDO2)
// ---------------------------------------------------------------------------

export const passkeyApi = {
  /** Generate passkey registration options (returns challenge) */
  generateOptions: (
    deviceName?: string
  ): Promise<AxiosResponse<APIResponse<unknown>>> =>
    post<APIResponse<unknown>>('/passkey/register/options', { deviceName }),

  /** Verify passkey registration with signed credential */
  verifyRegistration: (data: {
    response: unknown;
    deviceName?: string;
  }): Promise<AxiosResponse<APIResponse<unknown>>> =>
    post<APIResponse<unknown>>('/passkey/register/verify', data),
};

// ---------------------------------------------------------------------------
// Organizations API Service
// ---------------------------------------------------------------------------

export const organizationsApi = {
  getAll: (): Promise<
    AxiosResponse<APIResponse<{ organizations: Organization[] }>>
  > => get<APIResponse<{ organizations: Organization[] }>>('/organizations/my'),

  getById: (id: string): Promise<AxiosResponse<APIResponse<Organization>>> =>
    get<APIResponse<Organization>>(`/organizations/${id}`),

  create: (
    data: CreateOrganizationData
  ): Promise<AxiosResponse<APIResponse<Organization>>> =>
    post<APIResponse<Organization>>('/organizations', data),

  update: (
    id: string,
    data: UpdateOrganizationData
  ): Promise<AxiosResponse<APIResponse<Organization>>> =>
    put<APIResponse<Organization>>(`/organizations/${id}`, data),

  delete: (
    id: string
  ): Promise<AxiosResponse<APIResponse<{ success: boolean }>>> =>
    del<APIResponse<{ success: boolean }>>(`/organizations/${id}`),

  getMembers: (
    id: string
  ): Promise<AxiosResponse<APIResponse<{ members: OrganizationMember[] }>>> =>
    get<APIResponse<{ members: OrganizationMember[] }>>(
      `/organizations/${id}/members`
    ),

  invite: (
    id: string,
    data: { email: string; role: string }
  ): Promise<AxiosResponse<APIResponse<{ inviteUrl: string }>>> =>
    post<APIResponse<{ inviteUrl: string }>>(
      `/organizations/${id}/invites`,
      data
    ),

  getProjects: (
    id: string
  ): Promise<AxiosResponse<APIResponse<{ projects: Project[] }>>> =>
    get<APIResponse<{ projects: Project[] }>>(`/organizations/${id}/projects`),

  acceptInvite: (
    token: string
  ): Promise<AxiosResponse<APIResponse<Organization>>> =>
    post<APIResponse<Organization>>('/organizations/accept-invite', { token }),

  leave: (id: string): Promise<AxiosResponse<APIResponse<null>>> =>
    post<APIResponse<null>>(`/organizations/${id}/leave`),
};
