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
import { DynamicThemeInjector } from '@/components/providers/DynamicThemeInjector';
import { ROUTES } from '@/lib/config';
import { logger } from '@/lib/logger';
import {
  getCurrentUserAction,
  getUserOrganizationsAction,
} from '@/actions/auth.actions';

// Explicitly opt into dynamic rendering
export const dynamic = 'force-dynamic';

async function getData(): Promise<{
  user: import('@/types/auth.types').AuthUser;
  orgs: import('@/types/auth.types').Organization[];
  accessToken: string;
}> {
  console.debug('[Org:Layout] Starting getData() diagnostic fetch');
  
  try {
    const result = await getCurrentUserAction();

    console.debug('[Org:Layout] getCurrentUserAction result', {
      success: result.success,
      hasUser: !!result.user,
      error: result.error,
      timestamp: new Date().toISOString()
    });

    if (!result.success || !result.user || !result.accessToken) {
      const loginReason = result.error || 'AUTH_FAILURE_ORG_LAYOUT';
      console.warn(`[Org:Layout] [EP-AUTH-FAIL] Redirecting to SESSION-EXPIRED`, {
        reason: loginReason,
        timestamp: new Date().toISOString(),
      });

      // 🔍 EXTREME VISIBILITY: Using session-expired route to prevent loops
      redirect(
        `/api/auth/session-expired?reason=expired&force=true&redirect=${encodeURIComponent('/dashboard')}`
      );
    }

    console.debug('[Org:Layout] Fetching organizations for user', {
      email: result.user.email,
      timestamp: new Date().toISOString()
    });

    const orgs = await getUserOrganizationsAction(result.accessToken);

    console.debug('[Org:Layout] fetchOrganizations success', {
      count: orgs.length,
      timestamp: new Date().toISOString()
    });

    return {
      user: result.user,
      orgs,
      accessToken: result.accessToken,
    };
  } catch (err) {
    console.error('[Org:Layout] CRITICAL getData() CRASH', {
      message: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined,
      timestamp: new Date().toISOString()
    });
    throw err;
  }
}

export default async function OrgLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { orgSlug: string };
}) {
  const { user, orgs, accessToken } = await getData();

  // 🔍 EXTREME VISIBILITY: Diagnostic Slug Resolution
  console.debug('[Org:Layout] SLUG RESOLUTION START', {
    urlOrgSlug: params.orgSlug,
    orgCount: orgs.length,
    orgSlugs: orgs.map(o => ({ id: o.id, slug: o.slug })),
    isUUID: /^[0-9a-f]{8}-/.test(params.orgSlug),
    timestamp: new Date().toISOString(),
  });

  // Validate the slug exists in user's orgs
  // Logic: Try slug match first, then fallback to ID match for legacy/desynced links
  const activeOrg = orgs.find((o) => o.slug === params.orgSlug) || 
                    orgs.find((o) => o.id === params.orgSlug);

  const matchMethod = orgs.find((o) => o.slug === params.orgSlug) ? 'BY_SLUG' : 
                    orgs.find((o) => o.id === params.orgSlug) ? 'BY_ID_FALLBACK' : 'NO_MATCH';

  console.info('[Org:Layout] SLUG RESOLUTION DECISION', {
    matchMethod,
    activeOrg: activeOrg ? { id: activeOrg.id, slug: activeOrg.slug } : 'NOT_FOUND',
    urlOrgSlug: params.orgSlug,
    timestamp: new Date().toISOString(),
  });

  // Normalize URL to Slug if matched by ID mapping
  if (matchMethod === 'BY_ID_FALLBACK' && activeOrg) {
    logger.info(`[Org Layout] Normalizing URL from UUID ${params.orgSlug} to Slug ${activeOrg.slug}`);
    redirect(ROUTES.DASHBOARD(activeOrg.slug));
  }

  // If org doesn't exist or slug is invalid for this user, check if we should redirect
  // For now, if not found, we redirect to onboarding or global dashboard
  if (!activeOrg && params.orgSlug !== 'new') {
    logger.warn(
      `[Org Layout] Org slug/ID ${params.orgSlug} not found in user orgs - REDIRECTING TO ONBOARDING`
    );
    redirect(ROUTES.ONBOARDING);
  }

  return (
    <>
      <AuthStoreInitializer user={user} accessToken={accessToken} />
      <WorkspaceInitializer orgs={orgs} urlOrgSlug={params.orgSlug} />
      <DynamicThemeInjector orgs={orgs} urlOrgSlug={params.orgSlug} />

      <WorkspaceLayoutContent orgSlug={params.orgSlug}>
        {children}
      </WorkspaceLayoutContent>
    </>
  );
}
