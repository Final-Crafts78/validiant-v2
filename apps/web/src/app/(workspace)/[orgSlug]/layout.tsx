/**
 * Organization-Scoped Workspace Layout (Server Component)
 *
 * Objectives:
 * 1. Enforce tenant isolation via [orgSlug]
 * 2. Handle Auth & Org data bootstrapping
 * 3. Render the Obsidian Command Shell
 */

import { redirect } from 'next/navigation';
import { WorkspaceLayoutContent } from '@/components/workspace/WorkspaceLayoutContent';
import { AuthStoreInitializer } from '@/components/providers/AuthStoreInitializer';
import { WorkspaceInitializer } from '@/components/providers/WorkspaceInitializer';
import { ROUTES } from '@/lib/config';
import { logger } from '@/lib/logger';
import {
  getCurrentUserAction,
  getUserOrganizationsAction,
} from '@/actions/auth.actions';

// Explicitly opt into dynamic rendering
export const dynamic = 'force-dynamic';

async function getData(): Promise<{
  user: any;
  orgs: any[];
  accessToken: string;
}> {
  const result = await getCurrentUserAction();

  if (!result.success || !result.user || !result.accessToken) {
    console.warn('[Org:Layout] [EP-AUTH-FAIL] Redirecting to SESSION-EXPIRED', {
      reason: result.error,
      timestamp: new Date().toISOString(),
    });
    redirect(
      `/api/auth/session-expired?reason=expired&force=true&redirect=${encodeURIComponent('/dashboard')}`
    );
  }

  const orgs = await getUserOrganizationsAction(result.accessToken);

  return {
    user: result.user,
    orgs,
    accessToken: result.accessToken,
  };
}


export default async function OrgLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { orgSlug: string };
}) {
  const { user, orgs, accessToken } = await getData();

  // Validate the slug exists in user's orgs
  const activeOrg = orgs.find((o) => o.slug === params.orgSlug);

  // If org doesn't exist or slug is invalid for this user, check if we should redirect
  // For now, if not found, we redirect to onboarding or global dashboard
  if (!activeOrg && params.orgSlug !== 'new') {
    logger.warn(
      `[Org Layout] Org slug ${params.orgSlug} not found in user orgs`
    );
    redirect(ROUTES.ONBOARDING);
  }

  return (
    <>
      <AuthStoreInitializer user={user} accessToken={accessToken} />
      <WorkspaceInitializer orgs={orgs} />

      <WorkspaceLayoutContent orgSlug={params.orgSlug}>
        {children}
      </WorkspaceLayoutContent>
    </>
  );
}
