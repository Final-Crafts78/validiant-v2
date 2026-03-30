import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { API_CONFIG, ROUTES } from '@/lib/config';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

/**
 * Dashboard Root Redirect Page
 * 
 * When a user hits /dashboard directly:
 * 1. Fetch their organizations.
 * 2. Redirect to the first organization's scoped dashboard.
 * 3. Fallback to onboarding if no organizations exist.
 */
export default async function DashboardRedirectPage() {
  const cookieStore = cookies();
  const accessToken = cookieStore.get('accessToken');

  if (!accessToken) {
    redirect(ROUTES.LOGIN);
  }

  // Determine API Base URL
  const raw = (
    process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'
  ).replace(/\/+$/, '');
  const baseUrl = raw.endsWith('/api/v1') ? raw : `${raw}/api/v1`;
  const apiUrl = `${baseUrl}${API_CONFIG.ENDPOINTS.ORGANIZATIONS.MY}`;

  // 🔍 HIGH-VISIBILITY SSR INSTRUMENTATION
  const requestId = `dash-redir-${Math.random().toString(36).substring(7)}`;
  // eslint-disable-next-line no-console
  console.log(`[Dashboard:Redirect] [${requestId}] Starting fetch for organizations`, { 
    baseUrl, 
    apiUrl,
    hasToken: !!accessToken?.value,
    tokenPrefix: accessToken?.value?.substring(0, 10),
    timestamp: new Date().toISOString()
  });

  try {
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken.value}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    // eslint-disable-next-line no-console
    console.log(`[Dashboard:Redirect] [${requestId}] API Response received`, {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
      timestamp: new Date().toISOString()
    });

    if (!response.ok) {
      logger.error(`[Dashboard:Redirect] [${requestId}] API returned ${response.status}`);
      // eslint-disable-next-line no-console
      console.warn(`[Dashboard:Redirect] [${requestId}] Redirection to ONBOARDING due to non-OK response`);
      redirect(ROUTES.ONBOARDING);
    }

    const json = await response.json();
    
    // eslint-disable-next-line no-console
    console.log(`[Dashboard:Redirect] [${requestId}] JSON parsed`, {
      hasData: !!json?.data,
      orgCount: json?.data?.organizations?.length || 0,
      firstOrgSlug: json?.data?.organizations?.[0]?.slug,
      timestamp: new Date().toISOString()
    });

    const organizations = json?.data?.organizations;

    if (organizations && organizations.length > 0) {
      const activeOrg = organizations[0];
      if (activeOrg?.slug) {
        logger.log(`[Dashboard:Redirect] [${requestId}] Redirecting to ${activeOrg.slug}`);
        // eslint-disable-next-line no-console
        console.log(`[Dashboard:Redirect] [${requestId}] FINAL REDIRECT to /${activeOrg.slug}`);
        redirect(ROUTES.DASHBOARD(activeOrg.slug));
      }
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes('NEXT_REDIRECT')) {
      throw error;
    }
    // eslint-disable-next-line no-console
    console.error(`[Dashboard:Redirect] [${requestId}] CRITICAL FETCH ERROR`, {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });
    logger.error('[Dashboard:Redirect] Failed to fetch organizations:', error);
  }

  // Fallback: no organizations found or error occurred
  redirect(ROUTES.ONBOARDING);
}
