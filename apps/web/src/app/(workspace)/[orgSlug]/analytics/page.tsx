'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { analyticsApi } from '@/lib/api';
import {
  BarChart3,
  TrendingUp,
  Clock,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

export default function AnalyticsPage() {
  const { orgSlug } = useParams() as { orgSlug: string };

  const { data: analyticsRes, isLoading } = useQuery({
    queryKey: ['analytics', 'full', orgSlug],
    queryFn: () => analyticsApi.getLatest(),
  });

  const { data: historyRes } = useQuery({
    queryKey: ['analytics', 'history', orgSlug],
    queryFn: () => analyticsApi.getHistory(30),
  });

  const metrics = analyticsRes?.data?.data?.data;
  const history = historyRes?.data?.data?.data ?? [];

  const chartData = useMemo(() => {
    return history
      .map(
        (h: {
          recordedAt: string;
          metrics: { tasks: { completed: number; pending: number } };
        }) => ({
          date: new Date(h.recordedAt).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
          }),
          throughput: h.metrics.tasks.completed,
          active: h.metrics.tasks.pending,
        })
      )
      .reverse();
  }, [history]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--color-accent-base)]" />
        <p className="text-[var(--color-text-muted)] font-medium">
          Crunching workspace data...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-[var(--color-text-base)] tracking-tight">
          Analytics Command Center
        </h1>
        <p className="text-[var(--color-text-muted)] mt-1.5 flex items-center gap-2">
          Real-time operational intelligence for{' '}
          <span className="font-bold text-[var(--color-text-base)]">
            {orgSlug}
          </span>
        </p>
      </div>

      {/* Hero Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          {
            label: 'Workforce Velocity',
            value: metrics?.tasks.completed || 0,
            icon: TrendingUp,
            color: 'text-success-600',
            bg: 'bg-success-500/10',
          },
          {
            label: 'Active Pipeline',
            value: metrics?.tasks.pending || 0,
            icon: BarChart3,
            color: 'text-[var(--color-accent-base)]',
            bg: 'bg-primary-500/10',
          },
          {
            label: 'Wait Time (Avg)',
            value: '1.4d',
            icon: Clock,
            color: 'text-warning-600',
            bg: 'bg-warning-500/10',
          },
          {
            label: 'SLA Exceptions',
            value: metrics?.sla.breached || 0,
            icon: AlertCircle,
            color: 'text-critical-600',
            bg: 'bg-critical-500/10',
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="card-surface p-6 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-2 rounded-xl ${stat.bg}`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
            </div>
            <p className="text-sm font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
              {stat.label}
            </p>
            <p className="text-3xl font-black text-[var(--color-text-base)] mt-1">
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Velocity Chart */}
        <div className="lg:col-span-2 card-surface p-6 shadow-sm">
          <h3 className="text-lg font-bold text-[var(--color-text-subtle)] mb-6">
            Execution Velocity (30 Days)
          </h3>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="var(--color-border-base)"
                />
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: '12px',
                    border: '1px solid var(--color-border-base)',
                    backgroundColor: 'var(--color-surface-base)',
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                  }}
                  itemStyle={{ color: 'var(--color-text-base)' }}
                />
                <Line
                  type="monotone"
                  dataKey="throughput"
                  stroke="var(--color-accent-base)"
                  strokeWidth={4}
                  dot={{
                    r: 4,
                    fill: 'var(--color-accent-base)',
                    strokeWidth: 2,
                  }}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                />
                <Line
                  type="monotone"
                  dataKey="active"
                  stroke="var(--color-text-muted)"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Distribution Chart */}
        <div className="card-surface p-6 shadow-sm">
          <h3 className="text-lg font-bold text-[var(--color-text-subtle)] mb-6">
            Task Distribution
          </h3>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={[
                  {
                    name: 'Pending',
                    count: metrics?.tasks.byStatus?.PENDING || 0,
                  },
                  {
                    name: 'In Progress',
                    count: metrics?.tasks.byStatus?.IN_PROGRESS || 0,
                  },
                  {
                    name: 'Review',
                    count: metrics?.tasks.byStatus?.IN_REVIEW || 0,
                  },
                  {
                    name: 'Verified',
                    count: metrics?.tasks.byStatus?.VERIFIED || 0,
                  },
                ]}
              >
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'var(--color-text-muted)', fontSize: 10 }}
                />
                <Tooltip cursor={{ fill: 'var(--color-surface-soft)' }} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {[0, 1, 2, 3].map((_entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={['#cbd5e1', '#3b82f6', '#f59e0b', '#10b981'][index]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
