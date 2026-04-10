/**
 * Dashboard Page — Operations Overview
 *
 * Phase 8: Admin & Manager Dashboards
 * Corporate Light Theme — useAuthStore user consumed via selector.
 */

'use client';

import { useMemo } from 'react';
import { useAuthStore } from '@/store/auth';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { tasksApi } from '@/lib/api';
import { Task } from '@validiant/shared';
import { usePermissions } from '@/hooks/usePermissions';
import {
  CheckCircle2,
  FolderKanban,
} from 'lucide-react';

import { useOrganizations } from '@/hooks/useOrganizations';
import { useParams } from 'next/navigation';
import DashboardEngine from '@/components/dashboard-engine/DashboardEngine';

// ---------------------------------------------------------------------------
// General Dashboard Page Component
// ---------------------------------------------------------------------------
function GeneralDashboard({
  orgId,
  orgSlug,
}: {
  orgId: string;
  orgSlug: string;
}) {
  const user = useAuthStore((state) => state.user);
  const router = useRouter();

  // Extract first name from fullName with null-safety
  const firstName = useMemo(() => {
    if (!user || !user.fullName || user.fullName === 'null' || user.fullName.trim() === '') return 'Enterprise User';
    const parts = user.fullName.trim().split(' ');
    return parts[0] || user.fullName;
  }, [user]);

  return (
    <div className="space-y-8">
      {/* ===================================================================
          PAGE HEADER
      =================================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-text-base tracking-tight font-display">
            Welcome back, {firstName}
          </h1>
          <p className="mt-1 text-sm text-text-muted font-medium">
            Project status:{' '}
            <span className="text-success-strong font-bold">
              Operational
            </span>{' '}
            · SLA compliance:{' '}
            <span className="text-primary font-bold">
              98.2%
            </span>
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => router.push(`/${orgSlug}/projects`)}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-black text-white bg-[var(--color-accent-base)] hover:bg-[var(--color-accent-strong)] rounded-xl shadow-lg shadow-[var(--color-accent-base)]/20 active:scale-95 transition-all"
          >
            <FolderKanban className="h-4 w-4" />
            View Projects
          </button>
        </div>
      </div>

      <div className="mt-8">
        <DashboardEngine orgId={orgId} />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Dashboard Switcher Component
// ---------------------------------------------------------------------------
export default function DashboardPage() {
  const { orgSlug } = useParams() as { orgSlug: string };
  const { data: orgs, isLoading: isOrgsLoading } = useOrganizations();
  const activeOrgId = orgs?.find((o) => o.slug === orgSlug)?.id;
  const { isGuest, isLoading: isPermsLoading } = usePermissions();

  if (isOrgsLoading || isPermsLoading)
    return (
      <div className="p-8 text-[var(--color-text-muted)]">
        Loading workspace...
      </div>
    );

  if (!activeOrgId || !orgSlug)
    return (
      <div className="p-8 text-[var(--color-text-muted)]">
        No workspace selected.
      </div>
    );

  // GUEST gets a read-only shell with no action buttons
  if (isGuest) {
    return <GuestDashboard orgId={activeOrgId} orgSlug={orgSlug} />;
  }

  return <GeneralDashboard orgId={activeOrgId} orgSlug={orgSlug} />;
}

function GuestDashboard({
  orgId: _orgId,
  orgSlug,
}: {
  orgId: string;
  orgSlug: string;
}) {
  const router = useRouter();
  const { data: tasksRes } = useQuery({
    queryKey: ['tasks', 'my'],
    queryFn: () => tasksApi.getAll(),
    staleTime: 2 * 60 * 1000,
  });
  const tasks: Task[] = tasksRes?.data?.data?.tasks ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-text-base font-display">
          Your Tasks
        </h1>
        <p className="text-sm text-text-muted mt-1">
          You have guest access. You can view and update tasks assigned to you.
        </p>
      </div>

      <div className="card-surface overflow-hidden">
        <div className="px-6 py-4 border-b border-[var(--color-border-base)] flex items-center justify-between">
          <h2 className="text-base font-semibold text-[var(--color-text-base)]">
            Assigned to You
          </h2>
          <span className="text-xs text-[var(--color-text-muted)]">
            {tasks.length} tasks
          </span>
        </div>
        {tasks.length === 0 ? (
          <div className="py-12 text-center text-sm text-[var(--color-text-muted)]">
            No tasks assigned yet.
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {tasks.map((task) => (
              <li
                key={task.id}
                className="flex items-center gap-4 px-6 py-4 hover:bg-[var(--color-surface-muted)] cursor-pointer transition-colors"
                onClick={() => router.push(`/${orgSlug}/tasks`)}
              >
                <CheckCircle2 className="w-4 h-4 text-[var(--color-text-muted)] shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-[var(--color-text-base)] truncate">
                    {task.title}
                  </p>
                  <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                    {task.status} · {task.priority}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
