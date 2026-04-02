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
import { tasksApi, projectsApi } from '@/lib/api';
import { Task, Project, TaskStatus } from '@validiant/shared';
import { usePermissions } from '@/hooks/usePermissions';
import { PermissionGate } from '@/components/auth/PermissionGate';
import {
  Activity,
  ShieldCheck,
  Target,
  FileText,
  CheckCircle2,
  Plus,
  Flag,
  Lock,
  History,
  LayoutGrid,
} from 'lucide-react';

import { useOrganizations } from '@/hooks/useOrganizations';
import { useWorkspaceStore } from '@/store/workspace';
import { analyticsApi } from '@/lib/api';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

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

  // 1. Data Fetching
  const { data: tasksRes } = useQuery({
    queryKey: ['tasks', 'my'],
    queryFn: () => tasksApi.getAll(),
    staleTime: 2 * 60 * 1000,
  });

  const { data: projectsRes } = useQuery({
    queryKey: ['projects', 'all'],
    queryFn: () => projectsApi.getAll(),
    staleTime: 2 * 60 * 1000,
  });

  const { data: analyticsRes, isLoading: isAnalyticsLoading } = useQuery({
    queryKey: ['analytics', 'latest', orgId],
    queryFn: () => analyticsApi.getLatest(),
    refetchInterval: 15 * 60 * 1000, // Sync with rollup worker
  });

  const { data: historyRes } = useQuery({
    queryKey: ['analytics', 'history', orgId],
    queryFn: () => analyticsApi.getHistory(7),
  });

  const { data: orgs = [] } = useOrganizations();

  const tasks: Task[] = tasksRes?.data?.data?.tasks ?? [];
  const projects: Project[] = projectsRes?.data?.data?.projects ?? [];
  const latestMetrics = analyticsRes?.data?.data?.data;

  // 2. Computed Metrics (Fallback to local if no snapshot yet)
  const stats = useMemo(() => {
    if (latestMetrics) {
      return {
        activeTasks: latestMetrics.tasks.pending,
        pendingVerifications: latestMetrics.tasks.byStatus?.['PENDING'] || 0,
        activeProjects: projects.filter((p) => p.status === 'active').length,
        orgCount: orgs.length,
        slaBreached: latestMetrics.sla.breached,
      };
    }

    // Fallback calculation
    return {
      activeTasks: tasks.filter(
        (t) =>
          t.status !== TaskStatus.COMPLETED && t.status !== TaskStatus.VERIFIED
      ).length,
      pendingVerifications: tasks.filter((t) => t.status === TaskStatus.PENDING)
        .length,
      activeProjects: projects.filter((p) => p.status === 'active').length,
      orgCount: orgs.length,
      slaBreached: 0,
    };
  }, [latestMetrics, tasks, projects, orgs]);

  // 3. Trend Formatting
  const chartData = useMemo(() => {
    const history = historyRes?.data?.data?.data;
    if (!history || !Array.isArray(history)) return [];
    return history.map(
      (h: {
        recordedAt: string;
        metrics: { tasks: { completed: number; pending: number } };
      }) => ({
        date: new Date(h.recordedAt).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        }),
        completed: h.metrics.tasks.completed,
        active: h.metrics.tasks.pending,
      })
    );
  }, [historyRes]);

  // Extract first name from fullName with null-safety
  const firstName = useMemo(() => {
    if (!user || !user.fullName) return 'Enterprise User';
    const parts = user.fullName.trim().split(' ');
    return parts[0] || user.fullName;
  }, [user]);

  const KPI_CARDS = [
    {
      title: 'Active Workflows',
      value: String(stats.activeTasks),
      trend:
        stats.slaBreached > 0
          ? `${stats.slaBreached} SLAs breached`
          : 'Optimized flow',
      trendColor:
        stats.slaBreached > 0
          ? 'text-rose-600 dark:text-rose-400'
          : 'text-emerald-600 dark:text-emerald-400',
      icon: Activity,
      iconBg: 'bg-primary-500/10',
      iconColor: 'text-primary-600 dark:text-primary-400',
    },
    {
      title: 'Pending Verifications',
      value: String(stats.pendingVerifications),
      trend: stats.pendingVerifications > 10 ? 'High volume' : 'Managed queue',
      trendColor:
        stats.pendingVerifications > 10
          ? 'text-amber-600 dark:text-amber-400'
          : 'text-[var(--color-text-muted)]',
      icon: ShieldCheck,
      iconBg: 'bg-amber-500/10',
      iconColor: 'text-amber-600 dark:text-amber-400',
    },
    {
      title: 'Active Projects',
      value: String(stats.activeProjects),
      trend: 'Currently running',
      trendColor: 'text-emerald-600 dark:text-emerald-400',
      icon: Target,
      iconBg: 'bg-emerald-500/10',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
    },
    {
      title: 'Organizations',
      value: String(stats.orgCount),
      trend: 'Associated workspaces',
      trendColor: 'text-[var(--color-text-muted)]',
      icon: LayoutGrid,
      iconBg: 'bg-slate-100 dark:bg-slate-800',
      iconColor: 'text-slate-600 dark:text-slate-400',
    },
  ];

  return (
    <div className="space-y-8">
      {/* ===================================================================
          PAGE HEADER
      =================================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-[var(--color-text-base)] tracking-tight">
            Welcome back, {firstName}
          </h1>
          <p className="mt-1 text-sm text-[var(--color-text-muted)] font-medium">
            Project status:{' '}
            <span className="text-emerald-600 dark:text-emerald-400 font-bold">
              Operational
            </span>{' '}
            · SLA compliance:{' '}
            <span className="text-primary-600 dark:text-primary-400 font-bold">
              98.2%
            </span>
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-black text-[var(--color-text-subtle)] bg-glass border border-[var(--color-border-base)] rounded-xl hover:bg-primary-50 dark:hover:bg-primary-950/20 transition-all shadow-sm"
          >
            <LayoutGrid className="h-4 w-4 text-primary-600" />
            Switch Organization
          </button>

          <button
            type="button"
            onClick={() => router.push(`/${orgSlug}/projects`)}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-black btn-primary rounded-xl shadow-lg shadow-primary-600/20 active:scale-95 transition-all"
          >
            <FileText className="h-4 w-4" />
            Generate Report
          </button>
        </div>
      </div>

      {/* ===================================================================
          KPI CARDS — 4-Column Grid
      =================================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-in fade-in slide-in-from-top-4 duration-500">
        {KPI_CARDS.map(
          ({
            title,
            value,
            trend,
            trendColor,
            icon: Icon,
            iconBg,
            iconColor,
          }) => (
            <div
              key={title}
              className="group bg-glass border border-[var(--color-border-base)] p-6 flex flex-col gap-4 rounded-3xl hover-lift shadow-sm"
            >
              <div className="flex items-start justify-between">
                <p className="text-[10px] font-black text-[var(--color-text-muted)] uppercase tracking-widest pl-1">
                  {title}
                </p>
                <div
                  className={`w-10 h-10 rounded-2xl ${iconBg} flex items-center justify-center shrink-0 shadow-sm group-hover:scale-110 transition-transform`}
                >
                  <Icon className={`h-5 w-5 ${iconColor}`} />
                </div>
              </div>
              <p className="text-4xl font-black text-[var(--color-text-base)] leading-none tracking-tight">
                {value}
              </p>
              <p
                className={`text-[10px] font-black uppercase tracking-wider ${trendColor}`}
              >
                {trend}
              </p>
            </div>
          )
        )}
      </div>

      {/* ===================================================================
          LOWER SECTION — Activity + Quick Actions
      =================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* -----------------------------------------------------------------
            LEFT PANEL — Recent Operational Activity (2 columns)
        ----------------------------------------------------------------- */}
        <div className="lg:col-span-2 space-y-6">
          {/* Analytics Chart (Phase 27) */}
          <div className="bg-glass border border-[var(--color-border-base)] p-8 rounded-3xl shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-base font-black text-[var(--color-text-base)] tracking-tight">
                  Operational Velocity
                </h2>
                <p className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-muted)] mt-1">
                  7-Day Performance Metric
                </p>
              </div>
              {isAnalyticsLoading && (
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary-600 animate-pulse">
                  <Activity className="h-3 w-3" />
                  Synchronizing...
                </div>
              )}
            </div>

            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#f1f5f9"
                  />
                  <XAxis
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748b', fontSize: 12 }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748b', fontSize: 12 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.8)',
                      backdropFilter: 'blur(12px)',
                      border: '1px solid var(--color-border-base)',
                      borderRadius: '16px',
                      fontSize: '11px',
                      fontWeight: '800',
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="completed"
                    stroke="#059669"
                    strokeWidth={3}
                    dot={{ r: 4, fill: '#059669', strokeWidth: 2 }}
                    activeDot={{
                      r: 6,
                    }}
                    name="Completed Tasks"
                  />
                  <Line
                    type="monotone"
                    dataKey="active"
                    stroke="#2563eb"
                    strokeWidth={3}
                    strokeDasharray="4 4"
                    dot={false}
                    name="Active Workflows"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Recent Operational Activity */}
          <div className="bg-glass border border-[var(--color-border-base)] rounded-3xl overflow-hidden shadow-sm">
            {/* Panel Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-[var(--color-border-base)]/30">
              <h2 className="text-base font-black text-[var(--color-text-base)] tracking-tight">
                Recent Operational Activity
              </h2>
              <button
                type="button"
                onClick={() => router.push(`/${orgSlug}/tasks`)}
                className="text-xs font-black uppercase tracking-widest text-primary-600 hover:text-primary-700 transition-colors"
              >
                View Logs
              </button>
            </div>

            {/* Activity List */}
            <ul className="divide-y divide-[var(--color-border-base)]/20 px-2">
              {tasks.length === 0 && (
                <li className="px-6 py-12 text-center text-sm text-[var(--color-text-muted)] italic font-medium">
                  No recent activity detected in the stream
                </li>
              )}
              {[...tasks]
                .sort(
                  (a, b) =>
                    new Date(b.updatedAt ?? b.createdAt).getTime() -
                    new Date(a.updatedAt ?? a.createdAt).getTime()
                )
                .slice(0, 5)
                .map((task) => (
                  <li
                    key={task.id}
                    className="flex items-start gap-4 px-4 py-4 rounded-2xl hover:bg-primary-50/50 dark:hover:bg-primary-950/10 transition-colors group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-primary-500/10 flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-110 transition-transform">
                      <CheckCircle2 className="h-5 w-5 text-primary-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-[var(--color-text-base)] font-black leading-snug truncate">
                        {task.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                          {task.status}
                        </span>
                        <span className="text-[10px] font-bold text-[var(--color-text-muted)]">
                          {task.updatedAt
                            ? new Date(task.updatedAt).toLocaleString()
                            : 'Synchronized now'}
                        </span>
                      </div>
                    </div>
                  </li>
                ))}
            </ul>
          </div>
        </div>

        {/* -----------------------------------------------------------------
            RIGHT PANEL — Quick Actions (1 column)
        ----------------------------------------------------------------- */}
        <div className="bg-glass border border-[var(--color-border-base)] rounded-3xl overflow-hidden shadow-sm flex flex-col">
          {/* Panel Header */}
          <div className="px-6 py-5 border-b border-[var(--color-border-base)]/30">
            <h2 className="text-base font-black text-[var(--color-text-base)] tracking-tight">
              Quick Actions
            </h2>
          </div>

          {/* Action Buttons */}
          <div className="p-6 flex flex-col gap-3">
            <button
              onClick={() => router.push(`/${orgSlug}/tasks`)}
              className="group w-full flex items-center justify-between px-4 py-3 text-sm font-black text-[var(--color-text-subtle)] bg-[var(--color-surface-base)] border border-[var(--color-border-base)] rounded-2xl hover:bg-primary-50 dark:hover:bg-primary-950/20 hover:text-primary-600 hover:border-primary-500/30 transition-all shadow-sm"
            >
              <div className="flex items-center gap-3">
                <Plus className="h-4 w-4 text-primary-600 shrink-0 group-hover:scale-125 transition-transform" />
                <span>Create New Task</span>
              </div>
            </button>

            <button
              onClick={() => router.push(`/${orgSlug}/tasks?status=pending`)}
              className="group w-full flex items-center justify-between px-4 py-3 text-sm font-black text-[var(--color-text-subtle)] bg-[var(--color-surface-base)] border border-[var(--color-border-base)] rounded-2xl hover:bg-primary-50 dark:hover:bg-primary-950/20 hover:text-primary-600 hover:border-primary-500/30 transition-all shadow-sm"
            >
              <div className="flex items-center gap-3">
                <Flag className="h-4 w-4 text-amber-600 shrink-0 group-hover:scale-125 transition-transform" />
                <span>Review Pending</span>
              </div>
            </button>

            <PermissionGate permission="manageOrg">
              <button
                onClick={() => router.push(`/${orgSlug}/organizations`)}
                className="group w-full flex items-center justify-between px-4 py-3 text-sm font-black text-[var(--color-text-subtle)] bg-[var(--color-surface-base)] border border-[var(--color-border-base)] rounded-2xl hover:bg-primary-50 dark:hover:bg-primary-950/20 hover:text-primary-600 hover:border-primary-500/30 transition-all shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <Lock className="h-4 w-4 text-slate-500 shrink-0 group-hover:scale-125 transition-transform" />
                  <span>Workspace Security</span>
                </div>
              </button>
            </PermissionGate>

            <button
              onClick={() => router.push(`/${orgSlug}/projects`)}
              className="group w-full flex items-center justify-between px-4 py-3 text-sm font-black text-[var(--color-text-subtle)] bg-[var(--color-surface-base)] border border-[var(--color-border-base)] rounded-2xl hover:bg-primary-50 dark:hover:bg-primary-950/20 hover:text-primary-600 hover:border-primary-500/30 transition-all shadow-sm"
            >
              <div className="flex items-center gap-3">
                <History className="h-4 w-4 text-emerald-600 shrink-0 group-hover:scale-125 transition-transform" />
                <span>Archive History</span>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Dashboard Switcher Component
// ---------------------------------------------------------------------------
export default function DashboardPage() {
  const activeOrgId = useWorkspaceStore((s) => s.activeOrgId);
  const activeOrgSlug = useWorkspaceStore((s) => s.activeOrgSlug);
  const { isLoading: isOrgsLoading } = useOrganizations();
  const { isGuest, isLoading: isPermsLoading } = usePermissions();

  if (isOrgsLoading || isPermsLoading)
    return (
      <div className="p-8 text-[var(--color-text-muted)]">
        Loading workspace...
      </div>
    );

  if (!activeOrgId || !activeOrgSlug)
    return (
      <div className="p-8 text-[var(--color-text-muted)]">
        No workspace selected.
      </div>
    );

  // GUEST gets a read-only shell with no action buttons
  if (isGuest) {
    return <GuestDashboard orgId={activeOrgId} orgSlug={activeOrgSlug} />;
  }

  return <GeneralDashboard orgId={activeOrgId} orgSlug={activeOrgSlug} />;
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
        <h1 className="text-2xl font-extrabold text-[var(--color-text-base)]">
          Your Tasks
        </h1>
        <p className="text-sm text-[var(--color-text-muted)] mt-1">
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
