/**
 * Providers Component
 *
 * Wraps the application with all necessary providers:
 * - QueryClientProvider (TanStack Query)
 * - RealtimeProvider (SSE)
 * - Future providers (theme, auth context, etc.)
 */

'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { type ReactNode } from 'react';
import { RealtimeProvider } from './RealtimeProvider';
import { ThemeProvider } from './ThemeProvider';
import { queryClient } from '@/lib/query-client';

/**
 * Props for Providers component
 */
interface ProvidersProps {
  children: ReactNode;
}

/**
 * Providers Component
 *
 * Initializes and provides all app-wide providers.
 */
export function Providers({ children }: ProvidersProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <RealtimeProvider>{children}</RealtimeProvider>
      </ThemeProvider>
      {/* React Query Devtools - only in development */}
      {process.env.NODE_ENV === 'development' && <ReactQueryDevtools />}
    </QueryClientProvider>
  );
}
