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
 * - Authentication state determined via /api/v1/auth/me endpoint
 *
 * Phase 22: Added Command Palette and global search capability.
 */

import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { AuthStoreInitializer } from '@/components/providers/AuthStoreInitializer';
import { WorkspaceInitializer } from '@/components/providers/WorkspaceInitializer';
import { CommandPalette } from '@/components/CommandPalette';
import { API_CONFIG, ROUTES } from '@/lib/config';
import type { AuthUser } from '@/types/auth.types';
import { logger } from '@/lib/logger';

// Explicitly opt into dynamic rendering
export const dynamic = 'force-dynamic';

/**
 * Fetch user data server-side
 */
async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const cookieStore = cookies();
    const accessToken = cookieStore.get('accessToken');

    if (!accessToken) {
      logger.log('[Dashboard Layout] No access token found');
      return null;
    }

    const raw = (
      process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'
    ).replace(/\/+$/, '');
    const baseUrl = raw.endsWith('/api/v1') ? raw : `${raw}/api/v1`;
    const apiUrl = `${baseUrl}${API_CONFIG.ENDPOINTS.AUTH.ME}`;

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken.value}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (response.status === 401 || response.status === 403) {
      redirect('/api/auth/session-expired');
    }

    if (!response.ok) {
      redirect('/api/auth/session-expired');
    }

    const data = await response.json();
    if (!data.success || !data.data || !data.data.user) {
      redirect('/api/auth/session-expired');
    }

    return data.data.user as AuthUser;
  } catch (error) {
    if (error instanceof Error && error.message.includes('NEXT_REDIRECT'))
      throw error;
    logger.error('[Dashboard Layout] Error fetching user:', error);
    redirect('/api/auth/session-expired');
  }
}

/**
 * Fetch user's organizations server-side
 */
async function getUserOrganizations(accessToken: string): Promise<any[]> {
  try {
    const raw = (
      process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'
    ).replace(/\/+$/, '');
    const baseUrl = raw.endsWith('/api/v1') ? raw : `${raw}/api/v1`;
    const apiUrl = `${baseUrl}${API_CONFIG.ENDPOINTS.ORGANIZATIONS.MY}`;

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) return [];

    const data = await response.json();
    return data?.data?.organizations ?? [];
  } catch (error) {
    logger.error('[Dashboard Layout] Error fetching orgs:', error);
    return [];
  }
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect(ROUTES.LOGIN);
  }

  const headersList = headers();
  const currentPath =
    headersList.get('x-pathname') ||
    headersList.get('x-invoke-path') ||
    headersList.get('x-next-url') ||
    '';

  if (!user.emailVerified && !currentPath.includes('/dashboard/onboarding')) {
    redirect('/auth/verify-email');
  }

  const cookieStore = cookies();
  const accessToken = cookieStore.get('accessToken');
  const orgs = accessToken ? await getUserOrganizations(accessToken.value) : [];

  if (orgs.length === 0 && !currentPath.includes('/dashboard/onboarding')) {
    redirect(ROUTES.ONBOARDING);
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <AuthStoreInitializer user={user} />
      <WorkspaceInitializer orgs={orgs} />

      <DashboardHeader user={user} orgs={orgs} />

      <main className="flex-1 container-custom py-4 md:py-8 pb-24 md:pb-12">
        {children}
      </main>

      <CommandPalette />
    </div>
  );
}
