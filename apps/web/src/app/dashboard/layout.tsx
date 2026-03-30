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

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { AuthStoreInitializer } from '@/components/providers/AuthStoreInitializer';
import { WorkspaceInitializer } from '@/components/providers/WorkspaceInitializer';
import { CommandPalette } from '@/components/CommandPalette';
import { ROUTES } from '@/lib/config';
import {
  getCurrentUserAction,
  getUserOrganizationsAction,
} from '@/actions/auth.actions';

// Explicitly opt into dynamic rendering
export const dynamic = 'force-dynamic';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headersList = headers();
  const currentPath =
    headersList.get('x-pathname') ||
    headersList.get('x-invoke-path') ||
    headersList.get('x-next-url') ||
    '/dashboard';

  console.debug('[Dashboard:Layout] Fetching current user...', {
    currentPath,
  });

  const result = await getCurrentUserAction();

  console.debug('[Dashboard:Layout] Current user result', {
    success: result.success,
    hasUser: !!result.user,
    email: result.user?.email,
    hasToken: !!result.accessToken,
    error: result.error,
  });

  if (!result.success || !result.user) {
    console.warn(
      '[Dashboard:Layout] Redirecting to SESSION-EXPIRED - No valid user session',
      {
        reason: result.error || 'MISSING_USER_DATA',
        success: result.success,
        path: currentPath,
      }
    );
    redirect(
      `/api/auth/session-expired?redirect=${encodeURIComponent(currentPath)}`
    );
  }

  const { user, accessToken } = result;

  if (!user.emailVerified && !currentPath.includes('/dashboard/onboarding')) {
    console.warn('[Dashboard:Layout] Redirecting to VERIFY-EMAIL');
    redirect('/auth/verify-email');
  }

  console.debug('[Dashboard:Layout] Fetching organizations...', {
    hasToken: !!accessToken,
    tokenPrefix: accessToken?.substring(0, 20),
  });

  const orgs = accessToken ? await getUserOrganizationsAction(accessToken) : [];

  console.debug('[Dashboard:Layout] Organizations result', {
    count: orgs.length,
    orgIds: orgs.map((o) => o.id),
    currentPath,
  });

  if (orgs.length === 0 && !currentPath.includes('/dashboard/onboarding')) {
    console.warn(
      '[Dashboard:Layout] Redirecting to ONBOARDING - No organizations found'
    );
    redirect(ROUTES.ONBOARDING);
  }

  try {
    console.debug('[Dashboard:Layout] EP-RENDER: Starting component render', {
      hasUser: !!user,
      hasOrgs: orgs.length > 0,
      timestamp: new Date().toISOString(),
    });

    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <AuthStoreInitializer user={user} accessToken={accessToken} />
        <WorkspaceInitializer orgs={orgs} />

        <DashboardHeader user={user} orgs={orgs} />

        <main className="flex-1 container-custom py-4 md:py-8 pb-24 md:pb-12">
          {children}
        </main>

        <CommandPalette />
      </div>
    );
  } catch (renderErr: any) {
    console.error('[Dashboard:Layout] CRITICAL RENDER FAILURE', {
      message: renderErr.message,
      stack: renderErr.stack,
      timestamp: new Date().toISOString(),
    });
    throw renderErr; // Re-throw so Next.js handles the 500 but we have the log
  }
}
