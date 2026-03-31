/**
 * Profile Layout (BFF Pattern)
 *
 * Global layout for the user profile page.
 * Reuses the DashboardHeader to provide consistent navigation.
 */

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { AuthStoreInitializer } from '@/components/providers/AuthStoreInitializer';
import { WorkspaceInitializer } from '@/components/providers/WorkspaceInitializer';
import { CommandPalette } from '@/components/CommandPalette';
import {
  getCurrentUserAction,
  getUserOrganizationsAction,
} from '@/actions/auth.actions';

// Explicitly opt into dynamic rendering
export const dynamic = 'force-dynamic';

export default async function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headersList = headers();
  const currentPath =
    headersList.get('x-pathname') ||
    headersList.get('x-invoke-path') ||
    headersList.get('x-next-url') ||
    '/profile';

  const result = await getCurrentUserAction();

  if (!result.success || !result.user) {
    redirect(
      `/api/auth/session-expired?reason=expired&force=true&redirect=${encodeURIComponent(currentPath)}`
    );
  }

  const { user, accessToken } = result;

  const orgs = accessToken ? await getUserOrganizationsAction(accessToken) : [];

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
