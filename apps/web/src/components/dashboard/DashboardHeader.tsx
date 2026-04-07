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
import { ThemeToggle } from '../ui/ThemeToggle';

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

  // SERVER-SIDE SSR AUDIT (Finding 43)
  if (typeof window === 'undefined') {
    // eslint-disable-next-line no-console
    console.debug('[DashboardHeader] EP-SSR: Rendering header on server', {
      email: user?.email,
      orgCount: orgs?.length || 0,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Computed Navigation Items
   * Handles dynamic routes based on the active organization slug.
   */
  const navItems = useMemo<NavItem[]>(() => {
    // If we are in the Global Dashboard scope (no specific org context)
    if (!activeOrgSlug || pathname.startsWith('/dashboard')) {
      return [
        {
          name: 'Home',
          href: ROUTES.DASHBOARD_ROOT,
          icon: LayoutDashboard,
        },
        {
          name: 'Projects',
          href: ROUTES.DASHBOARD_PROJECTS,
          icon: FolderKanban,
        },
        {
          name: 'Tasks',
          href: ROUTES.DASHBOARD_TASKS,
          icon: CheckSquare,
        },
        {
          name: 'Organizations',
          href: ROUTES.DASHBOARD_ORGANIZATIONS,
          icon: Building2,
        },
        {
          name: 'Settings',
          href: ROUTES.DASHBOARD_SETTINGS,
          icon: Settings,
        },
        {
          name: 'Profile',
          href: ROUTES.DASHBOARD_PROFILE,
          icon: User,
        },
      ];
    }

    // Workspace specific routes
    const slug = activeOrgSlug;
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
        href: ROUTES.ORGANIZATIONS(slug),
        icon: Building2,
      },
      {
        name: 'Settings',
        href: ROUTES.DASHBOARD_SETTINGS,
        icon: Settings,
      },
      {
        name: 'Profile',
        href: ROUTES.DASHBOARD_PROFILE,
        icon: User,
      },
    ];
  }, [activeOrgSlug, pathname]);

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
    : '/dashboard';

  return (
    <>
      <header className="bg-glass sticky top-0 z-40">
        <div className="container-custom">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link
                href={dashboardHref}
                className="flex items-center gap-2 group"
              >
                <div className="w-9 h-9 bg-primary-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary-600/20 group-hover:scale-105 transition-transform duration-200">
                  <LayoutDashboard className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-black text-[var(--color-text-base)] hidden lg:inline tracking-tight group-hover:text-primary-600 transition-colors">
                  Validiant
                </span>
              </Link>

              {orgs.length > 0 &&
                activeOrgSlug &&
                !pathname.startsWith('/dashboard') && (
                  <div className="hidden md:flex items-center gap-2">
                    <span className="text-[var(--color-text-muted)]">/</span>
                    <OrgSwitcher />
                    <span className="text-[var(--color-text-muted)]">/</span>
                    <ProjectSwitcher />
                  </div>
                )}
            </div>

            <nav className="hidden md:flex items-center gap-1">
              {/* Optional: Show breadcrumbs or simplified nav here if GlobalSidebar is present */}
            </nav>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 pr-4 border-r border-[var(--color-border-base)]">
                <ThemeToggle />
                <NotificationBell />
              </div>

              <div className="hidden md:flex items-center gap-3 pl-2">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-black text-[var(--color-text-base)] leading-none mb-1">
                    {user.fullName}
                  </p>
                  <p className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider">
                    {user.email}
                  </p>
                </div>
                <div className="relative group cursor-pointer">
                  {user.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt={user.fullName}
                      className="w-10 h-10 rounded-xl object-cover ring-2 ring-transparent group-hover:ring-primary-500/30 transition-all shadow-sm"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                      <span className="text-sm font-black text-white">
                        {initials}
                      </span>
                    </div>
                  )}
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-[var(--color-surface-base)] rounded-full shadow-sm"></div>
                </div>
              </div>

              <button
                onClick={handleLogout}
                disabled={isPending}
                className="hidden md:flex items-center justify-center w-10 h-10 rounded-xl text-[var(--color-text-muted)] hover:text-rose-600 hover:bg-rose-500/10 transition-all disabled:opacity-50"
                title="Logout"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-glass border-t border-[var(--color-border-base)] z-50">
        <div className="flex items-center justify-around h-16 px-2">
          {navItems.slice(0, 5).map((item) => {
            const isActive = pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-all ${
                  isActive
                    ? 'text-primary-600'
                    : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-base)]'
                }`}
              >
                <div
                  className={`p-1.5 rounded-lg transition-colors ${isActive ? 'bg-primary-600/10' : ''}`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-tighter">
                  {item.name}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
