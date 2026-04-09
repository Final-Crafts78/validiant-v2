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
    domain: (COOKIE_OPTIONS as { domain?: string }).domain || 'UNDEFINED (Host-only)',
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
<<<<<<< Updated upstream

  const isProd =
    process.env.NODE_ENV === 'production' ||
    process.env.NEXT_PUBLIC_APP_URL?.includes('validiant.in');

  const domainsToClear = [
    COOKIE_OPTIONS.domain,
    undefined,
    isProd ? '.validiant.in' : undefined,
  ].filter((d, i, arr) => arr.indexOf(d) === i); // Unique domains

  const cookieNames = ['accessToken', 'refreshToken', 'user_id', 'oauth_state'];

  console.warn(
    '[SessionExpired] Starting multi-domain cookie clear (Finding 48)',
=======
  const domainsToClear = [COOKIE_OPTIONS.domain, '.validiant.in', undefined];
  const cookieNames = [
    'accessToken',
    'refreshToken',
    'user_id',
    'oauth_state',
    'auth-storage',
  ];

  console.warn(
    '[SessionExpired] Starting AGGRESSIVE multi-domain cookie clear',
>>>>>>> Stashed changes
    {
      domains: domainsToClear,
      names: cookieNames,
      timestamp: new Date().toISOString(),
    }
  );

  for (const domain of domainsToClear) {
    for (const name of cookieNames) {
<<<<<<< Updated upstream
      cookieStore.set({
        name,
        value: '',
        expires: new Date(0),
        path: '/',
        secure: COOKIE_OPTIONS.secure,
        sameSite: 'lax',
        domain: domain as string | undefined, // Type cast for iteration
      });
=======
      try {
        cookieStore.set({
          name,
          value: '',
          expires: new Date(0),
          path: '/',
          secure: COOKIE_OPTIONS.secure,
          sameSite: 'lax',
          domain,
        });
      } catch (err) {
        console.error(
          `[SessionExpired] Failed to clear cookie: ${name} on domain: ${domain}`,
          err
        );
      }
>>>>>>> Stashed changes
    }
  }

  console.debug('[SessionExpired] Cookie deletion sequence completed');

  // Redirect back to login, preserving the intended destination if provided
  const loginUrl = new URL(ROUTES.LOGIN, request.url);
<<<<<<< Updated upstream

  // Normalize redirect param (sometimes it's 'redirect', sometimes 'from')
  const redirectToVal = redirectTo || searchParams.get('from');
  if (redirectToVal && redirectToVal.startsWith('/')) {
    loginUrl.searchParams.set('redirect', redirectToVal);
  }

  // Forward the reason and force flags to the login page to signal to middleware
  // CRITICAL: Middleware needs these to break redirection loops.
  const reasonVal = searchParams.get('reason') || 'expired';
  loginUrl.searchParams.set('reason', reasonVal);

  const forceVal =
    searchParams.get('force') || searchParams.get('forceLogout') || 'true';
  loginUrl.searchParams.set('forceLogout', forceVal);

  console.info('[SessionExpired] Propagating loop prevention flags', {
    reason: reasonVal,
    forceLogout: forceVal,
    target: loginUrl.pathname + loginUrl.search,
  });
=======
  
  // 🔍 EXTREME VISIBILITY: Flag Propagation Hardening
  const redirectParam = searchParams.get('redirect');
  const reasonParam = searchParams.get('reason') || 'expired';
  const forceParam = searchParams.get('force') || 'true';

  if (redirectParam && redirectParam.startsWith('/')) {
    loginUrl.searchParams.set('redirect', redirectParam);
  }
  
  loginUrl.searchParams.set('reason', reasonParam);
  loginUrl.searchParams.set(
    'forceLogout',
    forceParam === 'true' ? 'true' : 'true'
  ); // Force true if we hit this route
>>>>>>> Stashed changes

  const response = NextResponse.redirect(loginUrl);

  // DEBUG: Inspect the headers that will be sent to the browser
  const setCookieHeaders = response.headers.getSetCookie();

<<<<<<< Updated upstream
  console.info('[SessionExpired] [EP-FINAL] Finalizing redirect', {
=======
  console.info('[SessionExpired] Finalizing redirect with EXTREME VISIBILITY', {
>>>>>>> Stashed changes
    target: loginUrl.toString(),
    reason: reasonParam,
    force: forceParam,
    setCookieCount: setCookieHeaders.length,
<<<<<<< Updated upstream
    setCookieHeaders: setCookieHeaders.map((h) => h.split(';')[0] + '; ...'), // Partial for security
=======
>>>>>>> Stashed changes
    timestamp: new Date().toISOString(),
  });

  return response;
}
