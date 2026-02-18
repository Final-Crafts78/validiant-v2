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
import type {
  AuthUser,
  LoginActionResult,
  RegisterActionResult,
  LogoutActionResult,
  GetCurrentUserActionResult,
} from '@/types/auth.types';

/**
 * API Configuration with URL Normalization
 * Ensures /api/v1 prefix is present and prevents double prefixes
 */
const raw = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1').replace(/\/+$/, '');
const API_BASE_URL = raw.endsWith('/api/v1') ? raw : `${raw}/api/v1`;

/**
 * Cookie configuration for secure token storage
 */
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
};

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
  
  console.log('[clearAuthCookies] Force clearing cookies with overwrite method');
  
  // 1. Force overwrite with empty value and immediate expiration
  cookieStore.set({
    name: 'accessToken',
    value: '',
    expires: new Date(0), // Expire instantly in the past
    path: '/',
  });

  cookieStore.set({
    name: 'refreshToken',
    value: '',
    expires: new Date(0),
    path: '/',
  });

  // 2. Also call delete as a fallback for Next.js internal state
  cookieStore.delete('accessToken');
  cookieStore.delete('refreshToken');
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
            'Authorization': `Bearer ${accessToken}`,
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
 * Server-side user fetch using cookie authentication
 * 
 * CRITICAL COOKIE-CLEAR SAFETY NET:
 * If the API returns 401/403 or any error, cookies are cleared to prevent
 * infinite redirect loop between middleware (sees cookie) and layout (gets error).
 */
export async function getCurrentUserAction(): Promise<GetCurrentUserActionResult> {
  const cookieStore = cookies();
  
  try {
    // Get access token from cookies
    const accessToken = cookieStore.get('accessToken')?.value;

    if (!accessToken) {
      console.log('[getCurrentUserAction] No access token found');
      return {
        success: false,
        error: 'Unauthenticated',
        message: 'No access token found',
      };
    }

    console.log('[getCurrentUserAction] Fetching user from API:', `${API_BASE_URL}/auth/me`);

    // Fetch user from Cloudflare API (API_BASE_URL already includes /api/v1)
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      cache: 'no-store', // Always fetch fresh data
    });

    console.log('[getCurrentUserAction] API response status:', response.status);

    // CRITICAL: If unauthorized or forbidden, clear cookies
    if (response.status === 401 || response.status === 403) {
      console.warn('[getCurrentUserAction] Token invalid (401/403), clearing cookies');
      clearAuthCookies();
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
      console.error('[getCurrentUserAction] Failed to parse JSON response:', jsonError);
      // Clear cookies if response is malformed
      clearAuthCookies();
      return {
        success: false,
        error: 'InvalidResponse',
        message: 'Server returned invalid response',
      };
    }

    // Check if response indicates failure
    if (!response.ok || !data.success) {
      console.warn('[getCurrentUserAction] API returned error:', data);
      // Clear cookies on any API failure
      clearAuthCookies();
      return {
        success: false,
        error: data.error || 'Failed to fetch user',
        message: data.message || 'Unable to load user data',
      };
    }

    // Verify user data exists in response
    if (!data.data || !data.data.user) {
      console.error('[getCurrentUserAction] User data missing from response:', data);
      // Clear cookies if user data is missing
      clearAuthCookies();
      return {
        success: false,
        error: 'InvalidResponse',
        message: 'User data not found in response',
      };
    }

    console.log('[getCurrentUserAction] Successfully fetched user:', data.data.user.email);

    return {
      success: true,
      user: data.data.user as AuthUser,
    };
  } catch (error) {
    console.error('[getCurrentUserAction] Network or unexpected error:', error);
    // Clear cookies on any exception to prevent infinite redirect
    clearAuthCookies();
    return {
      success: false,
      error: 'NetworkError',
      message: 'Unable to connect to authentication server',
    };
  }
}
