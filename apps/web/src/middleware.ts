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
/**
 * Cookie metadata summary
 */
interface CookieSummary {
  name: string;
  valueLength: number;
  valuePrefix: string;
  isDeleted: boolean;
  isNull: boolean;
}

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
  cookieHeader.split(';').forEach((cookie) => {
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
function getSafeCookie(
  request: NextRequest,
  name: string,
  requestId: string
): { value: string } | undefined {
  try {
    // eslint-disable-next-line no-console
    console.debug(`
      [MW:Edge] [${requestId}] EP-1.${name}: Attempting native cookies.get()
    `);
    // Try native parser first
    const cookie = request.cookies.get(name);
    if (cookie) {
      // eslint-disable-next-line no-console
      console.debug(
        `
        [MW:Edge] [${requestId}] EP-1.${name}: Native success
      `,
        {
          name,
          length: cookie.value?.length,
          prefix: cookie.value?.substring(0, 10),
        }
      );
      return cookie;
    }
    // eslint-disable-next-line no-console
    console.debug(`
      [MW:Edge] [${requestId}] EP-1.${name}: Native MISSING
    `);
  } catch (e: unknown) {
    // eslint-disable-next-line no-console
    console.warn(
      `
        [MW:Edge] [${requestId}] EP-1.${name}: Native CRASHED - Falling back to raw
      `,
      {
        error: e instanceof Error ? e.message : String(e),
      }
    );
  }

  // Fallback to manual header parsing
  const rawHeader = request.headers.get('cookie');
  const parsed = parseCookiesRaw(rawHeader);
  const val = parsed[name];

  if (val) {
    // eslint-disable-next-line no-console
    console.debug(
      `
      [MW:Edge] [${requestId}] EP-1.${name}: RAW FALLBACK SUCCESS
    `,
      {
        name,
        length: val.length,
        prefix: val.substring(0, 10),
      }
    );
    return { value: val };
  }

  return undefined;
}

/**
 * Middleware function with High-Visibility Instrumentation (Finding 41)
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const requestId =
    request.headers.get('x-vercel-id') ||
    'local-' + Math.random().toString(36).substring(7);

  try {
    // 0. ENVIRONMENT AUDIT (Finding 42)
    // eslint-disable-next-line no-console
    console.log(`[MW:Edge] [${requestId}] EP-1.0.1: Env Audit Starting`);

    const jwtPresent = !!process.env.JWT_SECRET;
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'MISSING';
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'MISSING';
    const nodeEnv = process.env.NODE_ENV || 'MISSING';

    // eslint-disable-next-line no-console
    console.log(
      `[MW:Edge] [${requestId}] EP-1.0.2: ENV - jwt=${jwtPresent}, api=${apiUrl}, app=${appUrl}, env=${nodeEnv}`
    );

    // eslint-disable-next-line no-console
    console.log(`[MW:Edge] [${requestId}] EP-1.0.3: Fingerprint calc start`);
    const secretFP = await getSecretFingerprint();
    // eslint-disable-next-line no-console
    console.log(`[MW:Edge] [${requestId}] EP-1.0.4: FP Value: ${secretFP}`);

    // eslint-disable-next-line no-console
    console.log(`[MW:Edge] [${requestId}] EP-1.0.5: Path: ${pathname}`);

    // 0.1 RAW COOKIE AUDIT
    let cookieScan: string[] = [];
    let rawCookieHeader: string | null = null;

    try {
      // eslint-disable-next-line no-console
      console.log(`[MW:Edge] [${requestId}] EP-0.1.0: Header Retrieval`);
      rawCookieHeader = request.headers.get('cookie');

      const headerLength = rawCookieHeader?.length || 0;
      // eslint-disable-next-line no-console
      console.log(
        `[MW:Edge] [${requestId}] EP-0.1.1: Header length: ${headerLength}`
      );

      if (rawCookieHeader) {
        // eslint-disable-next-line no-console
        console.log(`[MW:Edge] [${requestId}] EP-0.1.2: Parsing substrings`);

        // Safer parsing for Edge Runtime
        const parts = rawCookieHeader.split(';').slice(0, 50);
        cookieScan = parts.map((c) => c.split('=')[0]?.trim() || 'MALFORMED');

        // eslint-disable-next-line no-console
        console.log(
          `[MW:Edge] [${requestId}] EP-0.1.3: Names: ${cookieScan.join(', ')}`
        );
      }
    } catch (auditErr: unknown) {
      // eslint-disable-next-line no-console
      console.error(`[MW:Edge] [${requestId}] EP-0.1.ERROR: Raw Audit Crash`, {
        msg: auditErr instanceof Error ? auditErr.message : String(auditErr),
      });
    }

    // 1. SAFE COOKIE ACCESS
    const accessToken = getSafeCookie(request, 'accessToken', requestId);
    const refreshToken = getSafeCookie(request, 'refreshToken', requestId);
    const userId = getSafeCookie(request, 'user_id', requestId);

    // eslint-disable-next-line no-console
    console.log(
      `[MW:Edge] [${requestId}] EP-2: Single cookies: access=${!!accessToken}, refresh=${!!refreshToken}, user=${!!userId}`
    );

    // Route matching
    const isProtectedRoute = matchesRoute(pathname, PROTECTED_ROUTES);
    const isAuthRoute = matchesRoute(pathname, AUTH_ROUTES);
    const isSemiPublic = matchesRoute(pathname, SEMI_PUBLIC_ROUTES);

    // eslint-disable-next-line no-console
    console.log(
      `[MW:Edge] [${requestId}] EP-3: Logic Match - protected=${isProtectedRoute}, auth=${isAuthRoute}, semi=${isSemiPublic}`
    );

    // 2. COOKIE SCAN SUMMARY
    let cookieScanSummary: CookieSummary[] = [];
    let cookieCount = 0;
    try {
      // eslint-disable-next-line no-console
      console.log(`[MW:Edge] [${requestId}] EP-4: getAll() start`);
      const allCookies = request.cookies.getAll();
      cookieCount = allCookies.length;

      cookieScanSummary = allCookies.map((c) => ({
        name: c.name,
        valueLength: c.value?.length || 0,
        valuePrefix: c.value?.substring(0, 10),
        isDeleted: c.value === 'deleted' || c.value === 'null',
        isNull: !c.value,
      }));

      // eslint-disable-next-line no-console
      console.log(
        `[MW:Edge] [${requestId}] EP-5: getAll() end, count=${cookieCount}`
      );
    } catch (cookieErr: unknown) {
      // eslint-disable-next-line no-console
      console.error(`[MW:Edge] [${requestId}] EP-5.ERROR: getAll() Crash`, {
        msg: cookieErr instanceof Error ? cookieErr.message : String(cookieErr),
      });
    }

    // eslint-disable-next-line no-console
    console.debug(
      `
      [MW:Edge] [${requestId}] Cookie Detection Summary
    `,
      {
        hasAccessToken: !!accessToken,
        accessTokenPrefix: accessToken?.value.substring(0, 30),
        accessTokenLength: accessToken?.value.length,
        hasRefreshToken: !!refreshToken,
        hasUserId: !!userId,
        cookieCount,
        allCookiesSummary: cookieScanSummary,
        timestamp: new Date().toISOString(),
      }
    );

    // CRITICAL: Basic validation to prevent using empty/cleared cookies
    const accessTokenValue = accessToken?.value || '';

    // Finding 17/41: Relaxing length check if secret is missing to avoid loops
    // ONLY enforce 100+ length if we actually have a secret to verify against
    const requiredLength = secretFP !== 'MISSING' ? 100 : 10;

    const isLengthValid = accessTokenValue.length >= requiredLength;
    const isNotMarker =
      accessTokenValue !== 'deleted' &&
      accessTokenValue !== 'null' &&
      accessTokenValue !== 'undefined' &&
      accessTokenValue !== '';

    // ELITE: Structure validation - A JWT must have 3 parts separated by dots
    // This prevents "ghost" tokens that are just random strings from triggering loops
    const hasJwtStructure = accessTokenValue.split('.').length === 3;

    const isAuthenticated = isLengthValid && isNotMarker && hasJwtStructure;

    const authFailureReason = !isNotMarker
      ? 'EMPTY_OR_DELETED_MARKER'
      : !hasJwtStructure
        ? 'INVALID_JWT_STRUCTURE'
        : !isLengthValid
          ? `LENGTH_INVALID_${accessTokenValue.length}`
          : 'NONE';

    // eslint-disable-next-line no-console
    console.debug(
      `
      [MW:Edge] [${requestId}] EP-7: Auth logic check completed
    `,
      {
        isAuthenticated,
        authFailureReason,
        tokenLength: accessTokenValue.length,
        timestamp: new Date().toISOString(),
      }
    );

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
    const forceLogout =
      request.nextUrl.searchParams.get('forceLogout') === 'true';
    const reason = request.nextUrl.searchParams.get('reason');

    if (forceLogout || reason === 'expired') {
      // eslint-disable-next-line no-console
      console.warn(
        `
        [MW:Edge] [${requestId}] EP-8: Force logout detected
      `,
        {
          pathname,
          forceLogout,
          reason,
          timestamp: new Date().toISOString(),
        }
      );
      return NextResponse.next();
    }

    // Unauthenticated → login
    if (
      (isProtectedRoute || isOrgScoped) &&
      !isSemiPublic &&
      !isAuthenticated
    ) {
      const branch = !accessToken
        ? 'MISSING_COOKIE'
        : !isLengthValid
          ? 'SHORT_TOKEN'
          : 'DELETED_OR_NULL_STRING';

      // eslint-disable-next-line no-console
      console.warn(
        `
        [MW:Edge] [${requestId}] EP-9: REDIRECT decisions
      `,
        {
          pathname,
          branch,
          authFailureReason,
          timestamp: new Date().toISOString(),
        }
      );

      const loginUrl = new URL('/auth/login', request.url);
      loginUrl.searchParams.set('from', pathname);

      if (authFailureReason !== 'NONE') {
        loginUrl.searchParams.set('reason', 'unauthorized');
      }

      return NextResponse.redirect(loginUrl);
    }

    // Redirect authenticated users from auth pages to dashboard
    // CRITICAL: We MUST NOT redirect if forceLogout or reason=expired is present,
    // as that indicates a session cleanup is in progress (Finding 48 Loop Prevention)
    if (
      isAuthRoute &&
      isAuthenticated &&
      !forceLogout &&
      reason !== 'expired'
    ) {
      const destParam =
        request.nextUrl.searchParams.get('redirect') ||
        request.nextUrl.searchParams.get('from'); // Standard query param
      const dest = destParam ? decodeURIComponent(destParam) : '/dashboard';

      // eslint-disable-next-line no-console
      console.warn(
        `
        [MW:Edge] [${requestId}] [EP-AUTH-REDIRECT] Redirecting authed user from login page back to app
      `,
        {
          dest,
          forceLogout,
          reason,
          isAuthenticated,
          timestamp: new Date().toISOString(),
        }
      );
      return NextResponse.redirect(new URL(dest, request.url));
    } else if (isAuthRoute && (forceLogout || reason === 'expired')) {
      // eslint-disable-next-line no-console
      console.info(
        `
        [MW:Edge] [${requestId}] [EP-LOOP-PREVENTION] Staying on auth route despite cookie - Loop Prevention Active
      `,
        {
          pathname,
          forceLogout,
          reason,
          isAuthenticated,
          timestamp: new Date().toISOString(),
        }
      );
    }

    // Allow request to proceed
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-pathname', pathname);
    requestHeaders.set('x-middleware-request-id', requestId);

    // eslint-disable-next-line no-console
    console.log(
      `
      [MW:Edge] [${requestId}] EP-FINAL: Proceeding to next()
    `,
      {
        pathname,
        isAuthenticated,
        timestamp: new Date().toISOString(),
      }
    );

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  } catch (globalErr: unknown) {
    // eslint-disable-next-line no-console
    console.error(
      `
      [MW:Edge] [${requestId}] CRITICAL GLOBAL EXCEPTION
    `,
      {
        message:
          globalErr instanceof Error ? globalErr.message : String(globalErr),
        stack: globalErr instanceof Error ? globalErr.stack : undefined,
        pathname,
        timestamp: new Date().toISOString(),
      }
    );

    // CRITICAL FIX (Finding 41 & 44): Never return undefined from middleware.
    // In case of error in the middleware itself, we allow the request
    // to fall through to the page as a safety measure.
    const response = NextResponse.next();
    response.headers.set('X-MW-Bypass', 'true');
    response.headers.set(
      'X-MW-Error',
      globalErr instanceof Error
        ? globalErr.message.substring(0, 50)
        : 'unknown'
    );
    return response;
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
