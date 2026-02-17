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
 * API Configuration
 */
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

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
 * Login Action
 * 
 * Server-side login that proxies Cloudflare API and sets cookies
 */
export async function loginAction(
  email: string,
  password: string
): Promise<LoginActionResult> {
  try {
    // Make server-side fetch to Cloudflare API
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
    // Make server-side fetch to Cloudflare API
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
    cookieStore.delete('accessToken');
    cookieStore.delete('refreshToken');

    return { success: true };
  } catch (error) {
    console.error('[Server Action] Logout error:', error);
    // Still return success to clear client state
    return { success: true };
  }
}

/**
 * Get Current User Action
 * 
 * Server-side user fetch using cookie authentication
 */
export async function getCurrentUserAction(): Promise<GetCurrentUserActionResult> {
  try {
    // Get access token from cookies
    const cookieStore = cookies();
    const accessToken = cookieStore.get('accessToken')?.value;

    if (!accessToken) {
      return {
        success: false,
        error: 'Unauthenticated',
        message: 'No access token found',
      };
    }

    // Fetch user from Cloudflare API
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      return {
        success: false,
        error: data.error || 'Failed to fetch user',
        message: data.message || 'Unable to load user data',
      };
    }

    return {
      success: true,
      user: data.data.user as AuthUser,
    };
  } catch (error) {
    console.error('[Server Action] Get user error:', error);
    return {
      success: false,
      error: 'NetworkError',
      message: 'Unable to connect to authentication server',
    };
  }
}
