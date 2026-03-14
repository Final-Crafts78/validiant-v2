/**
 * Organization-Scoped Workspace Layout (Server Component)
 *
 * Objectives:
 * 1. Enforce tenant isolation via [orgSlug]
 * 2. Handle Auth & Org data bootstrapping
 * 3. Render the Obsidian Command Shell
 */

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { WorkspaceLayoutContent } from '@/components/workspace/WorkspaceLayoutContent';
import { AuthStoreInitializer } from '@/components/providers/AuthStoreInitializer';
import { WorkspaceInitializer } from '@/components/providers/WorkspaceInitializer';
import { API_CONFIG, ROUTES } from '@/lib/config';
import { logger } from '@/lib/logger';
import type { AuthUser } from '@/types/auth.types';

// Explicitly opt into dynamic rendering
export const dynamic = 'force-dynamic';

async function getData(): Promise<{
  user: AuthUser;
  orgs: any[];
  activeOrg: any;
}> {
  try {
    const cookieStore = cookies();
    const accessToken = cookieStore.get('accessToken');

    if (!accessToken) {
      redirect(ROUTES.LOGIN);
    }

    const rawApi = (
      process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'
    ).replace(/\/+$/, '');
    const baseUrl = rawApi.endsWith('/api/v1') ? rawApi : `${rawApi}/api/v1`;

    // Parallel fetch User and Orgs
    const [userRes, orgsRes] = await Promise.all([
      fetch(`${baseUrl}${API_CONFIG.ENDPOINTS.AUTH.ME}`, {
        headers: { Authorization: `Bearer ${accessToken.value}` },
        cache: 'no-store',
      }),
      fetch(`${baseUrl}${API_CONFIG.ENDPOINTS.ORGANIZATIONS.MY}`, {
        headers: { Authorization: `Bearer ${accessToken.value}` },
        cache: 'no-store',
      }),
    ]);

    if (!userRes.ok || !orgsRes.ok) {
      redirect('/api/auth/session-expired');
    }

    const userData = await userRes.json();
    const orgsData = await orgsRes.json();

    return {
      user: userData.data.user,
      orgs: orgsData.data.organizations,
      activeOrg: null, // Logic to find by slug if needed, but for now we trust the slug
    };
  } catch (error) {
    logger.error('[Org Layout] Data fetch failed:', error);
    redirect(ROUTES.LOGIN);
  }
}

export default async function OrgLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { orgSlug: string };
}) {
  const { user, orgs } = await getData();

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

  const cookieStore = cookies();
  const accessToken = cookieStore.get('accessToken');

  return (
    <>
      <AuthStoreInitializer user={user} accessToken={accessToken?.value} />
      <WorkspaceInitializer orgs={orgs} />

      <WorkspaceLayoutContent orgSlug={params.orgSlug}>
        {children}
      </WorkspaceLayoutContent>
    </>
  );
}
