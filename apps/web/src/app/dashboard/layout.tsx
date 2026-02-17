/**
 * Dashboard Layout (BFF Pattern)
 * 
 * Server Component layout for protected dashboard pages.
 * User data is fetched server-side with proper authentication.
 * 
 * CRITICAL: Cookie-Clear Safety Net
 * - If API returns 401/403 or fails, cookies MUST be cleared
 * - Prevents infinite redirect loop between middleware and layout
 */

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { API_CONFIG, ROUTES } from '@/lib/config';
import type { AuthUser } from '@/types/auth.types';

// Explicitly opt into dynamic rendering
export const dynamic = 'force-dynamic';

/**
 * Clear authentication cookies
 * Helper function to prevent infinite redirect loop
 */
function clearAuthCookies() {
  const cookieStore = cookies();
  cookieStore.delete('accessToken');
  cookieStore.delete('refreshToken');
}

/**
 * Fetch user data server-side
 * Uses Authorization header with Bearer token for Cloudflare API authentication
 * 
 * CRITICAL COOKIE-CLEAR SAFETY NET:
 * If the API returns 401/403 or any error, cookies are cleared to prevent
 * infinite redirect loop between middleware (sees cookie) and layout (gets error).
 */
async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    // Get access token from cookies
    const cookieStore = cookies();
    const accessToken = cookieStore.get('accessToken');

    // If no token, return null (middleware should have caught this)
    if (!accessToken) {
      console.log('[Dashboard Layout] No access token found');
      return null;
    }

    const apiUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}${API_CONFIG.ENDPOINTS.AUTH.ME}`;
    console.log('[Dashboard Layout] Fetching user from:', apiUrl);

    // Fetch user from Cloudflare API with Authorization header
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken.value}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store', // Always fetch fresh user data
    });

    console.log('[Dashboard Layout] API response status:', response.status);

    // CRITICAL: If unauthorized or forbidden, clear cookies
    if (response.status === 401 || response.status === 403) {
      console.warn('[Dashboard Layout] Token invalid (401/403), clearing cookies');
      clearAuthCookies();
      return null;
    }

    // If response is not OK, clear cookies
    if (!response.ok) {
      console.warn('[Dashboard Layout] API returned error status:', response.status);
      clearAuthCookies();
      return null;
    }

    // Try to parse JSON response
    let data;
    try {
      data = await response.json();
    } catch (jsonError) {
      console.error('[Dashboard Layout] Failed to parse JSON response:', jsonError);
      // Clear cookies if response is malformed
      clearAuthCookies();
      return null;
    }

    // Check if response indicates success and has user data
    if (!data.success || !data.data || !data.data.user) {
      console.warn('[Dashboard Layout] Invalid response structure:', {
        success: data.success,
        hasData: !!data.data,
        hasUser: !!(data.data && data.data.user),
      });
      // Clear cookies if response is invalid
      clearAuthCookies();
      return null;
    }

    console.log('[Dashboard Layout] Successfully fetched user:', data.data.user.email);
    
    // Extract user from nested data structure
    return data.data.user as AuthUser;
  } catch (error) {
    console.error('[Dashboard Layout] Error fetching user:', error);
    // Clear cookies on any exception to prevent infinite redirect
    clearAuthCookies();
    return null;
  }
}

/**
 * Dashboard Layout Component (Server Component)
 */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Fetch user data on the server
  const user = await getCurrentUser();

  // If no user, redirect to login
  // Cookies have been cleared by getCurrentUser() if there was an error,
  // so middleware will not redirect back here (breaking infinite loop)
  if (!user) {
    console.log('[Dashboard Layout] No user found, redirecting to login');
    redirect(ROUTES.LOGIN);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with navigation (Client Component for interactivity) */}
      <DashboardHeader user={user} />

      {/* Main Content */}
      <main className="container-custom py-4 md:py-8 pb-24 md:pb-8">{children}</main>
    </div>
  );
}