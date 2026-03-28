/**
 * Session Expired Route Handler
 *
 * Handles cookie deletion when authentication fails.
 * Server Components cannot mutate cookies - only Route Handlers can.
 *
 * This route is called when:
 * - Access token is invalid/expired (401/403)
 * - API response is malformed
 * - User data is missing or invalid
 */

import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { ROUTES } from '@/lib/config';
import { getBaseCookieOptions } from '@/lib/auth-utils';

/**
 * GET /api/auth/session-expired
 *
 * Clears authentication cookies and redirects to login
 */
export async function GET(request: Request) {
  const referer = request.headers.get('referer') ?? 'NO_REFERER';
  const { searchParams } = new URL(request.url);
  const redirectTo = searchParams.get('redirect');

  console.warn('[Session Expired] TRIGGERED', {
    redirectTo,
    referer,
    timestamp: new Date().toISOString(),
    url: request.url,
  });

  const cookieStore = cookies();
  const requestUrl = new URL(request.url);
  const requestHostname = requestUrl.hostname;

  // Cookie configuration using shared utility
  const COOKIE_OPTIONS = {
    ...getBaseCookieOptions(requestHostname),
    maxAge: 0, // CRITICAL: Force immediate expiration
  };

  console.debug('[SessionExpired] Resolved Cookie Options', {
    domain: (COOKIE_OPTIONS as any).domain || 'UNDEFINED (Host-only)',
    path: COOKIE_OPTIONS.path,
    secure: COOKIE_OPTIONS.secure,
    sameSite: COOKIE_OPTIONS.sameSite,
    isProduction: process.env.NODE_ENV === 'production',
  });

  console.warn('[SessionExpired] Clearing authentication cookies', {
    options: COOKIE_OPTIONS,
    existingCookies: cookieStore.getAll().map((c) => c.name),
  });

  // Safely delete cookies in a Route Handler (not allowed in Server Components)
  // CRITICAL: Uses explicit overwrite method for multiple potential domain scopes
  // (.validiant.in and host-only) to ensure browser compliance.
  
  const domainsToClear = [COOKIE_OPTIONS.domain, undefined];
  const cookieNames = ['accessToken', 'refreshToken', 'user_id', 'oauth_state'];

  console.warn('[SessionExpired] Starting multi-domain cookie clear', {
    domains: domainsToClear,
    names: cookieNames,
  });

  for (const domain of domainsToClear) {
    for (const name of cookieNames) {
      cookieStore.set({
        name,
        value: '',
        expires: new Date(0),
        path: '/',
        secure: COOKIE_OPTIONS.secure,
        sameSite: 'lax',
        domain,
      });
    }
  }

  console.debug('[SessionExpired] Cookie deletion sequence completed');

  // Redirect back to login, preserving the intended destination if provided
  // Redirect back to login, preserving the intended destination if provided
  const loginUrl = new URL(ROUTES.LOGIN, request.url);
  if (redirectTo && redirectTo.startsWith('/')) {
    loginUrl.searchParams.set('redirect', redirectTo);
  }

  const response = NextResponse.redirect(loginUrl);

  console.info('[SessionExpired] Finalizing redirect', {
    target: loginUrl.toString(),
    setCookieHeaders: response.headers.getSetCookie(),
    timestamp: new Date().toISOString(),
  });

  return response;
}
