/**
 * Dashboard Layout (BFF Pattern)
 * 
 * Server Component layout for protected dashboard pages.
 * User data is fetched server-side with proper authentication.
 * 
 * CRITICAL: Server Components CANNOT mutate cookies
 * - Cookie deletion must happen in Route Handlers
 * - On auth failure, redirect to /api/auth/session-expired
 * - Route Handler clears cookies and redirects to login
 */

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { AuthStoreInitializer } from '@/components/providers/AuthStoreInitializer';
import { API_CONFIG, ROUTES } from '@/lib/config';
import type { AuthUser } from '@/types/auth.types';

// Explicitly opt into dynamic rendering
export const dynamic = 'force-dynamic';

/**
 * Fetch user data server-side
 * Uses Authorization header with Bearer token for API authentication
 * 
 * CRITICAL: On auth failure, redirects to Route Handler for cookie cleanup
 * Server Components cannot mutate cookies - only Route Handlers can.
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

    // Normalize API URL to ensure /api/v1 prefix
    const raw = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1').replace(/\/+$/, '');
    const baseUrl = raw.endsWith('/api/v1') ? raw : `${raw}/api/v1`;
    const apiUrl = `${baseUrl}${API_CONFIG.ENDPOINTS.AUTH.ME}`;
    
    console.log('[Dashboard Layout] Fetching user from:', apiUrl);

    // Fetch user from API with Authorization header
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken.value}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store', // Always fetch fresh user data
    });

    console.log('[Dashboard Layout] API response status:', response.status);

    // CRITICAL: If unauthorized or forbidden, redirect to cleanup route
    if (response.status === 401 || response.status === 403) {
      console.warn('[Dashboard Layout] Token invalid (401/403), redirecting to cleanup route');
      redirect('/api/auth/session-expired');
    }

    // If response is not OK, redirect to cleanup route
    if (!response.ok) {
      console.warn('[Dashboard Layout] API returned error status:', response.status);
      redirect('/api/auth/session-expired');
    }

    // Try to parse JSON response
    let data;
    try {
      data = await response.json();
    } catch (jsonError) {
      console.error('[Dashboard Layout] Failed to parse JSON response:', jsonError);
      // Redirect to cleanup route if response is malformed
      redirect('/api/auth/session-expired');
    }

    // Check if response indicates success and has user data
    if (!data.success || !data.data || !data.data.user) {
      console.warn('[Dashboard Layout] Invalid response structure:', {
        success: data.success,
        hasData: !!data.data,
        hasUser: !!(data.data && data.data.user),
      });
      // Redirect to cleanup route if response is invalid
      redirect('/api/auth/session-expired');
    }

    console.log('[Dashboard Layout] Successfully fetched user:', data.data.user.email);
    
    // Extract user from nested data structure
    return data.data.user as AuthUser;
  } catch (error) {
    console.error('[Dashboard Layout] Error fetching user:', error);
    // Redirect to cleanup route on any exception
    redirect('/api/auth/session-expired');
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
  // The cleanup route will have cleared cookies if there was an error,
  // so middleware will not redirect back here (breaking infinite loop)
  if (!user) {
    console.log('[Dashboard Layout] No user found, redirecting to login');
    redirect(ROUTES.LOGIN);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* CRITICAL: Initialize Zustand store with server-side user data */}
      <AuthStoreInitializer user={user} />
      
      {/* Header with navigation (Client Component for interactivity) */}
      <DashboardHeader user={user} />

      {/* Main Content */}
      <main className="container-custom py-4 md:py-8 pb-24 md:pb-8">{children}</main>
    </div>
  );
}