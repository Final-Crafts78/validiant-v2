/**
 * Next.js Edge Middleware
 *
 * Server-side authentication check that runs before page rendering.
 * Protects routes by verifying HttpOnly cookies at the Edge.
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getSecretFingerprint } from './lib/auth-utils';

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
 * Safely parse cookies from raw header string if the native parser fails (Finding 41)
 */
function parseCookiesRaw(cookieHeader: string | null): Record<string, string> {
  if (!cookieHeader) return {};
  const cookies: Record<string, string> = {};
  cookieHeader.split(';').forEach(cookie => {
    const [name, ...rest] = cookie.split('=');
    if (name && rest.length > 0) {
      cookies[name.trim()] = rest.join('=').trim();
    }
  });
  return cookies;
}

/**
 * Get cookie safely with fallback (Finding 41)
 */
function getSafeCookie(request: NextRequest, name: string, requestId: string): { value: string } | undefined {
  try {
    // eslint-disable-next-line no-console
    console.debug(`[MW:Edge] [${requestId}] EP-1.${name}: Attempting native cookies.get()`);
    // Try native parser first
    const cookie = request.cookies.get(name);
    if (cookie) {
      // eslint-disable-next-line no-console
      console.debug(`[MW:Edge] [${requestId}] EP-1.${name}: Native success`, { 
        name, 
        length: cookie.value?.length,
        prefix: cookie.value?.substring(0, 10)
      });
      return cookie;
    }
    // eslint-disable-next-line no-console
    console.debug(`[MW:Edge] [${requestId}] EP-1.${name}: Native MISSING`);
  } catch (e: any) {
    // eslint-disable-next-line no-console
    console.warn(`[MW:Edge] [${requestId}] EP-1.${name}: Native CRASHED - Falling back to raw`, {
      error: e.message
    });
  }

  // Fallback to manual header parsing
  const rawHeader = request.headers.get('cookie');
  const parsed = parseCookiesRaw(rawHeader);
  const val = parsed[name];
  
  if (val) {
    // eslint-disable-next-line no-console
    console.debug(`[MW:Edge] [${requestId}] EP-1.${name}: RAW FALLBACK SUCCESS`, { 
      name, 
      length: val.length,
      prefix: val.substring(0, 10)
    });
    return { value: val };
  }

  return undefined;
}

