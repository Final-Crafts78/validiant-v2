'use client';

<<<<<<< Updated upstream
import { useOrganizations } from '@/hooks/useOrganizations';
import { Loader2, LayoutDashboard, Building } from 'lucide-react';
import Link from 'next/link';

export default function DashboardRedirect() {
  const { data: orgs, isLoading } = useOrganizations();

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[var(--color-surface-base)]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-[var(--color-accent-base)]" />
          <span className="text-sm font-bold uppercase tracking-widest text-[var(--color-text-muted)] animate-pulse">
            Loading Workspaces...
          </span>
        </div>
=======
/**
 * Basic Dashboard — Global Overview
 *
 * Provides a cross-organization summary for projects, tasks, and members.
 * Serves as the primary landing page after login.
 */

import { useRouter } from 'next/navigation';
import { useMemo } from 'react';
import {
  Building2,
  ArrowRight,
  LayoutDashboard,
  Plus,
  Loader2,
  AlertCircle,
  Sparkles,
  Users,
  Briefcase,
  Settings,
} from 'lucide-react';
import { useOrganizations } from '@/hooks/useOrganizations';
import { useAuthStore } from '@/store/auth';
import { useWorkspaceStore } from '@/store/workspace';
import { ROUTES } from '@/lib/config';

export default function BasicDashboard() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { data: organizations = [], isLoading, isError } = useOrganizations();
  const setActiveOrg = useWorkspaceStore((s) => s.setActiveOrg);

  // 📊 CALCULATE AGGREGATE METRICS
  const metrics = useMemo(() => {
    return {
      totalOrgs: organizations.length,
      totalProjects: organizations.reduce(
        (acc, org) => acc + (org.projectCount || 0),
        0
      ),
      totalMembers: organizations.reduce(
        (acc, org) => acc + (org.memberCount || 0),
        0
      ),
    };
  }, [organizations]);

  // 🔍 HIGH-VISIBILITY INSTRUMENTATION
  // eslint-disable-next-line no-console
  console.debug('[Dashboard:Basic] Rendering global overview', {
    userId: user?.id,
    metrics,
    orgSlugs: organizations.map((o) => o.slug),
    timestamp: new Date().toISOString(),
  });

  const handleSelectOrg = (orgId: string, slug: string) => {
    // eslint-disable-next-line no-console
    console.info(`[Dashboard:Basic] Routing to workspace: ${slug}`);
    setActiveOrg(orgId, slug);
    router.push(ROUTES.DASHBOARD(slug));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50/50">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600 mb-4" />
        <p className="text-sm font-medium text-slate-500">
          Initializing your dashboard...
        </p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50/50 px-4 text-center">
        <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mb-6">
          <AlertCircle className="h-8 w-8 text-red-500" />
        </div>
        <h1 className="text-xl font-bold text-slate-900 mb-2">
          Service Connectivity Issue
        </h1>
        <p className="text-slate-500 max-w-sm mb-8">
          We couldn&apos;t synchronize your dashboard data. This might be a
          temporary network interruption.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
        >
          Re-establish Connection
        </button>
>>>>>>> Stashed changes
      </div>
    );
  }

