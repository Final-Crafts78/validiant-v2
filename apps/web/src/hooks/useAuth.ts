/**
 * useAuth Hook - HttpOnly Cookie Authentication
 *
 * Authentication hook that works with HttpOnly cookies.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { get, post } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { queryKeys } from '@/lib/query-keys';
import { logger } from '@/lib/logger';

/**
 * User Interface
 */
export interface User {
  id: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
  emailVerified: boolean;
  twoFactorEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Auth Response from /api/v1/auth/me
 */
interface AuthMeResponse {
  success: true;
  data: {
    user: User;
  };
}

/**
 * Fetch current user from /api/v1/auth/me
 */
const fetchCurrentUser = async (): Promise<User | null> => {
  try {
    logger.debug('[useAuth] Fetching current user...', {
      timestamp: new Date().toISOString(),
      currentPath:
        typeof window !== 'undefined' ? window.location.pathname : 'SERVER',
    });
    const response = await get<AuthMeResponse>('/auth/me');
    logger.debug('[useAuth] Fetch user SUCCESS', {
      userEmail: response.data?.data?.user?.email || 'MISSING',
      userId: response.data?.data?.user?.id || 'MISSING',
      fullResponse: response.data,
      timestamp: new Date().toISOString(),
    });
    return response.data?.data?.user || null;
  } catch (error: unknown) {
    const errorWithStatus = error as {
      statusCode?: number;
      response?: { status?: number; data?: unknown };
      details?: unknown;
      message?: string;
    };
    const statusCode =
      errorWithStatus.statusCode || errorWithStatus.response?.status;
    const errorBody = errorWithStatus.response?.data || errorWithStatus.details;

    // 401 means not authenticated (expected)
    if (statusCode === 401) {
      logger.debug('[useAuth] Fetch user 401 (Not Authenticated)', {
        errorBody,
        timestamp: new Date().toISOString(),
      });
      return null;
    }
    logger.error('[useAuth] Error fetching user Detail', {
      error,
      statusCode,
      message: errorWithStatus.message,
      errorBody,
      timestamp: new Date().toISOString(),
    });
    throw error;
  }
};

/**
 * Logout function
 */
const logoutUser = async (): Promise<void> => {
  await post('/auth/logout');
};

/**
 * useAuth Hook
 */
export function useAuth() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const {
    data: user,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: queryKeys.auth.me(),
    queryFn: fetchCurrentUser,
    staleTime: 5 * 60 * 1000,
    retry: 1,
    refetchOnWindowFocus: true,
  });

  const logoutMutation = useMutation({
    mutationFn: logoutUser,
    onSuccess: () => {
      queryClient.setQueryData(queryKeys.auth.me(), null);
      queryClient.clear();
      router.push('/login');
    },
    onError: (error) => {
      logger.error('[useAuth] Logout error:', error);
      queryClient.setQueryData(queryKeys.auth.me(), null);
      queryClient.clear();
      router.push('/login');
    },
  });

  return {
    user: user ?? null,
    isLoading,
    isAuthenticated: !!user,
    error,
    refetch,
    logout: logoutMutation.mutate,
    isLoggingOut: logoutMutation.isPending,
  };
}

/**
 * useRequireAuth Hook
 */
export function useRequireAuth() {
  const router = useRouter();
  const auth = useAuth();

  if (!auth.isLoading && !auth.isAuthenticated) {
    const currentPath =
      typeof window !== 'undefined' ? window.location.pathname : '/';
    router.push('/login?redirect=' + encodeURIComponent(currentPath));
  }

  return auth;
}

/**
 * useOptionalAuth Hook
 */
export function useOptionalAuth() {
  return useAuth();
}
