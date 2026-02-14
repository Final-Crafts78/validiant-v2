/**
 * React Query Configuration - Mobile
 * 
 * Configures TanStack Query (React Query) for data fetching and caching.
 * 
 * MOBILE-SPECIFIC CONSIDERATIONS:
 * - Lower memory footprint than web
 * - Refetch on app foreground (not window focus)
 * - Optimized for offline-first patterns
 * - Conservative cache sizes
 * 
 * Features:
 * - Automatic caching with smart invalidation
 * - Optimistic updates for instant UI feedback
 * - Background refetching for fresh data
 * - Error handling and retry logic
 */

import { QueryClient, DefaultOptions } from '@tanstack/react-query';

/**
 * Default query options
 */
const queryConfig: DefaultOptions = {
  queries: {
    // Data is considered fresh for 30 seconds
    staleTime: 30 * 1000, // 30 seconds
    
    // Keep unused data in cache for 5 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
    
    // Retry failed requests once
    retry: 1,
    
    // Refetch when app comes to foreground
    refetchOnWindowFocus: false, // Not applicable in React Native
    refetchOnMount: false,
    refetchOnReconnect: false,
  },
  mutations: {
    // Retry failed mutations once
    retry: 1,
    
    // Default error handler for mutations
    onError: (error) => {
      console.error('[React Query] Mutation error:', error);
      // Future: Show toast notification
    },
  },
};

/**
 * Create Query Client instance
 * 
 * This is a singleton that manages all queries and mutations.
 */
export const queryClient = new QueryClient({
  defaultOptions: queryConfig,
});

/**
 * Query Keys Factory
 * 
 * Centralized query key management for type safety and consistency.
 */
export const queryKeys = {
  // Authentication
  auth: {
    me: ['auth', 'me'] as const,
    session: ['auth', 'session'] as const,
  },
  
  // Users
  users: {
    all: ['users'] as const,
    detail: (id: string) => ['users', id] as const,
    profile: (id: string) => ['users', id, 'profile'] as const,
  },
  
  // Organizations
  organizations: {
    all: ['organizations'] as const,
    detail: (id: string) => ['organizations', id] as const,
    members: (id: string) => ['organizations', id, 'members'] as const,
    projects: (id: string) => ['organizations', id, 'projects'] as const,
  },
  
  // Projects
  projects: {
    all: ['projects'] as const,
    detail: (id: string) => ['projects', id] as const,
    tasks: (id: string, filters?: any) => 
      filters 
        ? ['projects', id, 'tasks', filters] as const
        : ['projects', id, 'tasks'] as const,
    members: (id: string) => ['projects', id, 'members'] as const,
  },
  
  // Tasks
  tasks: {
    all: ['tasks'] as const,
    detail: (id: string) => ['tasks', id] as const,
    byProject: (projectId: string) => ['tasks', 'project', projectId] as const,
    byUser: (userId: string) => ['tasks', 'user', userId] as const,
    comments: (id: string) => ['tasks', id, 'comments'] as const,
    assignees: (id: string) => ['tasks', id, 'assignees'] as const,
  },
} as const;

/**
 * Helper to invalidate all queries for a project
 */
export const invalidateProjectQueries = (projectId: string) => {
  queryClient.invalidateQueries({ queryKey: queryKeys.projects.detail(projectId) });
  queryClient.invalidateQueries({ queryKey: queryKeys.projects.tasks(projectId) });
  queryClient.invalidateQueries({ queryKey: queryKeys.tasks.byProject(projectId) });
};

/**
 * Helper to invalidate all queries for a task
 */
export const invalidateTaskQueries = (taskId: string, projectId?: string) => {
  queryClient.invalidateQueries({ queryKey: queryKeys.tasks.detail(taskId) });
  
  if (projectId) {
    queryClient.invalidateQueries({ queryKey: queryKeys.projects.tasks(projectId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.tasks.byProject(projectId) });
  }
};

/**
 * Helper to prefetch data
 */
export const prefetchQuery = async <T>(
  queryKey: readonly any[],
  queryFn: () => Promise<T>
) => {
  await queryClient.prefetchQuery({
    queryKey,
    queryFn,
  });
};

/**
 * Helper to set query data manually
 */
export const setQueryData = <T>(queryKey: readonly any[], data: T) => {
  queryClient.setQueryData(queryKey, data);
};

/**
 * Helper to get query data from cache
 */
export const getQueryData = <T>(queryKey: readonly any[]): T | undefined => {
  return queryClient.getQueryData<T>(queryKey);
};
