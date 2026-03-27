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

  const result = await getCurrentUserAction();

  if (!result.success || !result.user) {
    redirect(ROUTES.LOGIN);
  }

  const { user, accessToken } = result;

  if (!user.emailVerified && !currentPath.includes('/dashboard/onboarding')) {
    redirect('/auth/verify-email');
  }

  const orgs = accessToken ? await getUserOrganizationsAction(accessToken) : [];

  if (orgs.length === 0 && !currentPath.includes('/dashboard/onboarding')) {
    redirect(ROUTES.ONBOARDING);
  }

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
}
