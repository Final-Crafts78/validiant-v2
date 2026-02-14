/**
 * useAuth Hook - HttpOnly Cookie Authentication
 * 
 * Authentication hook that works with HttpOnly cookies.
 * 
 * WHY THIS PATTERN:
 * - JWTs are stored in HttpOnly cookies (XSS immune)
 * - Frontend JavaScript CANNOT read the tokens
 * - Authentication state determined via /api/v1/auth/me endpoint
 * - No manual token management needed
 * 
 * AUTHENTICATION FLOW:
 * 1. User logs in → Backend sets HttpOnly cookies
 * 2. useAuth calls /api/v1/auth/me on mount
 * 3. If cookies valid → Returns user data
 * 4. If cookies invalid/expired → Returns null
 * 5. All subsequent API requests automatically include cookies
 * 
 * FEATURES:
 * - Auto-fetch user on mount
 * - Loading states for auth checks
 * - Logout functionality (clears cookies)
 * - Type-safe user interface
 * - React Query powered (caching + refetching)
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { get, post } from '@/lib/api';
import { queryKeys } from '@/lib/query-client';
import { useRouter } from 'next/navigation';

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
 * 
 * This endpoint checks the HttpOnly cookies and returns user data.
 * If cookies are invalid/expired, it returns 401 (handled by API client).
 */
const fetchCurrentUser = async (): Promise<User | null> => {
  try {
    const response = await get<AuthMeResponse>('/api/v1/auth/me');
    return response.data.data.user;
  } catch (error: any) {
    // 401 means not authenticated (expected)
    if (error.statusCode === 401) {
      return null;
    }
    // Other errors should be logged
    console.error('[useAuth] Error fetching user:', error);
    throw error;
  }
};

/**
 * Logout function
 * 
 * Calls /api/v1/auth/logout to clear HttpOnly cookies.
 */
const logoutUser = async (): Promise<void> => {
  await post('/api/v1/auth/logout');
};

/**
 * useAuth Hook
 * 
 * Main authentication hook for the application.
 * 
 * @returns Authentication state and user data
 * 
 * @example
 * ```tsx
 * function Dashboard() {
 *   const { user, isLoading, isAuthenticated, logout } = useAuth();
 *   
 *   if (isLoading) {
 *     return <LoadingSpinner />;
 *   }
 *   
 *   if (!isAuthenticated) {
 *     return <Navigate to="/login" />;
 *   }
 *   
 *   return (
 *     <div>
 *       <h1>Welcome, {user.fullName}!</h1>
 *       <button onClick={logout}>Logout</button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useAuth() {
  const router = useRouter();
  const queryClient = useQueryClient();

  // Fetch user data using React Query
  const {
    data: user,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: queryKeys.auth.me,
    queryFn: fetchCurrentUser,
    // Keep user data fresh for 5 minutes
    staleTime: 5 * 60 * 1000,
    // Retry once if request fails
    retry: 1,
    // Don't show loading state when refetching in background
    refetchOnWindowFocus: true,
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: logoutUser,
    onSuccess: () => {
      // Clear user from cache
      queryClient.setQueryData(queryKeys.auth.me, null);
      // Clear all queries (fresh start after logout)
      queryClient.clear();
      // Redirect to login page
      router.push('/login');
    },
    onError: (error) => {
      console.error('[useAuth] Logout error:', error);
      // Even if logout fails on backend, clear frontend state
      queryClient.setQueryData(queryKeys.auth.me, null);
      queryClient.clear();
      router.push('/login');
    },
  });

  return {
    // User data (null if not authenticated)
    user: user ?? null,
    
    // Loading state (true while fetching user)
    isLoading,
    
    // Authentication status (true if user exists)
    isAuthenticated: !!user,
    
    // Error state (if fetching failed)
    error,
    
    // Refetch user data (useful after profile updates)
    refetch,
    
    // Logout function
    logout: logoutMutation.mutate,
    
    // Logout loading state
    isLoggingOut: logoutMutation.isPending,
  };
}

/**
 * useRequireAuth Hook
 * 
 * Redirect to login if not authenticated.
 * Use in protected pages.
 * 
 * @example
 * ```tsx
 * function ProtectedPage() {
 *   const { user, isLoading } = useRequireAuth();
 *   
 *   if (isLoading) {
 *     return <LoadingSpinner />;
 *   }
 *   
 *   // User is guaranteed to be authenticated here
 *   return <Dashboard user={user} />;
 * }
 * ```
 */
export function useRequireAuth() {
  const router = useRouter();
  const auth = useAuth();

  // Redirect to login if not authenticated
  if (!auth.isLoading && !auth.isAuthenticated) {
    const currentPath = typeof window !== 'undefined' ? window.location.pathname : '/';
    router.push('/login?redirect=' + encodeURIComponent(currentPath));
  }

  return auth;
}

/**
 * useOptionalAuth Hook
 * 
 * Get auth state without redirecting.
 * Use in public pages that show different content for authenticated users.
 * 
 * @example
 * ```tsx
 * function HomePage() {
 *   const { user, isAuthenticated } = useOptionalAuth();
 *   
 *   return (
 *     <div>
 *       <h1>Welcome to Validiant</h1>
 *       {isAuthenticated ? (
 *         <p>Hello, {user.fullName}!</p>
 *       ) : (
 *         <Link href="/login">Login</Link>
 *       )}
 *     </div>
 *   );
 * }
 * ```
 */
export function useOptionalAuth() {
  return useAuth();
}
