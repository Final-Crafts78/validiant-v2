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
  console.log(`[Dashboard:Redirect] [${requestId}] EP-D1: Starting fetch sequence`);

  // 🔍 URL NORMALIZATION (Finding 46 Fix)
  const raw = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1').replace(/\/+$/, '');
  const baseUrl = raw.endsWith('/api/v1') ? raw : `${raw}/api/v1`;
  
  // Safety check: if endpoints already contain /api/v1, don't double it
  let endpoint = API_CONFIG.ENDPOINTS.ORGANIZATIONS.MY;
  if (endpoint.startsWith('/api/v1')) {
    endpoint = endpoint.replace('/api/v1', '');
  }
  
  const apiUrl = `${baseUrl}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

  // eslint-disable-next-line no-console
  console.log(`[Dashboard:Redirect] [${requestId}] EP-D2: Fetching from ${apiUrl}`, {
    baseUrl,
    endpoint,
    finalUrl: apiUrl,
    tokenLength: accessToken.value.length,
  });

  const startFetch = Date.now();
  try {
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken?.value}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    const elapsed = Date.now() - startFetch;
    // eslint-disable-next-line no-console
    console.log(`[Dashboard:Redirect] [${requestId}] EP-D3: API Response received in ${elapsed}ms`, {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
    });

    if (!response.ok) {
      logger.error(`[Dashboard:Redirect] [${requestId}] API returned ${response.status}`);
      // eslint-disable-next-line no-console
      console.warn(`[Dashboard:Redirect] [${requestId}] EP-D3.ERROR: Redirection to ONBOARDING due to non-OK response`);
      redirect(ROUTES.ONBOARDING);
    }

    // eslint-disable-next-line no-console
    console.log(`[Dashboard:Redirect] [${requestId}] EP-D4: Starting JSON parse`);
    const json = await response.json();
    
    // eslint-disable-next-line no-console
    console.log(`[Dashboard:Redirect] [${requestId}] EP-D5: JSON parsed`, {
      hasData: !!json?.data,
      orgCount: json?.data?.organizations?.length || 0,
    });

    const organizations = json?.data?.organizations;

    if (organizations && organizations.length > 0) {
      const activeOrg = organizations[0];
      if (activeOrg?.slug) {
        logger.log(`[Dashboard:Redirect] [${requestId}] Redirecting to ${activeOrg.slug}`);
        // eslint-disable-next-line no-console
        console.log(`[Dashboard:Redirect] [${requestId}] EP-FINAL: Redirecting to /${activeOrg.slug}`);
        redirect(ROUTES.DASHBOARD(activeOrg.slug));
      }
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes('NEXT_REDIRECT')) {
      throw error;
    }
    const elapsedAtError = Date.now() - startFetch;
    // eslint-disable-next-line no-console
    console.error(`[Dashboard:Redirect] [${requestId}] EP-ERROR: CRITICAL FETCH FAIL after ${elapsedAtError}ms`, {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    logger.error('[Dashboard:Redirect] Failed to fetch organizations:', error);
  }

  // Fallback: no organizations found or error occurred
  redirect(ROUTES.ONBOARDING);
}
