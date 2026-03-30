'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  CheckSquare,
  Settings,
  BarChart3,
  Database,
  Bell,
  Search,
  Plus,
} from 'lucide-react';
import { cn } from '@validiant/ui';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@validiant/ui';

interface RailItem {
  icon: React.ElementType;
  label: string;
  href: string;
  exact?: boolean;
}

const mainItems: RailItem[] = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
  { icon: CheckSquare, label: 'Tasks', href: '/tasks' },
  { icon: BarChart3, label: 'Analytics', href: '/analytics' },
  { icon: Database, label: 'Infrastructure', href: '/infra' },
];

const secondaryItems: RailItem[] = [
  { icon: Search, label: 'Search', href: '/search' },
  { icon: Bell, label: 'Notifications', href: '/notifications' },
  { icon: Settings, label: 'Settings', href: '/settings' },
];

/**
 * Obsidian Command Rail
 * Fixed width navigation that persists across workspace transitions.
 */
export function CommandRail({ orgSlug }: { orgSlug: string }) {
  const pathname = usePathname();

  const isActive = (href: string, exact = false) => {
    const fullHref = `/${orgSlug}${href}`;
    return exact ? pathname === fullHref : pathname.startsWith(fullHref);
  };

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-16 bg-[var(--color-surface-subtle)] border-r border-[var(--color-border-base)] flex flex-col items-center py-4 z-50">
      {/* Brand Logo Slot */}
      <div className="mb-8 p-2 rounded-xl bg-[var(--color-accent-base)] text-white shadow-lg shadow-[var(--color-accent-base)]/20">
        <div className="w-8 h-8 flex items-center justify-center font-bold text-xl">
          V
        </div>
      </div>

      {/* Global Actions */}
      <div className="flex flex-col gap-4 flex-1 w-full items-center">
        <TooltipProvider>
          {mainItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Tooltip key={item.label}>
                <TooltipTrigger asChild>
                  <Link
                    href={`/${orgSlug}${item.href}`}
                    className={cn(
                      'group relative flex items-center justify-center w-12 h-12 rounded-xl transition-all duration-200',
                      active
                        ? 'bg-[var(--color-accent-subtle)]/10 text-[var(--color-accent-base)]'
                        : 'text-[var(--color-text-muted)] hover:bg-[var(--color-surface-soft)] hover:text-[var(--color-text-base)]'
                    )}
                  >
                    <item.icon
                      className={cn(
                        'w-5 h-5 transition-transform group-hover:scale-110',
                        active && 'animate-pulse'
                      )}
                    />
                    {active && (
                      <div className="absolute left-0 top-3 bottom-3 w-1 bg-[var(--color-accent-base)] rounded-r-md" />
                    )}
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right">{item.label}</TooltipContent>
              </Tooltip>
            );
          })}
        </TooltipProvider>

        <div className="h-px w-8 bg-[var(--color-border-base)] my-2" />

        <TooltipProvider>
          <Popover>
            <Tooltip>
              <TooltipTrigger asChild>
                <PopoverTrigger asChild>
                  <button className="flex items-center justify-center w-12 h-12 rounded-xl bg-[var(--color-surface-soft)] text-[var(--color-text-base)] hover:bg-[var(--color-surface-subtle)] transition-all shadow-sm border border-[var(--color-border-base)]/50 group">
                    <Plus className="w-5 h-5 transition-transform group-hover:rotate-90" />
                  </button>
                </PopoverTrigger>
              </TooltipTrigger>
              <TooltipContent side="right">Quick Create</TooltipContent>
            </Tooltip>
            <PopoverContent side="right" align="center" className="w-56 p-2 space-y-1">
              <div className="px-2 py-1.5 mb-1 text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)] opacity-50">
                Quick Actions
              </div>
              <Link
                href={`/${orgSlug}/tasks/new`}
                className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm text-[var(--color-text-base)] hover:bg-[var(--color-accent-subtle)]/10 hover:text-[var(--color-accent-base)] transition-colors group"
              >
                <div className="w-8 h-8 rounded-md bg-[var(--color-surface-soft)] flex items-center justify-center group-hover:bg-[var(--color-accent-subtle)]/20">
                  <CheckSquare className="w-4 h-4" />
                </div>
                <div className="flex flex-col">
                  <span>New Task</span>
                  <span className="text-[10px] text-[var(--color-text-muted)]">Assign work to your team</span>
                </div>
              </Link>
              <Link
                href={`/${orgSlug}/infra/new`}
                className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm text-[var(--color-text-base)] hover:bg-[var(--color-accent-subtle)]/10 hover:text-[var(--color-accent-base)] transition-colors group"
              >
                <div className="w-8 h-8 rounded-md bg-[var(--color-surface-soft)] flex items-center justify-center group-hover:bg-[var(--color-accent-subtle)]/20">
                  <Database className="w-4 h-4" />
                </div>
                <div className="flex flex-col">
                  <span>New Resource</span>
                  <span className="text-[10px] text-[var(--color-text-muted)]">Provision infrastructure</span>
                </div>
              </Link>
              <div className="h-px bg-[var(--color-border-base)] my-1 mx-2" />
              <Link
                href="/organizations/new"
                className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm text-[var(--color-text-base)] hover:bg-[var(--color-surface-soft)] transition-colors group"
              >
                <div className="w-8 h-8 rounded-md bg-[var(--color-surface-soft)] flex items-center justify-center group-hover:bg-[var(--color-surface-subtle)]">
                  <LayoutDashboard className="w-4 h-4" />
                </div>
                <div className="flex flex-col">
                  <span>New Organization</span>
                  <span className="text-[10px] text-[var(--color-text-muted)]">Create a new workspace</span>
                </div>
              </Link>
            </PopoverContent>
          </Popover>
        </TooltipProvider>
      </div>

      {/* Settings & User */}
      <div className="flex flex-col gap-4 w-full items-center pb-2">
        <TooltipProvider>
          {secondaryItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Tooltip key={item.label}>
                <TooltipTrigger asChild>
                  <Link
                    href={`/${orgSlug}${item.href}`}
                    className={cn(
                      'flex items-center justify-center w-12 h-12 rounded-xl transition-all duration-200',
                      active
                        ? 'bg-[var(--color-accent-subtle)]/10 text-[var(--color-accent-base)]'
                        : 'text-[var(--color-text-muted)] hover:bg-[var(--color-surface-soft)] hover:text-[var(--color-text-base)]'
                    )}
                  >
                    <item.icon className="w-5 h-5" />
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right">{item.label}</TooltipContent>
              </Tooltip>
            );
          })}
        </TooltipProvider>
      </div>
    </aside>
  );
}
