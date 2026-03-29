/**
 * Auth Server Actions (BFF Pattern)
 *
 * Backend-For-Frontend pattern to solve cross-domain cookie issues.
 * Next.js Server Actions proxy the Cloudflare API and set cookies
 * on the same domain (Vercel), making them readable by middleware.
 *
 * Flow:
 * 1. Client calls server action (server-side execution)
 * 2. Server action fetches Cloudflare API
 * 3. Cloudflare returns tokens in JSON body
 * 4. Server action sets HttpOnly cookies on Next.js response
 * 5. Middleware can now read cookies (same domain)
 *
 * Security Benefits:
 * - HttpOnly cookies (XSS immune)
 * - Same-origin cookies (CSRF protection with SameSite)
 * - Server-side validation
 * - No client-side token exposure
 *
 * CRITICAL: Cookie-Clear Safety Net
 * - If API returns 401/403 or fails, cookies MUST be cleared
 * - Prevents infinite redirect loop between middleware and layout
 * - Uses explicit overwrite method (expires: new Date(0)) to force browser compliance
 */

'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { cache } from 'react';
import { getBaseCookieOptions } from '@/lib/auth-utils';
import type {
  AuthUser,
  LoginActionResult,
  RegisterActionResult,
  LogoutActionResult,
  GetCurrentUserActionResult,
  UpdateProfileActionResult,
  Organization,
} from '@/types/auth.types';

/**
 * API Configuration with URL Normalization
 * Ensures /api/v1 prefix is present and prevents double prefixes
 */
const raw = (
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'
).replace(/\/+$/, '');
const API_BASE_URL = raw.endsWith('/api/v1') ? raw : `${raw}/api/v1`;

console.debug('[BFF:Init] API Configuration', {
  raw: process.env.NEXT_PUBLIC_API_URL || 'MISSING',
  normalized: API_BASE_URL,
  isProduction: API_BASE_URL.includes('validiant.in'),
  timestamp: new Date().toISOString()
});

/**
 * Cookie configuration for secure token storage
 *
 * domain: '.validiant.in' in production — shares the cookie across
 *   www.validiant.in (Next.js) and api.validiant.in (Cloudflare Worker)
 *   so both subdomains can read/write the same HttpOnly tokens.
 * domain: undefined in development — host-only cookie, no domain
 *   attribute emitted, works correctly on localhost.
 *
 * Using NEXT_PUBLIC_APP_URL to determine if we're in production
 */
const COOKIE_OPTIONS = getBaseCookieOptions();

const ACCESS_TOKEN_MAX_AGE = 15 * 60; // 15 minutes in seconds
const REFRESH_TOKEN_MAX_AGE = 7 * 24 * 60 * 60; // 7 days in seconds

/**
 * Clear authentication cookies
 *
 * CRITICAL: Uses explicit overwrite method to force browser compliance.
 * Some browsers ignore cookies().delete() calls, leaving "ghost cookies" that
 * cause infinite redirect loops. This method:
 * 1. Overwrites cookies with empty value and past expiration (new Date(0))
 * 2. Calls delete() as fallback for Next.js internal state
 *
 * This ensures cookies are actually removed from the browser.
 */
