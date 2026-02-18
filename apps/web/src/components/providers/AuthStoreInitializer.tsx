/**
 * Auth Store Initializer
 * 
 * CRITICAL: Prevents blank screens caused by Zustand hydration mismatch.
 * 
 * Server Components fetch user data, but Client Components using useAuthStore
 * start with null state until hydration completes. This causes a flash of
 * "no user" state and breaks the UI.
 * 
 * This component seeds the Zustand store immediately on first render,
 * ensuring child Client Components have access to user data.
 */

'use client';

import { useRef } from 'react';
import { useAuthStore } from '@/store/auth';
import type { AuthUser } from '@/types/auth.types';

export function AuthStoreInitializer({ user }: { user: AuthUser }) {
  const initialized = useRef(false);

  if (!initialized.current) {
    // Seed the store immediately on render so child client components don't return null
    useAuthStore.getState().setUser(user);
    initialized.current = true;
  }

  return null;
}
