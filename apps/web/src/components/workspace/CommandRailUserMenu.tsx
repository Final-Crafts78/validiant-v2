'use client';

import React, { useMemo } from 'react';
import { useAuthStore } from '@/store/auth';
import { useOrganizations } from '@/hooks/useOrganizations';
import { useWorkspaceStore } from '@/store/workspace';
import { useRouter } from 'next/navigation';
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from '@validiant/ui';
import { LogOut, Building, Check, Settings } from 'lucide-react';
import { logoutAction } from '@/actions/auth.actions';

export function CommandRailUserMenu() {
  const user = useAuthStore((state) => state.user);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const { data: orgs = [] } = useOrganizations();
  const activeOrgId = useWorkspaceStore((s) => s.activeOrgId);
  const router = useRouter();

  const initials = useMemo(() => {
    if (!user?.fullName) return 'U';
    return user.fullName
      .split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  }, [user]);

  const activeOrg = orgs.find((o) => o.id === activeOrgId);

  const handleLogout = async () => {
    try {
      await logoutAction();
      clearAuth();
      router.push('/login');
    } catch (e) {
      console.error('Logout failed', e);
    }
  };

  const switchOrg = (slug: string) => {
    router.push(`/${slug}/dashboard`);
  };

  if (!user) return null;

  return (
    <Popover>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <PopoverTrigger asChild>
              <button className="relative flex items-center justify-center w-12 h-12 rounded-xl text-[var(--color-text-muted)] hover:bg-[var(--color-surface-soft)] hover:text-[var(--color-text-base)] transition-all">
                <div className="w-8 h-8 rounded-lg bg-[var(--color-surface-muted)] flex items-center justify-center text-xs font-bold text-[var(--color-text-base)] border border-[var(--color-border-base)]/20 shadow-sm overflow-hidden">
                  {user.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt={user.fullName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    initials
                  )}
                </div>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-[var(--color-surface-subtle)] rounded-full flex items-center justify-center border-2 border-[var(--color-surface-subtle)]">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                </div>
              </button>
            </PopoverTrigger>
          </TooltipTrigger>
          <TooltipContent side="right">Profile & Workspaces</TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <PopoverContent
        side="right"
        align="end"
        className="w-64 p-0 ml-2 overflow-hidden bg-glass border-[var(--color-border-base)]/30 shadow-obsidian rounded-2xl"
      >
        <div className="p-4 bg-[var(--color-surface-subtle)]/50 border-b border-[var(--color-border-base)]/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--color-accent-base)] flex items-center justify-center text-sm font-bold text-white shadow-sm overflow-hidden shrink-0">
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.fullName}
                  className="w-full h-full object-cover"
                />
              ) : (
                initials
              )}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-bold text-[var(--color-text-base)] truncate">
                {user.fullName}
              </span>
              <span className="text-xs text-[var(--color-text-muted)] truncate">
                {user.email}
              </span>
            </div>
          </div>
        </div>

        <div className="p-2 space-y-1">
          <div className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)] opacity-70 flex items-center gap-2">
            <Building className="w-3 h-3" /> Workspaces
          </div>
          {orgs.map((org) => {
            const isActive = org.id === activeOrgId;
            return (
              <button
                key={org.id}
                onClick={() => switchOrg(org.slug)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm transition-colors ${
                  isActive
                    ? 'bg-[var(--color-accent-subtle)]/10 text-[var(--color-accent-base)] font-bold'
                    : 'text-[var(--color-text-base)] hover:bg-[var(--color-surface-soft)]'
                }`}
              >
                <span className="truncate pr-2">{org.name}</span>
                {isActive && <Check className="w-4 h-4 shrink-0" />}
              </button>
            );
          })}
        </div>

        <div className="h-px bg-[var(--color-border-base)]/10 my-1 mx-2" />

        <div className="p-2 space-y-1">
          <button
            onClick={() =>
              activeOrg && router.push(`/${activeOrg.slug}/settings`)
            }
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-[var(--color-text-base)] hover:bg-[var(--color-surface-soft)] transition-colors"
          >
            <Settings className="w-4 h-4 text-[var(--color-text-muted)]" />{' '}
            Settings
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-red-500 hover:bg-red-500/10 transition-colors"
          >
            <LogOut className="w-4 h-4 opacity-80" /> Sign Out
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