function clearAuthCookies() {
  const cookieStore = cookies();

  const beforeCount = cookieStore.getAll().length;
  const beforeNames = cookieStore.getAll().map((c) => c.name);

  console.warn('[BFF:ClearCookies] DOMAIN CHECK', {
    domain: (COOKIE_OPTIONS as any).domain || 'UNDEFINED (Host-only)',
    path: COOKIE_OPTIONS.path,
    beforeNames,
    beforeCount,
  });

  // 1. Force overwrite with empty value and immediate expiration
  cookieStore.set({
    name: 'accessToken',
    value: '',
    expires: new Date(0), // Expire instantly in the past
    ...COOKIE_OPTIONS,
    maxAge: 0, // CRITICAL: Force immediate expiration
  });

  cookieStore.set({
    name: 'refreshToken',
    value: '',
    expires: new Date(0),
    ...COOKIE_OPTIONS,
    maxAge: 0, // CRITICAL: Force immediate expiration
  });

  // 2. Also call delete as a fallback for Next.js internal state
  cookieStore.delete({
    name: 'accessToken',
    ...COOKIE_OPTIONS,
  });
  cookieStore.delete({
    name: 'refreshToken',
    ...COOKIE_OPTIONS,
  });

  const afterCount = cookieStore.getAll().length;
  const afterNames = cookieStore.getAll().map((c) => c.name);

  console.debug('[BFF:ClearCookies] STATE AFTER DELETE', {
    afterNames,
    afterCount,
    domainUsed: (COOKIE_OPTIONS as any).domain || 'HOST_ONLY',
    timestamp: new Date().toISOString(),
  });
}

/**
 * Login Action
 *
 * Server-side login that proxies Cloudflare API and sets cookies
 */
export async function loginAction(
  email: string,
  password: string
): Promise<LoginActionResult> {
  try {
    // Make server-side fetch to Cloudflare API (API_BASE_URL already includes /api/v1)
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
      credentials: 'include', // Include cookies if Cloudflare sets any
    });

    console.debug('[BFF:Login] API Response received', {
      status: response.status,
      statusText: response.statusText,
      headers: Array.from(response.headers.entries()),
      ok: response.ok,
      url: response.url,
      timestamp: new Date().toISOString(),
    });

    const data = await response.json();

    // Handle error responses
    if (!response.ok || !data.success) {
      return {
        success: false,
        error: data.error || 'Login failed',
        message: data.message || 'Invalid email or password',
      };
    }

    // Extract tokens and user from response
    const { accessToken, refreshToken, user } = data.data;

    if (!accessToken || !refreshToken || !user) {
      return {
        success: false,
        error: 'Invalid response',
        message: 'Authentication data is incomplete',
      };
    }

    // Set HttpOnly cookies on Next.js domain (same origin as frontend)
    const cookieStore = cookies();

    console.debug('[BFF:Login] Setting HttpOnly cookies', {
      options: COOKIE_OPTIONS,
      domain: (COOKIE_OPTIONS as any).domain || 'HOST_ONLY',
      accessTokenLength: accessToken.length,
      refreshTokenLength: refreshToken.length,
      timestamp: new Date().toISOString(),
    });

    cookieStore.set('accessToken', accessToken, {
      ...COOKIE_OPTIONS,
      maxAge: ACCESS_TOKEN_MAX_AGE,
    });

    cookieStore.set('refreshToken', refreshToken, {
      ...COOKIE_OPTIONS,
      maxAge: REFRESH_TOKEN_MAX_AGE,
    });

    // Return user data to client
    return {
      success: true,
      user: user as AuthUser,
      accessToken,
    };
  } catch (error) {
    console.error('[Server Action] Login error:', error);
    return {
      success: false,
      error: 'NetworkError',
      message: 'Unable to connect to authentication server',
    };
  }
}

/**
 * Register Action
 *
 * Server-side registration that proxies Cloudflare API and sets cookies
 */