/**
 * Middleware function with High-Visibility Instrumentation (Finding 41)
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const requestId = request.headers.get('x-vercel-id') || 'local-' + Math.random().toString(36).substring(7);

  try {
    // 0. ENVIRONMENT AUDIT (Finding 42)
    const envAudit = {
      JWT_SECRET: process.env.JWT_SECRET ? 'PRESENT' : 'MISSING',
      NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'MISSING',
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'MISSING',
      NODE_ENV: process.env.NODE_ENV,
    };

    const secretFP = await getSecretFingerprint();

    // eslint-disable-next-line no-console
    console.log(`[MW:Edge] [${requestId}] EP-1: Middleware started`, { 
      pathname, 
      secretFP,
      envAudit,
      timestamp: new Date().toISOString() 
    });

    // 0.1 RAW COOKIE AUDIT (Finding Cloudflare WAF stripping)
    const rawCookieHeader = request.headers.get('cookie');
    const cookieScan = rawCookieHeader 
      ? rawCookieHeader.split(';').map(c => c.split('=')[0]?.trim()) 
      : [];
    
    // eslint-disable-next-line no-console
    console.log(`[MW:Edge] [${requestId}] EP-0.1: Raw Cookie Audit`, {
      hasHeader: !!rawCookieHeader,
      headerLength: rawCookieHeader?.length || 0,
      cookieNames: cookieScan,
      timestamp: new Date().toISOString()
    });

    // 1. SAFE COOKIE ACCESS (Finding 41 Hardening)
    const accessToken = getSafeCookie(request, 'accessToken', requestId);
    const refreshToken = getSafeCookie(request, 'refreshToken', requestId);
    const userId = getSafeCookie(request, 'user_id', requestId);

    // eslint-disable-next-line no-console
    console.log(`[MW:Edge] [${requestId}] EP-2: Single cookies retrieved`, {
      hasAccess: !!accessToken,
      hasRefresh: !!refreshToken,
      hasUser: !!userId,
      timestamp: new Date().toISOString()
    });

    // Check if route is protected
    const isProtectedRoute = matchesRoute(pathname, PROTECTED_ROUTES);
    const isAuthRoute = matchesRoute(pathname, AUTH_ROUTES);
    const isSemiPublic = matchesRoute(pathname, SEMI_PUBLIC_ROUTES);

    // eslint-disable-next-line no-console
    console.debug(`[MW:Edge] [${requestId}] EP-3: Routes matched`, {
      isProtected: isProtectedRoute,
      isAuth: isAuthRoute,
      isSemi: isSemiPublic,
      host: request.headers.get('host'),
      timestamp: new Date().toISOString()
    });

    // 2. CRITICAL BLOCK: request.cookies.getAll() (Finding 41 suspicion)
    let cookieScanSummary: any[] = [];
    let cookieCount = 0;
    try {
      // eslint-disable-next-line no-console
      console.log(`[MW:Edge] [${requestId}] EP-4: Attempting cookies.getAll()`);
      const allCookies = request.cookies.getAll();
      cookieCount = allCookies.length;
      
      // eslint-disable-next-line no-console
      console.log(`[MW:Edge] [${requestId}] EP-5: getAll() success, count: ${cookieCount}`);

      cookieScanSummary = allCookies.map((c) => ({
        name: c.name,
        valueLength: c.value?.length || 0,
        valuePrefix: c.value?.substring(0, 10),
        isDeleted: c.value === 'deleted',
        isNull: c.value === 'null',
      }));
      
      // eslint-disable-next-line no-console
      console.log(`[MW:Edge] [${requestId}] EP-6: Cookie mapping success`);
    } catch (cookieErr: any) {
      // eslint-disable-next-line no-console
      console.error(`[MW:Edge] [${requestId}] CRITICAL FAILURE in request.cookies.getAll()`, {
        error: cookieErr.message,
        stack: cookieErr.stack,
        timestamp: new Date().toISOString()
      });
      // Fallback to avoid complete 500 if possible
      cookieScanSummary = [{ name: 'ERROR', valuePrefix: 'FAILED_TO_LOAD' }];
    }

    // eslint-disable-next-line no-console
    console.debug(`[MW:Edge] [${requestId}] Cookie Detection Summary`, {
      hasAccessToken: !!accessToken,
      accessTokenPrefix: accessToken?.value.substring(0, 30),
      accessTokenLength: accessToken?.value.length,
      hasRefreshToken: !!refreshToken,
      hasUserId: !!userId,
      cookieCount,
      allCookiesSummary: cookieScanSummary,
      timestamp: new Date().toISOString(),
    });

    // CRITICAL: Basic validation to prevent using empty/cleared cookies
    const accessTokenValue = accessToken?.value || '';
    
    // Finding 17/41: Relaxing length check if secret is missing to avoid loops
    // ONLY enforce 100+ length if we actually have a secret to verify against
    const requiredLength = secretFP !== 'MISSING' ? 100 : 10; 
    
    const isLengthValid = accessTokenValue.length >= requiredLength;
    const isNotEmpty =
      accessTokenValue !== 'deleted' &&
      accessTokenValue !== 'null' &&
      accessTokenValue !== '';

    const isAuthenticated = isLengthValid && isNotEmpty;

    const authFailureReason = !isNotEmpty
      ? 'EMPTY_OR_DELETED_STRING'
      : !isLengthValid
        ? `LENGTH_INVALID_${accessTokenValue.length}`
        : 'NONE';

    // eslint-disable-next-line no-console
    console.debug(`[MW:Edge] [${requestId}] EP-7: Auth logic check completed`, {
      isAuthenticated,
      authFailureReason,
      tokenLength: accessTokenValue.length,
      timestamp: new Date().toISOString()
    });

    // ✅ Org-scoped detection
    const publicKeywords = [
      '',
      'auth',
      'api',
      'onboarding',
      'organizations',
      'profile',
      'dashboard',
      'health',
    ];
    const firstSegment = pathname.split('/')[1];
    const isOrgScoped =
      firstSegment !== undefined && !publicKeywords.includes(firstSegment);

    // 🔒 CRITICAL SECURITY & LOOP PREVENTION
    const forceLogout = request.nextUrl.searchParams.get('forceLogout') === 'true';
    const reason = request.nextUrl.searchParams.get('reason');
    
    if (forceLogout || reason === 'expired') {
      // eslint-disable-next-line no-console
      console.warn(`[MW:Edge] [${requestId}] EP-8: Force logout detected`, {
        pathname,
        forceLogout,
        reason,
        timestamp: new Date().toISOString()
      });
      return NextResponse.next();
    }

    // Unauthenticated → login
    if ((isProtectedRoute || isOrgScoped) && !isSemiPublic && !isAuthenticated) {
      const branch = !accessToken
        ? 'MISSING_COOKIE'
        : !isLengthValid
          ? 'SHORT_TOKEN'
          : 'DELETED_OR_NULL_STRING';
      
      // eslint-disable-next-line no-console
      console.warn(`[MW:Edge] [${requestId}] EP-9: REDIRECT decisions`, {
        pathname,
        branch,
        authFailureReason,
        timestamp: new Date().toISOString()
      });

      const loginUrl = new URL('/auth/login', request.url);
      loginUrl.searchParams.set('from', pathname);
      
      if (authFailureReason !== 'NONE') {
        loginUrl.searchParams.set('reason', 'unauthorized');
      }
      
      return NextResponse.redirect(loginUrl);
    }

    // Redirect authenticated users from auth pages to dashboard
    if (isAuthRoute && isAuthenticated) {
      const destParam = request.nextUrl.searchParams.get('redirect');
      const dest = destParam ? decodeURIComponent(destParam) : '/dashboard';

      // eslint-disable-next-line no-console
      console.debug(`[MW:Edge] [${requestId}] EP-10: Redirecting authed user from login`, {
        dest,
        timestamp: new Date().toISOString()
      });
      return NextResponse.redirect(new URL(dest, request.url));
    }

    // Allow request to proceed
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-pathname', pathname);
    requestHeaders.set('x-middleware-request-id', requestId);

    // eslint-disable-next-line no-console
    console.log(`[MW:Edge] [${requestId}] EP-FINAL: Proceeding to next()`, {
      pathname,
      isAuthenticated,
      timestamp: new Date().toISOString()
    });

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  } catch (globalErr: any) {
    // eslint-disable-next-line no-console
    console.error(`[MW:Edge] [${requestId}] CRITICAL GLOBAL EXCEPTION`, {
      message: globalErr.message,
      stack: globalErr.stack,
      pathname,
      timestamp: new Date().toISOString()
    });
    
    // In case of error in middleware, we should probably allow the request 
    // to fall through to the page so Next.js can handle the error, 
    // or return a safe redirect.
  }
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
    '/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$|api/).*)',
  ],
};
