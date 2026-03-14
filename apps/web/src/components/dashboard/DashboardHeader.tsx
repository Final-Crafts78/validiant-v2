/**
 * Dashboard Header Component (BFF Pattern)
 *
 * Client component for dashboard navigation with server-side logout.
 * Phase 22: Added OrgSwitcher and ProjectSwitcher for workspace context.
 * Phase 23: Fixed dynamic routes and added Settings Hub connectivity.
 */

'use client';

import { useMemo, useTransition } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth';
import { useWorkspaceStore } from '@/store/workspace';
import { logoutAction } from '@/actions/auth.actions';
import { ROUTES } from '@/lib/config';
import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  Building2,
  User,
  LogOut,
  Settings,
} from 'lucide-react';
import type { AuthUser } from '@/types/auth.types';
import { OrgSwitcher } from './OrgSwitcher';
import { ProjectSwitcher } from './ProjectSwitcher';
import { NotificationBell } from '../notifications/NotificationBell';

/**
 * Navigation item type
 */
interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

/**
 * Dashboard Header Props
 */
interface DashboardHeaderProps {
  user: AuthUser;
  orgs?: {
    id: string;
    name: string;
    slug?: string;
    industry?: string;
    logoUrl?: string;
  }[];
}

/**
 * Dashboard Header Component
 */
export function DashboardHeader({ user, orgs = [] }: DashboardHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const activeOrgSlug = useWorkspaceStore((state) => state.activeOrgSlug);
  const [isPending, startTransition] = useTransition();

  /**
   * Computed Navigation Items
   * Handles dynamic routes based on the active organization slug.
   */
  const navItems = useMemo<NavItem[]>(() => {
    const slug = activeOrgSlug || 'org'; // fallback if slug is not yet loaded

    return [
      {
        name: 'Dashboard',
        href: ROUTES.DASHBOARD(slug),
        icon: LayoutDashboard,
      },
      {
        name: 'Projects',
        href: ROUTES.PROJECTS(slug),
        icon: FolderKanban,
      },
      {
        name: 'Tasks',
        href: ROUTES.TASKS(slug),
        icon: CheckSquare,
      },
      {
        name: 'Organizations',
        href: ROUTES.ORGANIZATIONS,
        icon: Building2,
      },
      {
        name: 'Settings',
        href: ROUTES.SETTINGS(slug),
        icon: Settings,
      },
      {
        name: 'Profile',
        href: ROUTES.PROFILE(slug),
        icon: User,
      },
    ];
  }, [activeOrgSlug]);

  // Get initials from fullName with null-safety
  const initials = useMemo(() => {
    if (!user?.fullName) return '';
    const parts = user.fullName.trim().split(' ');
    const firstInitial = parts[0]?.charAt(0) || '';
    const lastInitial =
      parts.length > 1 ? parts[parts.length - 1]?.charAt(0) : '';
    return `${firstInitial}${lastInitial}`.toUpperCase();
  }, [user?.fullName]);

  // Handle logout with Server Action
  const handleLogout = () => {
    startTransition(async () => {
      try {
        await logoutAction();
        clearAuth();
        router.push(ROUTES.LOGIN);
        router.refresh();
      } catch (error) {
        console.error('Logout error:', error);
        clearAuth();
        router.push(ROUTES.LOGIN);
      }
    });
  };

  const dashboardHref = activeOrgSlug
    ? ROUTES.DASHBOARD(activeOrgSlug)
    : ROUTES.ORGANIZATIONS;

  return (
    <>
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="container-custom">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href={dashboardHref} className="flex items-center gap-2">
                <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                  <LayoutDashboard className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-bold text-gray-900 hidden lg:inline">
                  Validiant
                </span>
              </Link>

              {orgs.length > 0 && (
                <div className="hidden md:flex items-center gap-2">
                  <span className="text-slate-300">/</span>
                  <OrgSwitcher />
                  <span className="text-slate-300">/</span>
                  <ProjectSwitcher />
                </div>
              )}
            </div>

            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const isActive = pathname.startsWith(item.href);
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
              })}
            </nav>

            <div className="flex items-center gap-4">
              <NotificationBell />
              <div className="hidden md:flex items-center gap-3">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {user.fullName}
                  </p>
                  <p className="text-xs text-gray-500">{user.email}</p>
                </div>
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

      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-gray-200 z-50">
        <div className="flex items-center justify-around h-16 px-2">
          {navItems.slice(0, 5).map((item) => {
            const isActive = pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${
                  isActive
                    ? 'text-primary-600'
                    : 'text-gray-500 hover:text-gray-900'
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
