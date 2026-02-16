/**
 * Dashboard Layout
 * 
 * Server Component layout for protected dashboard pages.
 * User data is fetched server-side for optimal performance and SEO.
 */

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { API_CONFIG, ROUTES } from '@/lib/config';
import type { User } from '@validiant/shared';

// Explicitly opt into dynamic rendering
export const dynamic = 'force-dynamic';

/**
 * Fetch user data server-side
 */
async function getCurrentUser(): Promise<User | null> {
  try {
    // Get cookies
    const cookieStore = cookies();
    const accessToken = cookieStore.get('accessToken');

    // If no token, return null (middleware should have caught this)
    if (!accessToken) {
      return null;
    }

    // Fetch user from API
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}${API_CONFIG.ENDPOINTS.AUTH.ME}`,
      {
        headers: {
          Cookie: `accessToken=${accessToken.value}`,
        },
        cache: 'no-store', // Always fetch fresh user data
      }
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.data as User;
  } catch (error) {
    console.error('Error fetching user:', error);
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