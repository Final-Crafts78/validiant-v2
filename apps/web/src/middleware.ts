/**
 * Next.js Edge Middleware
 *
 * Server-side authentication check that runs before page rendering.
 * Protects routes by verifying HttpOnly cookies at the Edge.
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Protected route patterns
 * These routes require authentication
 */
const PROTECTED_ROUTES = [
  '/dashboard',
  '/projects',
  '/tasks',
  '/organizations',
  '/profile',
  '/settings',
];

/**
 * Auth route patterns
 * These routes should redirect to dashboard if already authenticated
 */
const AUTH_ROUTES = ['/auth/login', '/auth/register', '/auth/forgot-password'];

// ✅ NEW: routes that are accessible while authenticated but NOT gated
const SEMI_PUBLIC_ROUTES = ['/auth/verify-email', '/dashboard/onboarding'];

/**
 * Check if path matches any route pattern
 */
function matchesRoute(pathname: string, routes: string[]): boolean {
  return routes.some((route) => pathname.startsWith(route));
}

/**
 * Middleware function
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Get authentication cookie
  const accessToken = request.cookies.get('accessToken');
  const isAuthenticated = !!accessToken;

  // Check if route is protected
  const isProtectedRoute = matchesRoute(pathname, PROTECTED_ROUTES);
  const isAuthRoute = matchesRoute(pathname, AUTH_ROUTES);
  const isSemiPublic = matchesRoute(pathname, SEMI_PUBLIC_ROUTES);

  // Unauthenticated → login
  if (isProtectedRoute && !isSemiPublic && !isAuthenticated) {
    const loginUrl = new URL('/auth/login', request.url);
    // Preserve the intended destination
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect authenticated users from auth pages to dashboard
  if (isAuthRoute && isAuthenticated) {
    // Check if there's a 'from' parameter to redirect back
    const fromParam = request.nextUrl.searchParams.get('from');
    const dest = new URL(
      fromParam && fromParam.startsWith('/') ? fromParam : '/dashboard',
      request.url
    );
    return NextResponse.redirect(dest);
  }

  // Allow request to proceed (default allow pattern)
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-pathname', pathname);

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

/**
 * Middleware configuration
 * Specify which routes this middleware should run on
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api routes (handled separately)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$|api/).*)',
  ],
};
