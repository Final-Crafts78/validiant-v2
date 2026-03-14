/**
 * Realtime Provider
 *
 * Simply mounts the useRealtime hook to ensure global SSE connection.
 */

'use client';

import { useRealtime } from '@/hooks/useRealtime';
import { type ReactNode } from 'react';

interface RealtimeProviderProps {
  children: ReactNode;
}

export function RealtimeProvider({ children }: RealtimeProviderProps) {
  // Mount the global real-time hook
  useRealtime();

  return <>{children}</>;
}
