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
  OrganizationMemberWithUser,
} from '@validiant/shared';
import { useAuthStore } from '../store/auth';
import { useWorkspaceStore } from '../store/workspace';
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
    // 0. INITIATION LOG (Finding 61 - Trace context)
    const stack = new Error().stack?.split('\n').slice(2, 6).join('\n');
    console.groupCollapsed(
      `[API:Initiate] ${config.method?.toUpperCase()} ${config.url}`
    );
    console.log('Context:', {
      url: config.url,
      method: config.method?.toUpperCase(),
      workspaceOrgId: useWorkspaceStore.getState().activeOrgId,
      authOrgId: useAuthStore.getState().user?.activeOrganizationId,
      timestamp: new Date().toISOString(),
    });
    console.log('Call Stack:\n', stack);
    console.groupEnd();

    // 1. INJECT ORGANIZATION CONTEXT (X-Org-Id)
    // We check both the AuthStore and the WorkspaceStore.
    // useWorkspaceStore is the primary 'Context' for the active UI view.
    // useAuthStore.user.activeOrganizationId is the default from the user profile.
    const fromAuthStore = useAuthStore.getState().user?.activeOrganizationId;
    const fromWorkspaceStore = useWorkspaceStore.getState().activeOrgId;

    const activeOrgId = fromWorkspaceStore || fromAuthStore;

    // Also check if it's already explicitly set in the request (don't override)
    const existingOrgId = config.headers?.['X-Org-Id'];

    if (activeOrgId && !existingOrgId) {
      if (!config.headers) config.headers = {} as any;
      config.headers['X-Org-Id'] = activeOrgId;
    }

    // 2. LOGGING (ALWAYS log in production for now for maximum visibility)
    const finalOrgId = config.headers?.['X-Org-Id'];

    // URL CONSTRUCTION TRACE
    // getBaseUrl() ends with /api/v1
    const baseURL = config.baseURL?.replace(/\/+$/, '') || '';

    // 🔒 SAFETY FILTER: Strip redundant prefixes from the relative URL
    let relativePart = config.url || '';

    // Remove leading /api/v1 or api/v1 multiple times if they exist
    relativePart = relativePart.replace(/^(\/api\/v1)+/g, '');

    // Ensure it starts with a slash
    if (!relativePart.startsWith('/')) {
      relativePart = '/' + relativePart;
    }

    // Update config URL to the relative part
    config.url = relativePart;

    const finalFullURL = `${baseURL}${relativePart}`.replace(
      /\/api\/v1\/api\/v1/g,
      '/api/v1'
    );

    // 🚩 DOUBLE PREFIX DETECTION (Sanity Check)
    const isDoublePrefixed = finalFullURL.includes('/api/v1/api/v1');

    const authStoreState = useAuthStore.getState();

    logger.debug(
      `[API:Request] ${config.method?.toUpperCase()} ${config.url}`,
      {
        finalFullURL,
        method: config.method?.toUpperCase(),
        potentialDoublePrefix: isDoublePrefixed,
        baseURL: config.baseURL,
        urlPath: config.url,
        hasOrgId: !!finalOrgId,
        orgId: finalOrgId || 'MISSING',
        orgIdSource: existingOrgId
          ? 'explicit-header'
          : fromWorkspaceStore
            ? 'workspace-store'
            : fromAuthStore
              ? 'auth-store'
              : 'none',
        storeValues: {
          fromWorkspace: fromWorkspaceStore || 'null',
          fromAuth: fromAuthStore || 'null',
        },
        authStore: {
          isAuthenticated: authStoreState.isAuthenticated,
          hasUser: !!authStoreState.user,
          userActiveOrgId:
            authStoreState.user?.activeOrganizationId || 'MISSING',
        },
        workspaceStore: {
          activeOrgId: fromWorkspaceStore || 'MISSING',
        },
        timestamp: new Date().toISOString(),
        headers: {
          ...config.headers,
          'X-Org-Id': config.headers?.['X-Org-Id'] || 'MISSING',
          'User-Agent':
            typeof window !== 'undefined'
              ? window.navigator.userAgent
              : 'SERVER',
          Referer:
            typeof window !== 'undefined' ? window.location.href : 'NONE',
        },
      }
    );

    // 🚩 DOUBLE PREFIX ALERT
    if (isDoublePrefixed) {
      console.error('[API:CRITICAL] Double /api/v1 detected in request!', {
        url: config.url,
        finalFullURL,
        baseURL: config.baseURL,
        stack: new Error().stack?.split('\n').slice(1, 4),
      });
    }

    // ELITE: Request Snapshot
    logger.debug(`[API:Snapshot] ${config.method?.toUpperCase()} Outgoing`, {
      url: config.url,
      finalFullURL,
      headers: { ...config.headers },
      params: config.params,
      hasData: !!config.data,
      timestamp: new Date().toISOString(),
    });

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
 * - 401: Clear Zustand auth state, then redirect to /api/auth/session-expired
 * - 403: Show permission error
 * - 500: Show server error
 */
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    // 2. SUCCESS LOGGING
    logger.debug(
      `[API:Success] ${response.status} ${response.config.method?.toUpperCase()} ${response.config.url}`,
      {
        status: response.status,
        statusText: response.statusText,
        url: response.config.url,
        method: response.config.method?.toUpperCase(),
        hasData: !!response.data,
        dataSummary:
          typeof response.data === 'object'
            ? Object.keys(response.data || {})
            : 'primitive',
        timestamp: new Date().toISOString(),
      }
    );
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

    // ELITE: Response Error Detail
    logger.error(
      `[API:Error] ${statusCode} ${error.config?.method?.toUpperCase()} ${error.config?.url}`,
      {
        status: statusCode,
        data: response.data,
        headers: response.headers,
        config: {
          url: error.config?.url,
          baseURL: error.config?.baseURL,
          method: error.config?.method,
          headers: error.config?.headers,
        },
        timestamp: new Date().toISOString(),
      }
    );

    // Handle authentication errors (401)
    if (statusCode === 401) {
      const isAlreadyOnAuthPage =
        typeof window !== 'undefined' &&
        (window.location.pathname.includes('/auth/') ||
          window.location.pathname.includes('/api/auth/session-expired'));

      const fullUrl = error.config?.url
        ? error.config.baseURL
          ? `${error.config.baseURL}${error.config.url}`
          : error.config.url
        : 'UNKNOWN';

      logger.warn('[Axios:401] FULL CONTEXT', {
        url: error.config?.url,
        fullUrl,
        baseURL: error.config?.baseURL,
        method: error.config?.method,
        status: response?.status,
        statusText: response?.statusText,
        errorBody: response?.data, // CRITICAL: Log the actual error from backend
        pathname:
          typeof window !== 'undefined' ? window.location.pathname : 'SERVER',
        isAlreadyOnAuthPage,
        requestHeaders: error.config?.headers,
        responseHeaders: response?.headers,
        timestamp: new Date().toISOString(),
      });

      // COOKIE CHECK (names only for security)
      if (typeof window !== 'undefined') {
        const cookieNames = document.cookie
          .split(';')
          .map((c) => c.split('=')[0]?.trim() || 'UNKNOWN');
        logger.debug('[Axios:401] COOKIE CHECK', {
          cookieNames,
          withCredentials: error.config?.withCredentials,
          cookieRawCount: cookieNames.length,
          userAgent: window.navigator.userAgent,
        });

        // Check if we're not already on an auth page or session-expired to avoid redirect loop
        if (!isAlreadyOnAuthPage) {
          // CRITICAL: Determine if this 401 should trigger a full session expiry
          // We only logout if a core identity or organization check fails.
          // Secondary endpoints (like notifications) might fail 401 if orgId is missing
          // during onboarding, but that shouldn't kill the whole session.
          const criticalPaths = [
            '/auth/me',
            '/organizations/my',
            '/users/me',
            '/projects/my',
            '/tasks/my',
          ];

          const isCriticalRequest = criticalPaths.some((path) =>
            fullUrl.includes(path)
          );

          if (!isCriticalRequest) {
            logger.warn(
              '[Axios:401] Non-critical 401 detected. Skipping session expiry.',
              {
                url: fullUrl,
                suggestion:
                  'This might be a background task failing due to missing organization context during onboarding.',
              }
            );
            return Promise.reject(error);
          }

          logger.warn(
            '[Axios:401] REDIRECT DECISION: Redirecting to session-expired...',
            {
              from: window.location.pathname,
              target: `${window.location.origin}/api/auth/session-expired`,
              triggeringUrl: fullUrl,
            }
          );

          const authStateBefore = useAuthStore.getState().isAuthenticated;

          // CRITICAL FIX: Clear Zustand auth state before redirecting.
          useAuthStore.getState().clearAuth();

          const authStateAfter = useAuthStore.getState().isAuthenticated;

          logger.debug('[Axios:401] ZUSTAND STATE CLEARED', {
            before: authStateBefore,
            after: authStateAfter,
          });

          const targetUrl = `/api/auth/session-expired?reason=expired&forceLogout=true&redirect=${encodeURIComponent(
            window.location.pathname
          )}`;

          logger.info(
            '[Axios:401] [EP-AUTH-FAIL] Redirecting to session-expired',
            {
              href: targetUrl,
              isCritical: isCriticalRequest,
              authStateBefore,
              authStateAfter,
              timestamp: new Date().toISOString(),
            }
          );

          // Redirect to session-expired handler to clear HttpOnly cookies
          window.location.href = targetUrl;
        } else {
          logger.debug('[Axios:401] REDIRECT SKIPPED', {
            reason: 'Already on auth page or session-expired',
            pathname: window.location.pathname,
            triggeringUrl: fullUrl,
          });
        }
      }
    }

    // Handle permission errors (403)
    if (statusCode === 403) {
      logger.error('[API:403] Permission denied', {
        url: error.config?.url,
        message: response.data?.message,
        errorBody: response.data,
        headers: response.headers,
        timestamp: new Date().toISOString(),
      });
    }

    // Handle server errors (500+)
    if (statusCode >= 500) {
      logger.error('[API:500] Server error', {
        url: error.config?.url,
        status: statusCode,
        message: response.data?.message,
        errorBody: response.data,
        headers: response.headers,
        timestamp: new Date().toISOString(),
      });
    }

    // Handle bad requests (400) - For validation errors
    if (statusCode === 400) {
      logger.error('[API:400] Bad Request / Validation Failure', {
        url: error.config?.url,
        fullUrl: error.config?.url
          ? error.config.baseURL
            ? `${error.config.baseURL}${error.config.url}`
            : error.config.url
          : 'UNKNOWN',
        status: statusCode,
        message: response.data?.message,
        errorBody: response.data,
        validationErrors: response.data?.details || response.data?.error,
        headers: response.headers,
        timestamp: new Date().toISOString(),
      });
    }

    // 🚩 GHOST ROUTE TRACING (404)
    if (statusCode === 404) {
      console.warn('[API:404] GHOST ROUTE DETECTED', {
        url: error.config?.url,
        method: error.config?.method?.toUpperCase(),
        referer:
          typeof window !== 'undefined' ? window.location.href : 'SERVER',
        headers: error.config?.headers,
        timestamp: new Date().toISOString(),
      });
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
    avatarUrl?: string;
  }): Promise<AxiosResponse<APIResponse<unknown>>> =>
    put<APIResponse<unknown>>('/users/me', data),

  /** Upload a profile picture */
  uploadAvatar: (
    file: File
  ): Promise<AxiosResponse<APIResponse<{ avatarUrl: string }>>> => {
    const formData = new FormData();
    formData.append('avatar', file);
    return post<APIResponse<{ avatarUrl: string }>>('/users/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
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
  ): Promise<
    AxiosResponse<APIResponse<{ members: OrganizationMemberWithUser[] }>>
  > =>
    get<APIResponse<{ members: OrganizationMemberWithUser[] }>>(
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

// ---------------------------------------------------------------------------
// Analytics API Service
// ---------------------------------------------------------------------------

export const analyticsApi = {
  /** Fetch the latest materialized metrics for the current organization */
  getLatest: (): Promise<
    AxiosResponse<APIResponse<{ data: any; recordedAt: string }>>
  > => get<APIResponse<{ data: any; recordedAt: string }>>('/analytics/latest'),

  /** Fetch metric history for the current organization */
  getHistory: (
    days: number = 7
  ): Promise<
    AxiosResponse<APIResponse<{ data: { metrics: any; recordedAt: string }[] }>>
  > =>
    get<APIResponse<{ data: { metrics: any; recordedAt: string }[] }>>(
      `/analytics/history?days=${days}`
    ),
};

// ---------------------------------------------------------------------------
// Activity (Audit Log) API Service
// ---------------------------------------------------------------------------

export const activityApi = {
  /** Fetch paginated audit logs */
  getLogs: (
    page: number = 1,
    limit: number = 50
  ): Promise<
    AxiosResponse<
      APIResponse<{ data: any[]; meta: { page: number; limit: number } }>
    >
  > => get(`/activity?page=${page}&limit=${limit}`),

  /** Get the download URL for CSV export */
  getExportUrl: (): string => {
    // getBaseUrl() returns '.../api/v1'
    const baseUrl = getBaseUrl().replace(/\/+$/, '');

    // 🔒 CRITICAL: Prevent double /api/v1 prefix
    // If we're appending a path that is already relative to the API root,
    // we should just append it.
    const finalUrl = `${baseUrl}/activity/export`.replace(
      /\/api\/v1\/api\/v1/,
      '/api/v1'
    );

    console.debug('[API:getExportUrl] Generated URL', {
      baseUrl,
      finalUrl,
      isDoublePrefixed: finalUrl.includes('/api/v1/api/v1'),
      timestamp: new Date().toISOString(),
    });

    return finalUrl;
  },
};
