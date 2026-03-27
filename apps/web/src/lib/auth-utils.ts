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
  const isProduction =
    appUrl.includes('validiant.in') ||
    process.env.NEXT_PUBLIC_ENV === 'production' ||
    process.env.NEXT_PUBLIC_VERCEL_ENV === 'production';

  if (!isProduction) return undefined;

  const hostname = requestHostname || new URL(appUrl).hostname;

  // Use wildcard domain for the main app to share cookies with API subdomains
  if (hostname.startsWith('www.') || hostname === 'validiant.in') {
    return '.validiant.in';
  }

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
export const getBaseCookieOptions = (hostname?: string) => ({
  httpOnly: true,
  secure: true,
  sameSite: 'none' as const,
  path: '/',
  domain: getCookieDomain(hostname),
});
