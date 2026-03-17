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

  // Cookie configuration mirroring auth.actions.ts
  const COOKIE_OPTIONS = {
    httpOnly: true,
    secure: true, // MUST be true for SameSite=None
    sameSite: 'none' as const, // Match Hono backend exactly
    path: '/',
    domain: process.env.NODE_ENV === 'production' ? '.validiant.in' : undefined,
  };

  console.warn('[Session Cleanup] Clearing authentication cookies');

  // Safely delete cookies in a Route Handler (not allowed in Server Components)
  // CRITICAL: Uses explicit overwrite method + delete() fallback to force browser compliance.
  // Mirrors clearAuthCookies() in auth.actions.ts
  cookieStore.set({
    name: 'accessToken',
    value: '',
    expires: new Date(0), // Expire instantly in the past
    ...COOKIE_OPTIONS,
  });

  cookieStore.set({
    name: 'refreshToken',
    value: '',
    expires: new Date(0),
    ...COOKIE_OPTIONS,
  });

  cookieStore.delete({
    name: 'accessToken',
    ...COOKIE_OPTIONS,
  });

  cookieStore.delete({
    name: 'refreshToken',
    ...COOKIE_OPTIONS,
  });

  // Redirect back to login, preserving the intended destination if provided
  const loginUrl = new URL(ROUTES.LOGIN, request.url);
  if (redirectTo && redirectTo.startsWith('/')) {
    loginUrl.searchParams.set('redirect', redirectTo);
  }

  return NextResponse.redirect(loginUrl);
}
