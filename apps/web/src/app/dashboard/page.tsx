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

  try {
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken.value}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      logger.error(`[Dashboard Redirect] API returned ${response.status}`);
      redirect(ROUTES.ONBOARDING);
    }

    const json = await response.json();
    const organizations = json?.data?.organizations;

    if (organizations && organizations.length > 0) {
      const activeOrg = organizations[0];
      if (activeOrg?.slug) {
        logger.log(`[Dashboard Redirect] Redirecting to ${activeOrg.slug}`);
        redirect(ROUTES.DASHBOARD(activeOrg.slug));
      }
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes('NEXT_REDIRECT')) {
      throw error;
    }
    logger.error('[Dashboard Redirect] Failed to fetch organizations:', error);
  }

  // Fallback: no organizations found or error occurred
  redirect(ROUTES.ONBOARDING);
}
