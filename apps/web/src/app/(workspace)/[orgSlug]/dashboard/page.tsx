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
  AlertTriangle,
  FileText,
  CheckCircle2,
  Plus,
  Flag,
  Lock,
  History,
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
      trendColor: stats.slaBreached > 0 ? 'text-rose-600' : 'text-emerald-600',
      icon: Activity,
      iconBg: 'bg-blue-50',
      iconColor: 'text-blue-600',
    },
    {
      title: 'Pending Verifications',
      value: String(stats.pendingVerifications),
      trend: stats.pendingVerifications > 10 ? 'High volume' : 'Managed queue',
      trendColor:
        stats.pendingVerifications > 10 ? 'text-amber-600' : 'text-slate-500',
      icon: ShieldCheck,
      iconBg: 'bg-amber-50',
      iconColor: 'text-amber-600',
    },
    {
      title: 'Active Projects',
      value: String(stats.activeProjects),
      trend: 'Currently running',
      trendColor: 'text-emerald-600',
      icon: Target,
      iconBg: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
    },
    {
      title: 'Organizations',
      value: String(stats.orgCount),
      trend: 'Associated workspaces',
      trendColor: 'text-slate-500',
      icon: AlertTriangle,
      iconBg: 'bg-slate-100',
      iconColor: 'text-slate-500',
    },
  ];

  return (
    <div className="space-y-8">
      {/* ===================================================================
          PAGE HEADER
      =================================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">
            Welcome back, {firstName}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Here is your operational overview and compliance status.
          </p>
        </div>

        <button
          type="button"
          onClick={() => router.push(`/${orgSlug}/projects`)}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg shadow-sm hover:bg-blue-700 transition-colors shrink-0"
        >
          <FileText className="h-4 w-4" />
          Generate Report
        </button>
      </div>

      {/* ===================================================================
          KPI CARDS — 4-Column Grid
      =================================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
              className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col gap-3"
            >
              <div className="flex items-start justify-between">
                <p className="text-sm font-medium text-slate-500">{title}</p>
                <div
                  className={`w-9 h-9 rounded-full ${iconBg} flex items-center justify-center shrink-0`}
                >
                  <Icon className={`h-4 w-4 ${iconColor}`} />
                </div>
              </div>
              <p className="text-3xl font-bold text-slate-900 leading-none">
                {value}
              </p>
              <p className={`text-xs font-medium ${trendColor}`}>{trend}</p>
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
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-base font-semibold text-slate-900">
                Operational Velocity (7-Day Trend)
              </h2>
              {isAnalyticsLoading && (
                <span className="text-xs text-slate-400 animate-pulse">
                  Syncing...
                </span>
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
                      backgroundColor: '#fff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="completed"
                    stroke="#2563eb"
                    strokeWidth={2}
                    dot={{ r: 4, fill: '#2563eb', strokeWidth: 2 }}
                    activeDot={{ r: 6 }}
                    name="Completed Tasks"
                  />
                  <Line
                    type="monotone"
                    dataKey="active"
                    stroke="#94a3b8"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={false}
                    name="Active Workflows"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl shadow-sm">
            {/* Panel Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <h2 className="text-base font-semibold text-slate-900">
                Recent Operational Activity
              </h2>
              <button
                type="button"
                onClick={() => router.push(`/${orgSlug}/tasks`)}
                className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
              >
                View All
              </button>
            </div>

            {/* Activity List */}
            <ul className="divide-y divide-slate-100">
              {tasks.length === 0 && (
                <li className="px-6 py-10 text-center text-sm text-slate-400">
                  No recent activity
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
                    className="flex items-start gap-4 px-6 py-4"
                  >
                    <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center shrink-0 mt-0.5">
                      <CheckCircle2 className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-700 leading-snug truncate">
                        {task.title}
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        {task.status} ·{' '}
                        {task.updatedAt
                          ? new Date(task.updatedAt).toLocaleString()
                          : 'Just now'}
                      </p>
                    </div>
                  </li>
                ))}
            </ul>
          </div>
        </div>

        {/* -----------------------------------------------------------------
            RIGHT PANEL — Quick Actions (1 column)
        ----------------------------------------------------------------- */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm">
          {/* Panel Header */}
          <div className="px-6 py-4 border-b border-slate-200">
            <h2 className="text-base font-semibold text-slate-900">
              Quick Actions
            </h2>
          </div>

          {/* Action Buttons */}
          <div className="p-5 flex flex-col gap-3">
            <button
              onClick={() => router.push(`/${orgSlug}/tasks`)}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors text-left"
            >
              <Plus className="h-4 w-4 text-slate-500 shrink-0" /> Create New
              Task
            </button>

            <button
              onClick={() => router.push(`/${orgSlug}/tasks?status=pending`)}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors text-left"
            >
              <Flag className="h-4 w-4 text-slate-500 shrink-0" /> Review
              Pending Tasks
            </button>

            <PermissionGate permission="manageOrg">
              <button
                onClick={() => router.push(`/${orgSlug}/organizations`)}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors text-left"
              >
                <Lock className="h-4 w-4 text-slate-500 shrink-0" /> Manage
                Organizations
              </button>
            </PermissionGate>

            <button
              onClick={() => router.push(`/${orgSlug}/projects`)}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors text-left"
            >
              <History className="h-4 w-4 text-slate-500 shrink-0" /> View All
              Projects
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
    return <div className="p-8 text-slate-400">Loading workspace...</div>;

  if (!activeOrgId || !activeOrgSlug)
    return <div className="p-8 text-slate-400">No workspace selected.</div>;

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
        <h1 className="text-2xl font-extrabold text-slate-900">Your Tasks</h1>
        <p className="text-sm text-slate-500 mt-1">
          You have guest access. You can view and update tasks assigned to you.
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900">
            Assigned to You
          </h2>
          <span className="text-xs text-slate-400">{tasks.length} tasks</span>
        </div>
        {tasks.length === 0 ? (
          <div className="py-12 text-center text-sm text-slate-400">
            No tasks assigned yet.
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {tasks.map((task) => (
              <li
                key={task.id}
                className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50 cursor-pointer"
                onClick={() => router.push(`/${orgSlug}/tasks`)}
              >
                <CheckCircle2 className="w-4 h-4 text-slate-300 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">
                    {task.title}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
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
