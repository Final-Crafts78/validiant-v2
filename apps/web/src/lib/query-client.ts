/**
 * React Query Configuration
 *
 * Configures TanStack Query (React Query) for data fetching and caching.
 *
 * Features:
 * - Automatic caching with smart invalidation
 * - Optimistic updates for instant UI feedback
 * - Background refetching for fresh data
 * - Error handling and retry logic
 * - DevTools for debugging (development)
 *
 * Integration:
 * - Works seamlessly with HttpOnly cookie authentication
 * - Automatic query invalidation on real-time events (PartyKit)
 * - Supports optimistic updates for drag-and-drop UX
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
    gcTime: 5 * 60 * 1000, // 5 minutes (previously cacheTime)

    // Retry failed requests once
    retry: 1,

    // Refetch on window focus (user comes back to tab)
    refetchOnWindowFocus: true,

    // Don't refetch on mount if data is fresh
    refetchOnMount: false,

    // Don't refetch on reconnect if data is fresh
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
 *
 * Pattern:
 * - ['entity'] - List all entities
 * - ['entity', id] - Single entity by ID
 * - ['entity', id, 'relation'] - Related entities
 * - ['entity', id, 'relation', params] - Related entities with filters
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
        ? (['projects', id, 'tasks', filters] as const)
        : (['projects', id, 'tasks'] as const),
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
 *
 * Used after WebSocket events to refresh project data.
 */
export const invalidateProjectQueries = (projectId: string) => {
  queryClient.invalidateQueries({
    queryKey: queryKeys.projects.detail(projectId),
  });
  queryClient.invalidateQueries({
    queryKey: queryKeys.projects.tasks(projectId),
  });
  queryClient.invalidateQueries({
    queryKey: queryKeys.tasks.byProject(projectId),
  });
};

/**
 * Helper to invalidate all queries for a task
 *
 * Used after task updates to refresh task data.
 */
export const invalidateTaskQueries = (taskId: string, projectId?: string) => {
  queryClient.invalidateQueries({ queryKey: queryKeys.tasks.detail(taskId) });

  if (projectId) {
    queryClient.invalidateQueries({
      queryKey: queryKeys.projects.tasks(projectId),
    });
    queryClient.invalidateQueries({
      queryKey: queryKeys.tasks.byProject(projectId),
    });
  }
};

/**
 * Helper to prefetch data
 *
 * Useful for preloading data before navigation.
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
 *
 * Useful for optimistic updates.
 */
export const setQueryData = <T>(queryKey: readonly any[], data: T) => {
  queryClient.setQueryData(queryKey, data);
};

/**
 * Helper to get query data from cache
 *
 * Useful for accessing cached data in mutations.
 */
export const getQueryData = <T>(queryKey: readonly any[]): T | undefined => {
  return queryClient.getQueryData<T>(queryKey);
};
