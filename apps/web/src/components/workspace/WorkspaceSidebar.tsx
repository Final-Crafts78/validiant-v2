'use client';

import React from 'react';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { cn } from '@validiant/ui';

interface WorkspaceSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  children?: React.ReactNode;
  title?: string;
}

/**
 * Obsidian Workspace Sidebar
 * 240px collapsible container for contextual navigation.
 * Portals from useSidebarContent render here.
 */
export function WorkspaceSidebar({
  collapsed,
  onToggle,
  children,
  title = 'Workspace',
}: WorkspaceSidebarProps) {
  return (
    <aside
      className={cn(
        'fixed left-16 top-0 bottom-0 border-r border-[var(--color-border-base)] bg-[var(--color-surface-base)] transition-all duration-300 ease-in-out z-40 overflow-hidden',
        collapsed ? 'w-0 border-none' : 'w-60'
      )}
    >
      <div className="flex h-full w-60 flex-col">
        {/* Sidebar Header */}
        <div className="flex h-16 flex-shrink-0 items-center justify-between border-b border-[var(--color-border-base)] px-4">
          <span className="text-sm font-bold uppercase tracking-widest text-[var(--color-text-base)]">
            {title}
          </span>
          <button
            onClick={onToggle}
            className="rounded-md p-1.5 text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface-soft)] hover:text-[var(--color-text-base)]"
          >
            <PanelLeftClose className="h-4 w-4" />
          </button>
        </div>

        {/* Sidebar Content (Portal Slot) */}
        <div
          id="sidebar-content-root"
          className="flex-1 overflow-y-auto p-4 scrollbar-hide"
        >
          {children}
        </div>

        {/* Sidebar Footer/Status */}
        <div className="flex-shrink-0 border-t border-[var(--color-border-base)] p-4 bg-[var(--color-surface-subtle)]/30">
          <div className="flex items-center gap-2 text-xs text-[var(--color-text-muted)]">
            <div className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
            <span>Systems Operational</span>
          </div>
        </div>
      </div>
    </aside>
  );
}

/**
 * Trigger to open sidebar when collapsed
 */
export function SidebarExpandTrigger({
  collapsed,
  onToggle,
}: {
  collapsed: boolean;
  onToggle: () => void;
}) {
  if (!collapsed) return null;

  return (
    <button
      onClick={onToggle}
      className="fixed left-20 top-4 z-30 rounded-lg border border-[var(--color-border-base)] bg-[var(--color-surface-base)] p-2 text-[var(--color-text-muted)] shadow-sm transition-all hover:scale-105 hover:text-[var(--color-text-base)]"
      title="Expand Sidebar"
    >
      <PanelLeftOpen className="h-5 w-5" />
    </button>
  );
}
