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

export function AuthStoreInitializer({
  user,
  accessToken,
}: {
  user: AuthUser;
  accessToken?: string;
}) {
  const initialized = useRef(false);

  if (!initialized.current) {
    console.debug('[AuthStore:Initializer] Seeding store with server-fetched data', {
      userId: user?.id,
      email: user?.email,
      hasToken: !!accessToken,
    });
    // Seed the store immediately on render so child client components don't return null
    useAuthStore.getState().setAuth({ user, accessToken });
    initialized.current = true;
  }

  return null;
}