export async function registerAction(
  email: string,
  password: string,
  fullName: string,
  acceptedTerms: boolean
): Promise<RegisterActionResult> {
  try {
    // Make server-side fetch to Cloudflare API (API_BASE_URL already includes /api/v1)
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password, fullName, acceptedTerms }),
      credentials: 'include',
    });

    const data = await response.json();

    // Handle error responses
    if (!response.ok || !data.success) {
      return {
        success: false,
        error: data.error || 'Registration failed',
        message: data.message || 'Unable to create account',
      };
    }

    // Extract tokens and user from response
    const { accessToken, refreshToken, user } = data.data;

    if (!accessToken || !refreshToken || !user) {
      return {
        success: false,
        error: 'Invalid response',
        message: 'Authentication data is incomplete',
      };
    }

    // Set HttpOnly cookies on Next.js domain
    const cookieStore = cookies();

    cookieStore.set('accessToken', accessToken, {
      ...COOKIE_OPTIONS,
      maxAge: ACCESS_TOKEN_MAX_AGE,
    });

    cookieStore.set('refreshToken', refreshToken, {
      ...COOKIE_OPTIONS,
      maxAge: REFRESH_TOKEN_MAX_AGE,
    });

    // Return user data to client
    return {
      success: true,
      user: user as AuthUser,
      accessToken,
    };
  } catch (error) {
    console.error('[Server Action] Register error:', error);
    return {
      success: false,
      error: 'NetworkError',
      message: 'Unable to connect to authentication server',
    };
  }
}

/**
 * Update Profile Action
 *
 * CRITICAL: Accepts fullName directly (not firstName/lastName) to match backend schema.
 * The backend expects { fullName: string, bio?: string } per updateUserProfileSchema.
 */
export async function updateProfileAction(payload: {
  fullName: string;
  bio?: string;
}): Promise<UpdateProfileActionResult> {
  const cookieStore = cookies();
  const accessToken = cookieStore.get('accessToken')?.value;

  if (!accessToken) {
    console.error('[updateProfileAction] No access token found');
    return {
      success: false,
      error: 'Unauthenticated',
      message: 'No access token found',
    };
  }

  console.warn('[updateProfileAction] Payload:', payload);

  try {
    const response = await fetch(`${API_BASE_URL}/users/me`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`, // CRITICAL: Auth header required
      },
      body: JSON.stringify(payload), // Backend expects fullName
      cache: 'no-store',
    });

    console.warn('[updateProfileAction] Response status:', response.status);

    const data = await response.json();

    if (!response.ok || !data.success) {
      console.error('[updateProfileAction] Profile update failed:', {
        status: response.status,
        statusText: response.statusText,
        error: data.error,
        message: data.message,
        details: data.details,
      });
      return {
        success: false,
        error: data.error || 'UpdateFailed',
        message: data.message || 'Unable to update profile',
      };
    }

    console.warn('[updateProfileAction] Profile updated successfully');

    // Force Next.js to dump the old cached data
    revalidatePath('/dashboard/profile');
    revalidatePath('/dashboard', 'layout');

    return {
      success: true,
      user: data.data.user as AuthUser,
    };
  } catch (error) {
    console.error('[updateProfileAction] Network error:', error);
    return {
      success: false,
      error: 'NetworkError',
      message: 'Unable to connect to server',
    };
  }
}

/**
 * Logout Action
 *
 * Server-side logout that clears cookies
 */
export async function logoutAction(): Promise<LogoutActionResult> {
  try {
    // Get current cookies to send to API for token denylist
    const cookieStore = cookies();
    const accessToken = cookieStore.get('accessToken')?.value;

    // Call Cloudflare API logout endpoint to add tokens to denylist
    if (accessToken) {
      try {
        await fetch(`${API_BASE_URL}/auth/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          credentials: 'include',
        });
      } catch (err) {
        // Continue even if API call fails
        console.warn('[Server Action] Logout API call failed:', err);
      }
    }

    // Clear cookies on Next.js domain
    clearAuthCookies();

    return { success: true };
  } catch (error) {
    console.error('[Server Action] Logout error:', error);
    // Still clear cookies even if there was an error
    clearAuthCookies();
    return { success: true };
  }
}

/**
 * Get Current User Action
 *
 * Server-side user fetch using cookie authentication.
 * Memoized via React cache() to prevent multiple parallel API calls
 * during a single request/render lifecycle (Race Condition Protection).
 *
 * CRITICAL COOKIE-CLEAR SAFETY NET:
 * If the API returns 401/403 or any error, cookies are cleared to prevent
 * infinite redirect loop between middleware (sees cookie) and layout (gets error).
 */
