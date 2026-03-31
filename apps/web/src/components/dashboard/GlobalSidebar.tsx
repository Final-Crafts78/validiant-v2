'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  Building2,
  User,
  Settings,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@validiant/ui';
import { ROUTES } from '@/lib/config';

interface SidebarItem {
  icon: React.ElementType;
  label: string;
  href: string;
  exact?: boolean;
}

const sidebarItems: SidebarItem[] = [
  {
    icon: LayoutDashboard,
    label: 'Overview',
    href: ROUTES.DASHBOARD_ROOT,
    exact: true,
  },
  { icon: FolderKanban, label: 'Projects', href: ROUTES.DASHBOARD_PROJECTS },
  { icon: CheckSquare, label: 'Tasks', href: ROUTES.DASHBOARD_TASKS },
  {
    icon: Building2,
    label: 'Organizations',
    href: ROUTES.DASHBOARD_ORGANIZATIONS,
  },
];

const bottomItems: SidebarItem[] = [
  { icon: User, label: 'Profile', href: ROUTES.DASHBOARD_PROFILE },
  { icon: Settings, label: 'Settings', href: ROUTES.DASHBOARD_SETTINGS },
];

export function GlobalSidebar() {
  const pathname = usePathname();

  const isActive = (href: string, exact = false) => {
    return exact ? pathname === href : pathname.startsWith(href);
  };

  return (
    <aside className="hidden md:flex flex-col w-64 bg-[var(--color-surface-base)] border-r border-[var(--color-border-base)] sticky top-0 h-screen overflow-y-auto z-30 transition-all duration-300 ease-in-out">
      <div className="p-6">
        <Link
          href={ROUTES.DASHBOARD_ROOT}
          className="flex items-center gap-3 group"
        >
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform duration-200">
            <LayoutDashboard className="h-6 w-6 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold text-[var(--color-text-base)] tracking-tight">
              Validiant
            </span>
            <span className="text-[10px] uppercase tracking-widest text-[var(--color-text-muted)] font-semibold">
              Global Console
            </span>
          </div>
        </Link>
      </div>

      <nav className="flex-1 px-4 space-y-1.5 py-2">
        <div className="px-3 mb-2 text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)] opacity-50">
          Main Menu
        </div>
        {sidebarItems.map((item) => {
          const active = isActive(item.href, item.exact);
          return (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                'group flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                active
                  ? 'bg-blue-600/10 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 shadow-sm'
                  : 'text-[var(--color-text-subtle)] hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-text-base)]'
              )}
            >
              <div className="flex items-center gap-3">
                <item.icon
                  className={cn(
                    'w-4.5 h-4.5 transition-transform duration-200',
                    active ? 'scale-110' : 'group-hover:scale-110'
                  )}
                />
                <span>{item.label}</span>
              </div>
              {active && <ChevronRight className="w-4 h-4 opacity-70" />}
            </Link>
          );
        })}
      </nav>

      <div className="px-4 py-6 mt-auto space-y-1.5 border-t border-[var(--color-border-base)]/50">
        <div className="px-3 mb-2 text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)] opacity-50">
          Account & Privacy
        </div>
        {bottomItems.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                'group flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                active
                  ? 'bg-blue-600/10 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 shadow-sm'
                  : 'text-[var(--color-text-subtle)] hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-text-base)]'
              )}
            >
              <div className="flex items-center gap-3">
                <item.icon
                  className={cn(
                    'w-4.5 h-4.5 transition-transform duration-200',
                    active ? 'scale-110' : 'group-hover:scale-110'
                  )}
                />
                <span>{item.label}</span>
              </div>
              {active && <ChevronRight className="w-4 h-4 opacity-70" />}
            </Link>
          );
        })}
      </div>

      {/* Premium Footer Upgrade */}
      <div className="p-4 mx-4 mb-6 rounded-2xl bg-gradient-to-br from-blue-600/5 to-indigo-600/5 border border-blue-500/10 dark:from-blue-400/5 dark:to-indigo-400/5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600/20 flex items-center justify-center text-blue-600">
            <Building2 className="w-4 h-4" />
          </div>
          <div className="flex flex-col">
            <span className="text-[11px] font-bold text-[var(--color-text-base)]">
              Enterprise Plan
            </span>
            <span className="text-[9px] text-[var(--color-text-muted)]">
              Premium Dashboard
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}
