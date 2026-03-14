'use client';

import React, { useState } from 'react';
import { CommandRail } from '@/components/workspace/CommandRail';
import {
  WorkspaceSidebar,
  SidebarExpandTrigger,
} from '@/components/workspace/WorkspaceSidebar';
import { cn } from '@validiant/ui';

interface WorkspaceLayoutContentProps {
  children: React.ReactNode;
  orgSlug: string;
}

/**
 * Workspace Layout Content (Client Component)
 * Manages the interactive state of the workspace shell.
 */
export function WorkspaceLayoutContent({
  children,
  orgSlug,
}: WorkspaceLayoutContentProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-[var(--color-surface-base)] text-[var(--color-text-base)]">
      {/* 1. Fixed Command Rail (64px) */}
      <CommandRail orgSlug={orgSlug} />

      {/* 2. Contextual Sidebar (240px, Collapsible) */}
      <WorkspaceSidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* 3. Main Workspace Canvas (1fr) */}
      <main
        className={cn(
          'transition-all duration-300 ease-in-out min-h-screen',
          sidebarCollapsed ? 'pl-16' : 'pl-[304px]' // 64px (Rail) + 240px (Sidebar)
        )}
      >
        <SidebarExpandTrigger
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(false)}
        />

        <div className="max-w-[1600px] mx-auto p-4 md:p-8 animate-fade-in">
          {children}
        </div>
      </main>

      {/* Portal target for SidebarPortal is inside WorkspaceSidebar */}
    </div>
  );
}