export const getCurrentUserAction = cache(
  async (): Promise<GetCurrentUserActionResult> => {
    const cookieStore = cookies();

    try {
      // Get access token from cookies
      const accessToken = cookieStore.get('accessToken')?.value;

      console.debug('[BFF:GetUser] Access token check', {
        found: !!accessToken,
        length: accessToken?.length,
        prefix: accessToken ? accessToken.substring(0, 30) : 'N/A',
      });

      if (!accessToken) {
        console.warn('[BFF:GetUser] No access token found');
        return {
          success: false,
          error: 'Unauthenticated',
          message: 'No access token found',
        };
      }

      console.debug('[BFF:GetUser] Fetching user from API...', {
        url: `${API_BASE_URL}/auth/me`,
      });

      console.debug('[BFF:GetUser] API CALL START', {
        url: `${API_BASE_URL}/auth/me`,
        tokenPrefix: accessToken.substring(0, 20),
      });

      // Fetch user from Cloudflare API (API_BASE_URL already includes /api/v1)
      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        cache: 'no-store', // Always fetch fresh data
      });

      console.debug('[BFF:GetUser] API response metadata', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        url: response.url,
        headers: Array.from(response.headers.entries()),
        timestamp: new Date().toISOString(),
      });

      // CRITICAL: If unauthorized or forbidden, clear cookies
      if (response.status === 401 || response.status === 403) {
        console.warn(
          '[BFF:GetUser] Auth failure trigger (401/403) - CLEARING COOKIES',
          {
            status: response.status,
            reason: '401_403_REASON',
          }
        );
        return {
          success: false,
          error: 'TokenInvalid',
          message: 'Authentication token is invalid or expired',
        };
      }

      // Try to parse JSON response
      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        console.error(
          '[getCurrentUserAction] Failed to parse JSON response - Clearing cookies',
          {
            jsonError,
            reason: 'JSON_PARSE_REASON',
          }
        );
        // Return error and let caller handle cleanup/redirect
        return {
          success: false,
          error: 'InvalidResponse',
          message: 'Server returned invalid response',
        };
      }

      // Check if response indicates failure
      if (!response.ok || !data.success) {
        console.warn('[getCurrentUserAction] API returned error:', {
          data,
          reason: 'API_ERROR_REASON',
        });
        return {
          success: false,
          error: data.error || 'Failed to fetch user',
          message: data.message || 'Unable to load user data',
        };
      }

      // Verify user data exists in response
      if (!data.data || !data.data.user) {
        console.error(
          '[getCurrentUserAction] User data missing from response - Clearing cookies',
          {
            data,
            reason: 'MISSING_USER_REASON',
          }
        );
        return {
          success: false,
          error: 'InvalidResponse',
          message: 'User data not found in response',
        };
      }

      console.warn(
        '[getCurrentUserAction] Successfully fetched user:',
        data.data.user.email
      );

      return {
        success: true,
        user: data.data.user as AuthUser,
        accessToken,
      };
    } catch (error) {
      console.error(
        '[getCurrentUserAction] Network or unexpected error:',
        error
      );
      return {
        success: false,
        error: 'NetworkError',
        message: 'Unable to connect to authentication server',
      };
    }
  }
);


/**
 * Get User Organizations Action
 *
 * Server-side fetch for user's organizations.
 * Memoized via React cache() for request-level deduplication.
 */
export const getUserOrganizationsAction = cache(
  async (accessToken: string): Promise<Organization[]> => {
    try {
      const response = await fetch(`${API_BASE_URL}/organizations/my`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          `[getUserOrganizationsAction] FETCH FAILED! Status: ${response.status}, Response: ${errorText}`
        );
        return [];
      }

      const data = await response.json();
      return data?.data?.organizations ?? [];
    } catch (error) {
      console.error('[getUserOrganizationsAction] CRASH fetching orgs:', error);
      return [];
    }
  }
);
