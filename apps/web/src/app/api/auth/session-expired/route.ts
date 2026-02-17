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
  const cookieStore = cookies();

  console.log('[Session Cleanup] Clearing authentication cookies');

  // Safely delete cookies in a Route Handler (not allowed in Server Components)
  cookieStore.delete('accessToken');
  cookieStore.delete('refreshToken');

  // Redirect back to login
  return NextResponse.redirect(new URL(ROUTES.LOGIN, request.url));
}
