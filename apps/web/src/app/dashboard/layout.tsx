/**
 * Dashboard Layout (BFF Pattern)
 * 
 * Server Component layout for protected dashboard pages.
 * User data is fetched server-side with proper authentication.
 */

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { API_CONFIG, ROUTES } from '@/lib/config';
import type { AuthUser } from '@/types/auth.types';

// Explicitly opt into dynamic rendering
export const dynamic = 'force-dynamic';

/**
 * Fetch user data server-side
 * Uses Authorization header with Bearer token for Cloudflare API authentication
 */
async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    // Get access token from cookies
    const cookieStore = cookies();
    const accessToken = cookieStore.get('accessToken');

    // If no token, return null (middleware should have caught this)
    if (!accessToken) {
      return null;
    }

    // Fetch user from Cloudflare API with Authorization header
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}${API_CONFIG.ENDPOINTS.AUTH.ME}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken.value}`,
          'Content-Type': 'application/json',
        },
        cache: 'no-store', // Always fetch fresh user data
      }
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    
    // Extract user from nested data structure
    if (data.success && data.data && data.data.user) {
      return data.data.user as AuthUser;
    }
    
    return null;
  } catch (error) {
    console.error('[Dashboard Layout] Error fetching user:', error);
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

  // If no user (shouldn't happen due to middleware), redirect to login
  if (!user) {
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