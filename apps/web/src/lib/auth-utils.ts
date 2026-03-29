/**
 * Authentication Utilities
 *
 * Centralized cookie configuration and domain detection for authentication.
 * Ensures consistency between Server Actions, Route Handlers, and Middleware.
 */

/**
 * Get the cookie domain based on the current request hostname and environment.
 *
 * In production:
 * - Returns '.validiant.in' for www.validiant.in or validiant.in to cover all subdomains.
 * - Otherwise returns undefined (host-only cookie).
 *
 * In development:
 * - Returns undefined (host-only cookie on localhost).
 */
export function getCookieDomain(requestHostname?: string) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  
  // LOG ALL ENVIRONMENT INPUTS FOR DETERMINING PRODUCTION
  const envProductionChecks = {
    appUrlIncludesValidiant: appUrl.includes('validiant.in'),
    NEXT_PUBLIC_ENV: process.env.NEXT_PUBLIC_ENV,
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_VERCEL_ENV: process.env.NEXT_PUBLIC_VERCEL_ENV,
  };

  const isProduction =
    envProductionChecks.appUrlIncludesValidiant ||
    envProductionChecks.NEXT_PUBLIC_ENV === 'production' ||
    envProductionChecks.NODE_ENV === 'production' ||
    envProductionChecks.NEXT_PUBLIC_VERCEL_ENV === 'production';

  // Fallback chain for hostname
  const hostname =
    requestHostname ||
    (typeof window !== 'undefined' ? window.location.hostname : null) ||
    new URL(appUrl).hostname;

  console.debug('[Cookie:Utils] Evaluating domain', {
    resolvedHostname: hostname,
    inputHostname: requestHostname || 'UNDEFINED',
    isProduction,
    appUrl,
    envProductionChecks,
    processEnv: {
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'MISSING',
      NEXT_PUBLIC_ENV: process.env.NEXT_PUBLIC_ENV || 'MISSING',
      NODE_ENV: process.env.NODE_ENV || 'MISSING',
      VERCEL_ENV: process.env.VERCEL_ENV || 'MISSING',
      NEXT_PUBLIC_VERCEL_ENV: process.env.NEXT_PUBLIC_VERCEL_ENV || 'MISSING',
      VERCEL: process.env.VERCEL || 'MISSING',
      VERCEL_URL: process.env.VERCEL_URL || 'MISSING',
    },
    context: typeof window !== 'undefined' ? 'BROWSER' : 'SERVER',
    stack: new Error().stack?.split('\n').slice(1, 5),
    timestamp: new Date().toISOString(),
  });

  if (!isProduction) {
    console.debug('[Cookie:Utils] NOT PRODUCTION - returning undefined (host-only)');
    return undefined; // Host-only cookies for localhost
  }

  // If we are on any validiant.in subdomain, use the wildcard domain
  // CRITICAL: If we are in production but the hostname is missing or localhost (server-side context issues),
  // we force the production domain to ensure cookies are set/cleared correctly.
  const isForceDomainMatch = 
    !hostname ||
    hostname === 'localhost' ||
    hostname.endsWith('validiant.in') ||
    hostname.includes('validiant-v2-web');

  if (isProduction && isForceDomainMatch) {
    console.debug('[Cookie:Utils] MATCHED .validiant.in domain', {
      hostname,
      isProduction,
      reason: !hostname ? 'HOSTNAME_MISSING' : hostname === 'localhost' ? 'LOCALHOST_FALLBACK' : 'DOMAIN_MATCH'
    });
    return '.validiant.in';
  }

  console.warn('[Cookie:Utils] PRODUCTION but NO DOMAIN MATCH', {
    hostname,
    isProduction,
    isForceDomainMatch
  });

  return undefined;
}

/**
 * Base cookie options for authentication tokens.
 *
 * CRITICAL:
 * - httpOnly: true (XSS protection)
 * - secure: true (Required for SameSite=None)
 * - sameSite: 'none' (Enables cross-subdomain authentication)
 * - path: '/' (Available across the entire app)
 */
export const getBaseCookieOptions = (hostname?: string) => {
  const isProduction = hostname
    ? !hostname.includes('localhost') && !hostname.includes('127.0.0.1')
    : process.env.NODE_ENV === 'production';

  const domain = getCookieDomain(hostname);

  const options = {
    httpOnly: true,
    secure: isProduction,
    // sameSite: 'none' as const, // Might be needed for cross-subdomain in some cases
    sameSite: 'lax' as const,
    path: '/',
    domain,
  };

  console.debug('[Cookie:Utils] DOMAIN DECISION', {
    hostname: hostname || 'UNKNOWN',
    isProduction,
    hasDomainAttribute: options.domain !== undefined,
    domainValue: options.domain,
    allOptions: {
      ...options,
      sameSite: options.sameSite,
    },
    clientAvailableCookies: typeof document !== 'undefined' ? document.cookie.split(';').length : 'N/A',
    clientCookieNames: typeof document !== 'undefined' ? document.cookie.split(';').map(c => c.split('=')[0]?.trim() || 'UNKNOWN') : [],
    context: typeof window !== 'undefined' ? 'BROWSER' : 'SERVER',
    envNode: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
    userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'SERVER',
  });

  return options;
};
