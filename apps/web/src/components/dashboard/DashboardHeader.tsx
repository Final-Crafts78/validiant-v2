/**
 * Dashboard Header Component (BFF Pattern)
 * 
 * Client component for dashboard navigation with server-side logout.
 */

'use client';

import { useState, useMemo, useTransition } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth';
import { logoutAction } from '@/actions/auth.actions';
import { ROUTES } from '@/lib/config';
import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  Building2,
  User,
  LogOut,
} from 'lucide-react';
import type { AuthUser } from '@/types/auth.types';

/**
 * Navigation item type
 */
interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

/**
 * Navigation items
 */
const navItems: NavItem[] = [
  {
    name: 'Dashboard',
    href: ROUTES.DASHBOARD,
    icon: LayoutDashboard,
  },
  {
    name: 'Projects',
    href: ROUTES.PROJECTS,
    icon: FolderKanban,
  },
  {
    name: 'Tasks',
    href: ROUTES.TASKS,
    icon: CheckSquare,
  },
  {
    name: 'Organizations',
    href: ROUTES.ORGANIZATIONS,
    icon: Building2,
  },
  {
    name: 'Profile',
    href: ROUTES.PROFILE,
    icon: User,
  },
];

/**
 * Dashboard Header Props
 */
interface DashboardHeaderProps {
  user: AuthUser;
}

/**
 * Dashboard Header Component
 */
export function DashboardHeader({ user }: DashboardHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const [isPending, startTransition] = useTransition();

  // Get initials from fullName with null-safety
  const initials = useMemo(() => {
    if (!user?.fullName) return '';
    const parts = user.fullName.trim().split(' ');
    const firstInitial = parts[0]?.charAt(0) || '';
    const lastInitial = parts.length > 1 ? parts[parts.length - 1]?.charAt(0) : '';
    return `${firstInitial}${lastInitial}`.toUpperCase();
  }, [user?.fullName]);

  // Handle logout with Server Action
  const handleLogout = () => {
    startTransition(async () => {
      try {
        // Call server action to clear cookies
        await logoutAction();
        
        // Clear client-side state
        clearAuth();
        
        // Redirect to login
        router.push(ROUTES.LOGIN);
        router.refresh(); // Refresh to clear any cached data
      } catch (error) {
        console.error('Logout error:', error);
        // Still clear client state and redirect on error
        clearAuth();
        router.push(ROUTES.LOGIN);
      }
    });
  };

  return (
    <>
      {/* Top Navigation Bar */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="container-custom">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-8">
              <Link href={ROUTES.DASHBOARD} className="flex items-center gap-2">
                <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                  <LayoutDashboard className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-bold text-gray-900">Validiant</span>
              </Link>

              {/* Desktop Navigation */}
              <nav className="hidden md:flex items-center gap-1">
                {navItems.map((item) => {
                  const isActive = pathname === item.href;
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-primary-50 text-primary-700'
                          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{item.name}</span>
                    </Link>
                  );
                });
              </nav>
            </div>

            {/* Right Side */}
            <div className="flex items-center gap-4">
              {/* User Menu */}
              <div className="hidden md:flex items-center gap-3">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {user.fullName}
                  </p>
                  <p className="text-xs text-gray-500">{user.email}</p>
                </div>
                {/* ✅ FIXED: Use user.avatarUrl to match AuthUser type */}
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.fullName}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center">
                    <span className="text-sm font-semibold text-white">
                      {initials}
                    </span>
                  </div>
                )}
              </div>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                disabled={isPending}
                className="hidden md:flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 hover:text-danger-600 hover:bg-danger-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <LogOut className="h-4 w-4" />
                <span>{isPending ? 'Logging out...' : 'Logout'}</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Web Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-gray-200 z-50">
        <div className="flex items-center justify-around h-16 px-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${
                  isActive ? 'text-primary-600' : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="text-[10px] font-medium">{item.name}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}