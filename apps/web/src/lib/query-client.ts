/**
 * React Query Configuration
 *
 * Configures TanStack Query (React Query) for data fetching and caching.
 */

import { QueryClient, DefaultOptions } from '@tanstack/react-query';
import { queryKeys } from './query-keys';

/**
 * Default query options
 */
const queryConfig: DefaultOptions = {
  queries: {
    // Data is considered fresh for 30 seconds
    staleTime: 30 * 1000,

    // Keep unused data in cache for 5 minutes
    gcTime: 5 * 60 * 1000,

    // Retry failed requests once
    retry: 1,

    // Refetch on window focus
    refetchOnWindowFocus: true,

    // Don't refetch on mount if data is fresh
    refetchOnMount: false,

    // Don't refetch on reconnect if data is fresh
    refetchOnReconnect: false,
  },
  mutations: {
    retry: 1,
    onError: (error) => {
      console.error('[React Query] Mutation error:', error);
    },
  },
};

/**
 * Create Query Client instance
 */
export const queryClient = new QueryClient({
  defaultOptions: queryConfig,
});

export { queryKeys };

/**
 * Helper to get query data from cache
 */
export const getQueryData = <T>(queryKey: readonly any[]): T | undefined => {
  return queryClient.getQueryData<T>(queryKey);
};

/**
 * Helper to set query data manually
 */
export const setQueryData = <T>(queryKey: readonly any[], data: T) => {
  queryClient.setQueryData(queryKey, data);
};
