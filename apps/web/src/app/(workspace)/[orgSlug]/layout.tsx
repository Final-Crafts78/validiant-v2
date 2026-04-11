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
  console.debug('[Org:Layout] Starting getData() diagnostic fetch', {
    timestamp: new Date().toISOString(),
  });

  try {
    console.debug('[Org:Layout] CALLING getCurrentUserAction()');
    const result = await getCurrentUserAction();
    console.debug('[Org:Layout] RETURNED getCurrentUserAction()', {
      success: result.success,
    });

    console.debug('[Org:Layout] getCurrentUserAction result', {
      success: result.success,
      hasUser: !!result.user,
      error: result.error,
      timestamp: new Date().toISOString(),
    });

    if (!result.success || !result.user || !result.accessToken) {
      const loginReason = result.error || 'AUTH_FAILURE_ORG_LAYOUT';
      console.warn(
        `[Org:Layout] [EP-AUTH-FAIL] Redirecting to SESSION-EXPIRED`,
        {
          reason: loginReason,
          timestamp: new Date().toISOString(),
        }
      );

      // 🔍 EXTREME VISIBILITY: Using session-expired route to prevent loops
      redirect(
        `/api/auth/session-expired?reason=expired&force=true&redirect=${encodeURIComponent('/dashboard')}`
      );
    }

    console.debug('[Org:Layout] CALLING getUserOrganizationsAction()');
    const orgs = await getUserOrganizationsAction(result.accessToken);
    console.debug('[Org:Layout] RETURNED getUserOrganizationsAction()', {
      count: orgs.length,
      orgIds: orgs.map((o) => o.id),
      timestamp: new Date().toISOString(),
    });

    console.debug('[Org:Layout] fetchOrganizations success', {
      count: orgs.length,
      timestamp: new Date().toISOString(),
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
      timestamp: new Date().toISOString(),
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
    orgSlugs: orgs.map((o) => ({ id: o.id, slug: o.slug, name: o.name })),
    isUUID: /^[0-9a-f]{8}-/.test(params.orgSlug),
    timestamp: new Date().toISOString(),
  });

  // If org doesn't exist or slug is invalid for this user, check if we should redirect
  // Logic: Try slug match first (exact), then case-insensitive, then fallback to ID match
  const matchedBySlugExact = orgs.find((o) => o.slug === params.orgSlug);
  const matchedBySlugCaseInsensitive = orgs.find(
    (o) => o.slug?.toLowerCase() === params.orgSlug?.toLowerCase()
  );
  const matchedById = orgs.find((o) => o.id === params.orgSlug);

  const activeOrg =
    matchedBySlugExact || matchedBySlugCaseInsensitive || matchedById;

  const matchMethod = matchedBySlugExact
    ? 'BY_SLUG_EXACT'
    : matchedBySlugCaseInsensitive
      ? 'BY_SLUG_CASE_INSENSITIVE'
      : matchedById
        ? 'BY_ID_FALLBACK'
        : 'NO_MATCH';

  console.info('[Org:Layout] SLUG RESOLUTION DECISION', {
    matchMethod,
    activeOrg: activeOrg
      ? { id: activeOrg.id, slug: activeOrg.slug }
      : 'NOT_FOUND',
    urlOrgSlug: params.orgSlug,
    timestamp: new Date().toISOString(),
  });

  // Normalize URL to Slug if matched by ID or Case Mapping
  if (
    (matchMethod === 'BY_ID_FALLBACK' ||
      matchMethod === 'BY_SLUG_CASE_INSENSITIVE') &&
    activeOrg &&
    activeOrg.slug
  ) {
    logger.info(
      `[Org Layout] Normalizing URL from ${params.orgSlug} to Canonical Slug ${activeOrg.slug} (Method: ${matchMethod})`
    );
    redirect(ROUTES.DASHBOARD(activeOrg.slug));
  }

  if (!activeOrg && params.orgSlug !== 'new') {
    logger.warn(
      `[Org Layout] Org slug/ID ${params.orgSlug} not found in user orgs - REDIRECTING TO ONBOARDING`,
      {
        requestedSlug: params.orgSlug,
        orgCount: orgs.length,
        availableSlugs: orgs.map((o) => o.slug),
        availableIds: orgs.map((o) => o.id),
        userId: user.id,
        timestamp: new Date().toISOString(),
      }
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
