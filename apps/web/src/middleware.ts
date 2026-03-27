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
  '/dashboard/onboarding',
  '/organizations',
  '/profile',
  '/dashboard',
];

const AUTH_ROUTES = ['/auth/login', '/auth/register', '/auth/forgot-password'];

const SEMI_PUBLIC_ROUTES = ['/auth/verify-email'];

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
  const refreshToken = request.cookies.get('refreshToken');
  const userId = request.cookies.get('user_id');

  console.debug('[MW:Edge] Cookie Detection', {
    hasAccessToken: !!accessToken,
    accessTokenPrefix: accessToken?.value.substring(0, 30),
    accessTokenLength: accessToken?.value.length,
    hasRefreshToken: !!refreshToken,
    hasUserId: !!userId,
    allCookies: request.cookies.getAll().map((c) => ({
      name: c.name,
      valueLength: c.value?.length || 0,
      valuePrefix: c.value?.substring(0, 10),
    })),
  });
  // CRITICAL: Basic validation to prevent using empty/cleared cookies
  const isAuthenticated = !!accessToken && accessToken.value.length > 100;

  // Check if route is protected
  const isProtectedRoute = matchesRoute(pathname, PROTECTED_ROUTES);
  const isAuthRoute = matchesRoute(pathname, AUTH_ROUTES);
  const isSemiPublic = matchesRoute(pathname, SEMI_PUBLIC_ROUTES);

  console.debug('[MW:Edge] Auth State', {
    isAuthenticated,
    path: pathname,
    isProtectedRoute,
    isOrgScoped: undefined, // Will be defined later
    isAuthRoute,
  });

  // Debug logging for authentication issues
  if (pathname.includes('/dashboard') || pathname.includes('/onboarding')) {
    console.log('[Middleware Debug]', {
      pathname,
      hasAccessToken: !!accessToken,
      accessTokenValue: accessToken
        ? `${accessToken.value.substring(0, 20)}...`
        : 'none',
      allCookies: Array.from(request.cookies.getAll()).map((c) => ({
        name: c.name,
        hasValue: !!c.value,
        valueLength: c.value?.length || 0,
      })),
      isAuthenticated,
      timestamp: new Date().toISOString(),
      url: request.url,
    });
  }

  // ✅ Org-scoped detection: If first segment isn't a known global path, it's an org slug
  const publicKeywords = [
    '',
    'auth',
    'api',
    'onboarding',
    'organizations',
    'profile',
    'dashboard',
  ];
  const firstSegment = pathname.split('/')[1];
  const isOrgScoped =
    firstSegment !== undefined && !publicKeywords.includes(firstSegment);

  // Unauthenticated → login (Gate all protected or org-scoped routes)
  if ((isProtectedRoute || isOrgScoped) && !isSemiPublic && !isAuthenticated) {
    console.warn(
      '[Middleware Redirect] Unauthenticated access to protected route',
      {
        pathname,
        isProtectedRoute,
        isOrgScoped,
        isSemiPublic,
        isAuthenticated,
        accessTokenPresent: !!accessToken,
        accessTokenLength: accessToken?.value.length || 0,
        redirectTo: '/auth/login',
      }
    );

    const loginUrl = new URL('/auth/login', request.url);
    // Preserve the intended destination
    loginUrl.searchParams.set('from', pathname);
    console.debug('[MW:Edge] Redirecting to login', {
      from: pathname,
      target: loginUrl.toString(),
      timestamp: new Date().toISOString(),
    });
    return NextResponse.redirect(loginUrl);
  }

  // Redirect authenticated users from auth pages to dashboard
  if (isAuthRoute && isAuthenticated) {
    const destParam = request.nextUrl.searchParams.get('redirect');
    const dest = destParam ? decodeURIComponent(destParam) : '/dashboard'; // Assuming ROUTES.DASHBOARD_ROOT is '/dashboard'

    console.debug('[MW:Edge] Already authed, redirecting to destination', {
      dest,
      isAuthenticated,
      accessTokenLength: accessToken?.value.length,
      accessTokenPrefix: accessToken?.value.substring(0, 20),
      timestamp: new Date().toISOString(),
    });
    return NextResponse.redirect(new URL(dest, request.url));
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
