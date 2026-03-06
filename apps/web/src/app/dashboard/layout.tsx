/**
 * Dashboard Layout (BFF Pattern)
 *
 * Server Component layout for protected dashboard pages.
 * User data is fetched server-side with proper authentication.
 *
 * CRITICAL: Server Components CANNOT mutate cookies
 * - Cookie deletion must happen in Route Handlers
 * - On auth failure, redirect to /api/auth/session-expired
 * - Route Handler clears cookies and redirects to login
 *
 * Phase 22: Added organization fetching and onboarding redirect logic.
 */

import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { AuthStoreInitializer } from '@/components/providers/AuthStoreInitializer';
import { WorkspaceInitializer } from '@/components/providers/WorkspaceInitializer';
import { API_CONFIG, ROUTES } from '@/lib/config';
import type { AuthUser } from '@/types/auth.types';
import { logger } from '@/lib/logger';

// Explicitly opt into dynamic rendering
export const dynamic = 'force-dynamic';

/**
 * Fetch user data server-side
 * Uses Authorization header with Bearer token for API authentication
 *
 * CRITICAL: On auth failure, redirects to Route Handler for cookie cleanup
 * Server Components cannot mutate cookies - only Route Handlers can.
 */
async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    // Get access token from cookies
    const cookieStore = cookies();
    const accessToken = cookieStore.get('accessToken');

    // If no token, return null (middleware should have caught this)
    if (!accessToken) {
      logger.log('[Dashboard Layout] No access token found');
      return null;
    }

    // Normalize API URL to ensure /api/v1 prefix
    const raw = (
      process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'
    ).replace(/\/+$/, '');
    const baseUrl = raw.endsWith('/api/v1') ? raw : `${raw}/api/v1`;
    const apiUrl = `${baseUrl}${API_CONFIG.ENDPOINTS.AUTH.ME}`;

    logger.log('[Dashboard Layout] Fetching user from:', apiUrl);

    // Fetch user from API with Authorization header
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken.value}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store', // Always fetch fresh user data
    });

    logger.log('[Dashboard Layout] API response status:', response.status);

    // CRITICAL: If unauthorized or forbidden, redirect to cleanup route
    if (response.status === 401 || response.status === 403) {
      logger.warn(
        '[Dashboard Layout] Token invalid (401/403), redirecting to cleanup route'
      );
      redirect('/api/auth/session-expired');
    }

    // If response is not OK, redirect to cleanup route
    if (!response.ok) {
      logger.warn(
        '[Dashboard Layout] API returned error status:',
        response.status
      );
      redirect('/api/auth/session-expired');
    }

    // Try to parse JSON response
    let data;
    try {
      data = await response.json();
    } catch (jsonError) {
      logger.error(
        '[Dashboard Layout] Failed to parse JSON response:',
        jsonError
      );
      // Redirect to cleanup route if response is malformed
      redirect('/api/auth/session-expired');
    }

    // Check if response indicates success and has user data
    if (!data.success || !data.data || !data.data.user) {
      logger.warn('[Dashboard Layout] Invalid response structure:', {
        success: data.success,
        hasData: !!data.data,
        hasUser: !!(data.data && data.data.user),
      });
      // Redirect to cleanup route if response is invalid
      redirect('/api/auth/session-expired');
    }

    logger.log(
      '[Dashboard Layout] Successfully fetched user:',
      data.data.user.email
    );

    // Extract user from nested data structure
    return data.data.user as AuthUser;
  } catch (error) {
    logger.error('[Dashboard Layout] Error fetching user:', error);
    // Redirect to cleanup route on any exception
    redirect('/api/auth/session-expired');
  }
}

/**
 * Fetch user's organizations server-side
 *
 * RSC cookie forwarding: Forwards accessToken via Authorization header
 * (same pattern as getCurrentUser) so the Hono API authenticates the SSR request.
 */
async function getUserOrganizations(accessToken: string): Promise<
  {
    id: string;
    name: string;
    slug?: string;
    industry?: string;
    logoUrl?: string;
  }[]
> {
  try {
    const raw = (
      process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'
    ).replace(/\/+$/, '');
    const baseUrl = raw.endsWith('/api/v1') ? raw : `${raw}/api/v1`;
    const apiUrl = `${baseUrl}${API_CONFIG.ENDPOINTS.ORGANIZATIONS.MY}`;

    logger.log('[Dashboard Layout] Fetching orgs from:', apiUrl);

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      logger.warn('[Dashboard Layout] Orgs fetch failed:', response.status);
      return [];
    }

    const data = await response.json();
    return data?.data?.organizations ?? [];
  } catch (error) {
    logger.error('[Dashboard Layout] Error fetching orgs:', error);
    return [];
  }
}

/**
 * Dashboard Layout Component (Server Component)
 */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Fetch user data on the server
  const user = await getCurrentUser();

  // If no user, redirect to login
  // The cleanup route will have cleared cookies if there was an error,
  // so middleware will not redirect back here (breaking infinite loop)
  if (!user) {
    logger.log('[Dashboard Layout] No user found, redirecting to login');
    redirect(ROUTES.LOGIN);
  }

  // ✅ NEW: Email verification gate
  // Allow onboarding path through (user may not be verified yet when first creating org)
  const headersList = headers();
  const currentPath =
    headersList.get('x-pathname') ||
    headersList.get('x-invoke-path') ||
    headersList.get('x-next-url') ||
    '';

  if (!user.emailVerified && !currentPath.includes('/dashboard/onboarding')) {
    redirect('/auth/verify-email');
  }

  // Fetch user's orgs server-side (forward the accessToken)
  const cookieStore = cookies();
  const accessToken = cookieStore.get('accessToken');
  const orgs = accessToken ? await getUserOrganizations(accessToken.value) : [];

  // If user has no orgs, redirect to onboarding
  // Check the current path to avoid redirect loops when already on onboarding
  if (orgs.length === 0) {
    const headersList = headers();
    const pathname =
      headersList.get('x-pathname') ||
      headersList.get('x-invoke-path') ||
      headersList.get('x-next-url') ||
      '';
    if (!pathname.includes('/dashboard/onboarding')) {
      redirect(ROUTES.ONBOARDING);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* CRITICAL: Initialize Zustand stores with server-side data */}
      <AuthStoreInitializer user={user} />
      <WorkspaceInitializer orgs={orgs} />

      {/* Header with navigation (Client Component for interactivity) */}
      <DashboardHeader user={user} orgs={orgs} />

      {/* Main Content */}
      <main className="container-custom py-4 md:py-8 pb-24 md:pb-8">
        {children}
      </main>
    </div>
  );
}
