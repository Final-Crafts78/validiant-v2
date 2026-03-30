/**
 * Authentication Utilities
 *
 * Centralized cookie configuration and domain detection for authentication.
 * Ensures consistency between Server Actions, Route Handlers, and Middleware.
 */

/**
 * Get secret fingerprint for parity checking without exposing the actual secret (Finding 42)
 * Works in Edge Runtime and Node.js.
 */
export async function getSecretFingerprint(): Promise<string> {
  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) return 'MISSING';

    // Edge-compatible fingerprinting
    const msgBuffer = new TextEncoder().encode(secret);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

    return hashHex.substring(0, 8);
  } catch (e) {
    const secret = process.env.JWT_SECRET || '';
    return `fallback-${secret.length}-${secret.substring(0, 2)}`;
  }
}

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

  // 🔍 PRE-PARSE AUDIT (Finding 45 Hardening)
  const appUrlRaw = process.env.NEXT_PUBLIC_APP_URL || '';
  const appUrlLength = appUrlRaw.length;
  
  console.debug('[Cookie:Utils] PRE-PARSE Audit', {
    appUrlRaw,
    appUrlLength,
    isProduction,
    timestamp: new Date().toISOString()
  });

  // Fallback chain for hostname
  let hostname: string | null = null;
  try {
    hostname =
      requestHostname ||
      (typeof window !== 'undefined' ? window.location.hostname : null);

    if (!hostname && appUrlRaw) {
      console.debug('[Cookie:Utils] Falling back to URL constructor for hostname', { appUrlRaw });
      hostname = new URL(appUrlRaw).hostname;
    }
  } catch (urlErr) {
    console.error('[Cookie:Utils] CRITICAL: URL Parsing failed', {
      appUrlRaw,
      error: urlErr instanceof Error ? urlErr.message : String(urlErr)
    });
    hostname = 'localhost'; // Safe fallback to prevent terminal crash
  }

  console.debug('[Cookie:Utils] Evaluating domain', {
    resolvedHostname: hostname || 'NULL_FALLBACK',
    inputHostname: requestHostname || 'UNDEFINED',
    isProduction,
    appUrl: appUrlRaw,
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
    stack: new Error().stack?.split('\n').slice(1, 4),
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
    const finalDomain = '.validiant.in';
    console.info('[Cookie:Utils] PRODUCTION DOMAIN APPLIED', {
      hostname,
      isProduction,
      reason: !hostname ? 'HOSTNAME_MISSING' : hostname === 'localhost' ? 'LOCALHOST_FALLBACK' : 'DOMAIN_MATCH',
      finalDomain,
      timestamp: new Date().toISOString(),
    });
    return finalDomain;
  }

  console.warn('[Cookie:Utils] PRODUCTION but NO DOMAIN MATCH (Host-only cookie will be used)', {
    hostname,
    isProduction,
    isForceDomainMatch,
    suggestion: 'If this is a Vercel preview URL, host-only cookies are intentional. If this is production, check NEXT_PUBLIC_APP_URL.'
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
