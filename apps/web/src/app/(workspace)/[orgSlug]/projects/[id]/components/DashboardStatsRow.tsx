'use client';

import {
  Database,
  CheckCircle2,
  Clock,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { ProjectRecord } from '@validiant/shared';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: {
    value: string;
    isUp: boolean;
  };
  colorClass: string;
}

function StatCard({ label, value, icon, trend, colorClass }: StatCardProps) {
  return (
    <div className="group relative bg-[var(--surface-container-low)] rounded-2xl border border-white/5 p-6 hover:border-white/10 transition-all duration-300">
      {/* Subtle Glow Effect */}
      <div
        className={`absolute -inset-0.5 bg-gradient-to-r from-transparent via-transparent to-transparent group-hover:from-${colorClass}/5 group-hover:to-transparent rounded-2xl blur opacity-0 group-hover:opacity-100 transition duration-500`}
      />

      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-1">
            {label}
          </p>
          <h3 className="text-3xl font-black text-[#dce1fb] tracking-tight">
            {value}
          </h3>

          {trend && (
            <div
              className={`flex items-center gap-1 mt-2 ${
                trend.isUp ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {trend.isUp ? (
                <TrendingUp className="w-3 h-3" />
              ) : (
                <TrendingDown className="w-3 h-3" />
              )}
              <span className="text-[10px] font-bold">{trend.value}</span>
            </div>
          )}
        </div>

        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center bg-${colorClass}/10 text-${colorClass}`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

export function DashboardStatsRow({ records }: { records: ProjectRecord[] }) {
  // 100% Data-Driven Stats Calculation
  const totalRecords = records.length;
  const verifiedCount = records.filter((r) => r.status === 'completed').length;
  const pendingCount = records.filter((r) => r.status === 'pending').length;

  // Mocked trend data for now, but values are real
  const stats = [
    {
      label: 'Total Records',
      value: totalRecords.toLocaleString(),
      icon: <Database className="w-5 h-5" />,
      trend: { value: '+42 this week', isUp: true },
      colorClass: 'primary',
    },
    {
      label: 'Verified Records',
      value: verifiedCount.toLocaleString(),
      icon: <CheckCircle2 className="w-5 h-5" />,
      trend: {
        value: `${Math.round((verifiedCount / (totalRecords || 1)) * 100)}% total`,
        isUp: true,
      },
      colorClass: 'emerald-400',
    },
    {
      label: 'Pending Review',
      value: pendingCount.toLocaleString(),
      icon: <Clock className="w-5 h-5" />,
      trend: { value: 'Requires Action', isUp: false },
      colorClass: 'amber-400',
    },
    {
      label: 'At Risk (SLA)',
      value: records.filter(
        (r) =>
          r.status === 'pending' &&
          new Date().getTime() - new Date(r.updatedAt).getTime() >
            24 * 60 * 60 * 1000
      ).length,
      icon: <AlertTriangle className="w-5 h-5" />,
      colorClass: 'rose-400',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, idx) => (
        <StatCard key={idx} {...stat} />
      ))}
    </div>
  );
}
