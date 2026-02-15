/**
 * API Types
 * 
 * Type definitions for API responses, errors, pagination,
 * and common request/response patterns.
 */

/**
 * HTTP methods
 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

/**
 * API error structure
 */
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  field?: string; // For field-specific validation errors
  stack?: string; // Only in development
}

/**
 * API response wrapper (discriminated union)
 * Standardized response format for all API endpoints
 * 
 * success: true -> data is guaranteed to exist
 * success: false -> error is guaranteed to exist
 */
export type ApiResponse<T = unknown> =
  | {
      success: true;
      data: T;
      timestamp: string;
      message?: string;
    }
  | {
      success: false;
      error: ApiError;
      timestamp: string;
      message?: string;
    };

/**
 * Validation error
 */
export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

/**
 * API error response
 */
export interface ApiErrorResponse {
  success: false;
  error: ApiError;
  validationErrors?: ValidationError[];
  timestamp: string;
}

/**
 * Paginated response wrapper
 */
export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: PaginationMeta;
  timestamp: string;
}

/**
 * Pagination metadata
 */
export interface PaginationMeta {
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

/**
 * Cursor-based pagination metadata
 */
export interface CursorPaginationMeta {
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  startCursor?: string;
  endCursor?: string;
  total?: number;
}

/**
 * Cursor-based paginated response
 */
export interface CursorPaginatedResponse<T> {
  success: boolean;
  data: T[];
  pageInfo: CursorPaginationMeta;
  timestamp: string;
}

/**
 * Pagination query parameters
 */
export interface PaginationParams {
  page?: number;
  perPage?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Cursor pagination parameters
 */
export interface CursorPaginationParams {
  first?: number;
  after?: string;
  last?: number;
  before?: string;
}

/**
 * Common sort options
 */
export interface SortOptions {
  field: string;
  direction: 'asc' | 'desc';
}

/**
 * Date range filter
 */
export interface DateRangeFilter {
  start?: Date;
  end?: Date;
}

/**
 * Search query parameters
 */
export interface SearchParams {
  query: string;
  fields?: string[]; // Fields to search in
  fuzzy?: boolean;
  caseSensitive?: boolean;
}

/**
 * Bulk operation request
 */
export interface BulkOperationRequest<T = string> {
  ids: T[];
  action: string;
  data?: Record<string, unknown>;
}

/**
 * Bulk operation response
 */
export interface BulkOperationResponse {
  success: boolean;
  processed: number;
  failed: number;
  errors?: Array<{
    id: string;
    error: string;
  }>;
}

/**
 * File upload response
 */
export interface FileUploadResponse {
  success: boolean;
  file: {
    id: string;
    filename: string;
    originalFilename: string;
    url: string;
    size: number;
    mimeType: string;
    uploadedAt: string;
  };
}

/**
 * API request configuration
 */
export interface ApiRequestConfig {
  method: HttpMethod;
  url: string;
  headers?: Record<string, string>;
  params?: Record<string, string | number | boolean>;
  data?: unknown;
  timeout?: number;
  withCredentials?: boolean;
}

/**
 * Rate limit information
 */
export interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: number; // Unix timestamp
  retryAfter?: number; // Seconds until reset
}

/**
 * Health check response
 */
export interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  version: string;
  uptime: number;
  timestamp: string;
  services: {
    database: 'up' | 'down';
    redis: 'up' | 'down';
    storage: 'up' | 'down';
  };
}

/**
 * API version information
 */
export interface ApiVersionInfo {
  version: string;
  releaseDate: string;
  deprecationDate?: string;
  supportedUntil?: string;
  changelog?: string;
}

/**
 * Webhook payload
 */
export interface WebhookPayload {
  id: string;
  event: string;
  timestamp: string;
  data: Record<string, unknown>;
  signature?: string;
}

/**
 * Export request
 */
export interface ExportRequest {
  format: 'csv' | 'xlsx' | 'json' | 'pdf';
  filters?: Record<string, unknown>;
  fields?: string[];
  includeHeaders?: boolean;
}

/**
 * Export response
 */
export interface ExportResponse {
  success: boolean;
  exportId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  downloadUrl?: string;
  expiresAt?: string;
}

/**
 * Common error codes
 */
export enum ErrorCode {
  // Authentication & Authorization
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  TOKEN_INVALID = 'TOKEN_INVALID',
  
  // Validation
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  REQUIRED_FIELD_MISSING = 'REQUIRED_FIELD_MISSING',
  
  // Resource
  NOT_FOUND = 'NOT_FOUND',
  ALREADY_EXISTS = 'ALREADY_EXISTS',
  CONFLICT = 'CONFLICT',
  
  // Rate Limiting
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',
  
  // Server
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  DATABASE_ERROR = 'DATABASE_ERROR',
  
  // Business Logic
  OPERATION_FAILED = 'OPERATION_FAILED',
  INVALID_STATE = 'INVALID_STATE',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
}

/**
 * HTTP status codes
 */
export enum HttpStatus {
  OK = 200,
  CREATED = 201,
  ACCEPTED = 202,
  NO_CONTENT = 204,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  CONFLICT = 409,
  UNPROCESSABLE_ENTITY = 422,
  TOO_MANY_REQUESTS = 429,
  INTERNAL_SERVER_ERROR = 500,
  SERVICE_UNAVAILABLE = 503,
}

/**
 * Helper to create success response
 */
export const createSuccessResponse = <T>(
  data: T,
  message?: string
): ApiResponse<T> => {
  return {
    success: true,
    data,
    message,
    timestamp: new Date().toISOString(),
  };
};

/**
 * Helper to create error response
 */
export const createErrorResponse = (
  code: string,
  message: string,
  details?: Record<string, unknown>
): ApiErrorResponse => {
  return {
    success: false,
    error: {
      code,
      message,
      details,
    },
    timestamp: new Date().toISOString(),
  };
};

/**
 * Helper to create paginated response
 */
export const createPaginatedResponse = <T>(
  data: T[],
  page: number,
  perPage: number,
  total: number
): PaginatedResponse<T> => {
  const totalPages = Math.ceil(total / perPage);
  
  return {
    success: true,
    data,
    pagination: {
      page,
      perPage,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    },
    timestamp: new Date().toISOString(),
  };
};

/**
 * Helper to extract pagination params with defaults
 */
export const extractPaginationParams = (
  params: Partial<PaginationParams>
): Required<PaginationParams> => {
  return {
    page: params.page && params.page > 0 ? params.page : 1,
    perPage: params.perPage && params.perPage > 0 && params.perPage <= 100 
      ? params.perPage 
      : 20,
    sortBy: params.sortBy || 'createdAt',
    sortOrder: params.sortOrder || 'desc',
  };
};

/**
 * Type guard to check if response is error
 */
export const isApiError = (response: unknown): response is ApiErrorResponse => {
  return (
    typeof response === 'object' &&
    response !== null &&
    'success' in response &&
    response.success === false &&
    'error' in response
  );
};

/**
 * Type guard to check if response is success
 */
export const isApiSuccess = <T>(response: unknown): response is ApiResponse<T> => {
  return (
    typeof response === 'object' &&
    response !== null &&
    'success' in response &&
    response.success === true
  );
};