<<<<<<< Updated upstream
  if (!orgs || orgs.length === 0) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[var(--color-surface-base)]">
        <Link 
          href="/dashboard/onboarding" 
          className="bg-[var(--color-accent-base)] text-[var(--color-text-base)] px-6 py-3 rounded-lg font-bold hover:opacity-90 transition-opacity"
        >
          Create Organization
        </Link>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-[var(--color-surface-base)] p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-[var(--color-accent-base)]/10 text-[var(--color-accent-base)] rounded-2xl flex items-center justify-center mx-auto mb-6">
            <LayoutDashboard className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-black text-[var(--color-text-base)] mb-3 tracking-tight">Select Workspace</h1>
          <p className="text-[var(--color-text-muted)] text-sm">Choose an organization to continue</p>
        </div>

        <div className="flex flex-col gap-3">
          {orgs.map((org) => (
            <Link 
              key={org.id} 
              href={`/${org.slug || org.id}/dashboard`}
              className="group flex items-center gap-4 p-4 rounded-2xl bg-[var(--color-surface-subtle)] border border-[var(--color-border-base)] hover:border-[var(--color-accent-base)] hover:shadow-lg transition-all text-left"
            >
              <div className="w-12 h-12 rounded-xl bg-[var(--color-surface-soft)] flex items-center justify-center group-hover:bg-[var(--color-accent-base)] transition-colors overflow-hidden">
                {org.logoUrl ? (
                  <img src={org.logoUrl} alt={org.name} className="w-full h-full object-cover" />
                ) : (
                  <Building className="w-6 h-6 text-[var(--color-text-muted)] group-hover:text-[var(--color-text-base)]" />
                )}
              </div>
              <div className="flex flex-col flex-1">
                <span className="font-bold text-[var(--color-text-base)] group-hover:text-[var(--color-accent-base)] transition-colors">
                  {org.name}
                </span>
                <span className="text-xs text-[var(--color-text-muted)] font-mono">
                  {org.slug || org.id}
                </span>
=======
  return (
    <div className="min-h-screen bg-[var(--color-surface-subtle)] pb-24">
      {/* Top Banner / Hero */}
      <div className="bg-white border-b border-slate-200 pt-16 pb-12 px-4 sm:px-6 lg:px-8 mb-12">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 shadow-xl shadow-blue-500/20 flex items-center justify-center shrink-0">
                <LayoutDashboard className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                  Welcome back, {user?.fullName?.split(' ')[0] || 'User'}{' '}
                  <Sparkles className="w-6 h-6 text-amber-400" />
                </h1>
                <p className="text-slate-500 font-medium">
                  {user?.email} {' · '} Profile Status:{' '}
                  <span className="text-blue-600">Active</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push(ROUTES.ONBOARDING)}
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/25"
              >
                <Plus className="w-4 h-4" />
                New Workspace
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <MetricCard
            label="Total Organizations"
            value={metrics.totalOrgs}
            icon={Building2}
            color="blue"
          />
          <MetricCard
            label="Active Projects"
            value={metrics.totalProjects}
            icon={Briefcase}
            color="indigo"
          />
          <MetricCard
            label="Collaborators"
            value={metrics.totalMembers}
            icon={Users}
            color="emerald"
          />
          <div className="bg-white border border-slate-200 p-5 rounded-3xl shadow-sm flex items-center justify-between group hover:border-blue-200 transition-all cursor-pointer overflow-hidden relative">
            <div className="relative z-10">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">
                My Settings
              </p>
              <p className="text-sm font-bold text-slate-700 group-hover:text-blue-600">
                Profile & Security
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center group-hover:bg-blue-50 transition-colors">
              <Settings className="w-5 h-5 text-slate-400 group-hover:text-blue-600" />
            </div>
          </div>
        </div>

        {/* Section Title */}
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">
            Your Workspaces
          </h2>
          <span className="text-xs font-bold px-3 py-1 bg-slate-100 text-slate-500 rounded-full uppercase tracking-tighter">
            {organizations.length} Active
          </span>
        </div>

        {/* Workspace Selection Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {organizations.map((org) => (
            <div
              key={org.id}
              className="group bg-white border border-slate-200 rounded-3xl p-6 shadow-sm hover:shadow-xl hover:border-blue-200 transition-all duration-300 transform hover:-translate-y-1 cursor-pointer flex flex-col justify-between min-h-[220px]"
              onClick={() => handleSelectOrg(org.id, org.slug)}
            >
              <div>
                <div className="flex items-start justify-between mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center border border-slate-100 group-hover:bg-blue-50 group-hover:border-blue-100 transition-colors">
                    {org.logoUrl ? (
                      <img
                        src={org.logoUrl}
                        alt={org.name}
                        className="w-8 h-8 rounded-lg object-contain"
                      />
                    ) : (
                      <Building2 className="w-6 h-6 text-slate-400 group-hover:text-blue-500 transition-colors" />
                    )}
                  </div>
                  <div className="px-3 py-1 rounded-full bg-slate-50 border border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                    {org.industry || 'Enterprise'}
                  </div>
                </div>

                <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                  {org.name}
                </h3>
                <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-1">
                  validiant.in/{org.slug}
                </p>
              </div>

              <div className="mt-8 pt-5 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-4 text-[11px] font-bold text-slate-500">
                  <span className="flex items-center gap-1">
                    <Briefcase className="w-3 h-3" /> {org.projectCount || 0}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3" /> {org.memberCount || 0}
                  </span>
                </div>
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white translate-x-2 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all shadow-lg shadow-blue-500/40">
                  <ArrowRight className="w-4 h-4" />
                </div>
>>>>>>> Stashed changes
              </div>
              <div className="text-[var(--color-text-muted)] group-hover:text-[var(--color-accent-base)] transition-colors text-xl font-bold">
                &rarr;
              </div>
            </Link>
          ))}
<<<<<<< Updated upstream
=======

          {/* Empty State / Add New */}
          {organizations.length < 6 && (
            <button
              onClick={() => router.push(ROUTES.ONBOARDING)}
              className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-slate-200 rounded-3xl hover:border-blue-400 hover:bg-blue-50/20 transition-all group"
            >
              <div className="w-12 h-12 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center mb-4 group-hover:bg-blue-100 group-hover:border-blue-200 transition-colors">
                <Plus className="w-6 h-6 text-slate-400 group-hover:text-blue-600" />
              </div>
              <span className="text-sm font-bold text-slate-500 group-hover:text-blue-600 transition-colors">
                Create New Organization
              </span>
            </button>
          )}
        </div>

        {/* Footer info */}
        <div className="mt-20 border-t border-slate-200 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[10px] text-slate-400 uppercase tracking-[0.2em] font-bold">
            Validiant Intelligence Platform v2.5.0-stable
          </p>
          <div className="flex items-center gap-6">
            <a
              href="#"
              className="text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors"
            >
              Knowledge Base
            </a>
            <a
              href="#"
              className="text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors"
            >
              Security Audit
            </a>
            <a
              href="#"
              className="text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors"
            >
              Terms of Service
            </a>
          </div>
>>>>>>> Stashed changes
        </div>
      </div>
    </div>
  );
}

interface MetricCardProps {
  label: string;
  value: number;
  icon: React.ElementType;
  color: 'blue' | 'indigo' | 'emerald';
}

function MetricCard({ label, value, icon: Icon, color }: MetricCardProps) {
  const colorMap: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
  };

  return (
    <div className="bg-white border border-slate-200 p-5 rounded-3xl shadow-sm hover:shadow-md transition-all">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          {label}
        </p>
        <div
          className={`w-8 h-8 rounded-xl flex items-center justify-center ${
            colorMap[color] || 'bg-slate-50'
          }`}
        >
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <p className="text-3xl font-black text-slate-900 tracking-tight">
        {value}
      </p>
    </div>
  );
}
