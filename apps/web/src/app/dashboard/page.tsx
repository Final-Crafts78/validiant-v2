/**
 * Dashboard Page — Operations Overview
 *
 * Phase 8: Admin & Manager Dashboards
 * Corporate Light Theme — useAuthStore user consumed via selector.
 */

'use client';

import { useMemo } from 'react';
import { useAuthStore } from '@/store/auth';
import {
  Activity,
  ShieldCheck,
  Target,
  AlertTriangle,
  FileText,
  CheckCircle2,
  Database,
  Clock,
  Plus,
  Flag,
  Lock,
  History,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface KpiCard {
  title: string;
  value: string;
  trend: string;
  trendColor: string;
  icon: React.ComponentType<{ className?: string }>;
  iconBg: string;
  iconColor: string;
}

interface ActivityItem {
  id: number;
  text: string;
  time: string;
  icon: React.ComponentType<{ className?: string }>;
  iconBg: string;
  iconColor: string;
}

interface QuickAction {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

// ---------------------------------------------------------------------------
// Static data
// ---------------------------------------------------------------------------
const KPI_CARDS: KpiCard[] = [
  {
    title: 'Active Workflows',
    value: '1,248',
    trend: '+12% this week',
    trendColor: 'text-emerald-600',
    icon: Activity,
    iconBg: 'bg-blue-50',
    iconColor: 'text-blue-600',
  },
  {
    title: 'Pending Verifications',
    value: '42',
    trend: 'Needs attention',
    trendColor: 'text-amber-600',
    icon: ShieldCheck,
    iconBg: 'bg-amber-50',
    iconColor: 'text-amber-600',
  },
  {
    title: 'Compliance Rate',
    value: '99.8%',
    trend: 'Target: 99.9%',
    trendColor: 'text-slate-500',
    icon: Target,
    iconBg: 'bg-emerald-50',
    iconColor: 'text-emerald-600',
  },
  {
    title: 'System Alerts',
    value: '0',
    trend: 'All systems nominal',
    trendColor: 'text-emerald-600',
    icon: AlertTriangle,
    iconBg: 'bg-slate-100',
    iconColor: 'text-slate-500',
  },
];

const ACTIVITY_ITEMS: ActivityItem[] = [
  {
    id: 1,
    text: 'Background check cleared for Candidate ID #892',
    time: '2 mins ago',
    icon: CheckCircle2,
    iconBg: 'bg-emerald-50',
    iconColor: 'text-emerald-600',
  },
  {
    id: 2,
    text: 'Workflow #441 marked as urgent by Operations Manager',
    time: '18 mins ago',
    icon: Flag,
    iconBg: 'bg-amber-50',
    iconColor: 'text-amber-600',
  },
  {
    id: 3,
    text: 'System backup completed — all data snapshots verified',
    time: '1 hr ago',
    icon: Database,
    iconBg: 'bg-blue-50',
    iconColor: 'text-blue-600',
  },
  {
    id: 4,
    text: 'Automated compliance report generated for Q1 2026',
    time: '3 hrs ago',
    icon: FileText,
    iconBg: 'bg-slate-100',
    iconColor: 'text-slate-600',
  },
  {
    id: 5,
    text: 'KYC verification initiated for 12 new onboarding requests',
    time: '5 hrs ago',
    icon: Clock,
    iconBg: 'bg-indigo-50',
    iconColor: 'text-indigo-600',
  },
];

const QUICK_ACTIONS: QuickAction[] = [
  { label: 'Create New Workflow', icon: Plus },
  { label: 'Review Pending Flags', icon: Flag },
  { label: 'Manage Access Roles', icon: Lock },
  { label: 'System Audit Log', icon: History },
];

// ---------------------------------------------------------------------------
// Dashboard Page Component
// ---------------------------------------------------------------------------
export default function DashboardPage() {
  const user = useAuthStore((state) => state.user);

  // Extract first name from fullName with null-safety — preserved from original
  const firstName = useMemo(() => {
    if (!user || !user.fullName) return 'Enterprise User';
    const parts = user.fullName.trim().split(' ');
    return parts[0] || user.fullName;
  }, [user]);

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
        {KPI_CARDS.map(({ title, value, trend, trendColor, icon: Icon, iconBg, iconColor }) => (
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
        ))}
      </div>

      {/* ===================================================================
          LOWER SECTION — Activity + Quick Actions
      =================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* -----------------------------------------------------------------
            LEFT PANEL — Recent Operational Activity (2 columns)
        ----------------------------------------------------------------- */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl shadow-sm">
          {/* Panel Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
            <h2 className="text-base font-semibold text-slate-900">
              Recent Operational Activity
            </h2>
            <button
              type="button"
              className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
            >
              View All
            </button>
          </div>

          {/* Activity List */}
          <ul className="divide-y divide-slate-100">
            {ACTIVITY_ITEMS.map(({ id, text, time, icon: Icon, iconBg, iconColor }) => (
              <li key={id} className="flex items-start gap-4 px-6 py-4">
                <div
                  className={`w-9 h-9 rounded-full ${iconBg} flex items-center justify-center shrink-0 mt-0.5`}
                >
                  <Icon className={`h-4 w-4 ${iconColor}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-700 leading-snug">{text}</p>
                  <p className="mt-1 text-xs text-slate-400">{time}</p>
                </div>
              </li>
            ))}
          </ul>
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
            {QUICK_ACTIONS.map(({ label, icon: Icon }) => (
              <button
                key={label}
                type="button"
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors text-left"
              >
                <Icon className="h-4 w-4 text-slate-500 shrink-0" />
                {label}
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
