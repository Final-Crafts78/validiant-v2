'use client';

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
      <div className="min-h-screen flex flex-col items-center justify-center bg-surface-base">
        <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
        <p className="text-sm font-medium text-text-muted">
          Initializing your dashboard...
        </p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-surface-base px-4 text-center">
        <div className="w-16 h-16 bg-danger-subtle rounded-2xl flex items-center justify-center mb-6">
          <AlertCircle className="h-8 w-8 text-danger-strong" />
        </div>
        <h1 className="text-xl font-bold text-text-base mb-2">
          Service Connectivity Issue
        </h1>
        <p className="text-text-muted max-w-sm mb-8">
          We couldn&apos;t synchronize your dashboard data. This might be a
          temporary network interruption.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-2.5 bg-surface-lowest border border-border-base rounded-xl text-sm font-semibold text-text-subtle hover:bg-surface-muted transition-colors shadow-sm"
        >
          Re-establish Connection
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-surface-subtle)] pb-24">
      {/* Top Banner / Hero */}
      <div className="bg-surface-lowest border-b border-border-base pt-16 pb-12 px-4 sm:px-6 lg:px-8 mb-12">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 rounded-2xl bg-glow-gradient shadow-[0_0_15px_rgba(173,198,255,0.2)] flex items-center justify-center shrink-0">
                <LayoutDashboard className="w-8 h-8 text-[var(--color-surface-lowest)]" />
              </div>
              <div>
                <h1 className="text-3xl font-extrabold text-text-base tracking-tight flex items-center gap-2 font-display">
                  Welcome back, {user?.fullName?.split(' ')[0] || 'User'}{' '}
                  <Sparkles className="w-6 h-6 text-warning-strong" />
                </h1>
                <p className="text-text-muted font-medium">
                  {user?.email} {' · '} Profile Status:{' '}
                  <span className="text-success-strong">Active</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push(ROUTES.ONBOARDING)}
                className="btn btn-primary px-5 py-2.5"
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
          <div className="bg-surface-lowest border border-border-base p-5 rounded-3xl shadow-sm flex items-center justify-between group hover:border-primary/40 transition-all cursor-pointer overflow-hidden relative">
            <div className="relative z-10">
              <p className="text-xs font-bold text-text-muted uppercase tracking-widest mb-1">
                My Settings
              </p>
              <p className="text-sm font-bold text-text-base group-hover:text-primary">
                Profile & Security
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-surface-muted flex items-center justify-center group-hover:bg-primary/10 transition-colors">
              <Settings className="w-5 h-5 text-text-muted group-hover:text-primary" />
            </div>
          </div>
        </div>

        {/* Section Title */}
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-xl font-extrabold text-text-base tracking-tight font-display">
            Your Workspaces
          </h2>
          <span className="text-xs font-bold px-3 py-1 bg-surface-muted text-text-muted rounded-full uppercase tracking-tighter">
            {organizations.length} Active
          </span>
        </div>

        {/* Workspace Selection Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {organizations.map((org) => (
            <div
              key={org.id}
              className="group bg-surface-lowest border border-border-base rounded-3xl p-6 shadow-sm hover:shadow-xl hover:border-primary/40 transition-all duration-300 transform hover:-translate-y-1 cursor-pointer flex flex-col justify-between min-h-[220px]"
              onClick={() => handleSelectOrg(org.id, org.slug)}
            >
              <div>
                <div className="flex items-start justify-between mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-surface-muted flex items-center justify-center border border-border-subtle group-hover:bg-primary/10 group-hover:border-primary/20 transition-colors">
                    {org.logoUrl ? (
                      <img
                        src={org.logoUrl}
                        alt={org.name}
                        className="w-8 h-8 rounded-lg object-contain"
                      />
                    ) : (
                      <Building2 className="w-6 h-6 text-text-muted group-hover:text-primary transition-colors" />
                    )}
                  </div>
                  <div className="px-3 py-1 rounded-full bg-surface-container-low border border-border-subtle text-[10px] font-bold uppercase tracking-wider text-text-muted group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                    {org.industry || 'Enterprise'}
                  </div>
                </div>

                <h3 className="text-lg font-bold text-text-base group-hover:text-primary transition-colors truncate font-display">
                  {org.name}
                </h3>
                <p className="text-xs text-text-muted flex items-center gap-1.5 mt-1 font-mono">
                  validiant.in/{org.slug}
                </p>
              </div>

              <div className="mt-8 pt-5 border-t border-border-subtle flex items-center justify-between">
                <div className="flex items-center gap-4 text-[11px] font-bold text-text-muted">
                  <span className="flex items-center gap-1">
                    <Briefcase className="w-3 h-3 text-text-subtle" /> {org.projectCount || 0}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3 text-text-subtle" /> {org.memberCount || 0}
                  </span>
                </div>
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground translate-x-2 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all shadow-lg shadow-[var(--color-primary)]/40">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </div>
          ))}

          {/* Empty State / Add New */}
          {organizations.length < 6 && (
            <button
              onClick={() => router.push(ROUTES.ONBOARDING)}
              className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-border-base rounded-3xl hover:border-primary/40 hover:bg-primary/5 transition-all group"
            >
              <div className="w-12 h-12 rounded-full bg-surface-muted border border-border-subtle flex items-center justify-center mb-4 group-hover:bg-primary/10 group-hover:border-primary/20 transition-colors">
                <Plus className="w-6 h-6 text-text-muted group-hover:text-primary" />
              </div>
              <span className="text-sm font-bold text-text-subtle group-hover:text-primary transition-colors">
                Create New Organization
              </span>
            </button>
          )}
        </div>

        {/* Footer info */}
        <div className="mt-20 border-t border-border-base pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[10px] text-text-muted uppercase tracking-[0.2em] font-bold">
            Validiant Intelligence Platform v2.5.0-stable
          </p>
          <div className="flex items-center gap-6">
            <a
              href="#"
              className="text-xs font-bold text-text-muted hover:text-text-base transition-colors"
            >
              Knowledge Base
            </a>
            <a
              href="#"
              className="text-xs font-bold text-text-muted hover:text-text-base transition-colors"
            >
              Security Audit
            </a>
            <a
              href="#"
              className="text-xs font-bold text-text-muted hover:text-text-base transition-colors"
            >
              Terms of Service
            </a>
          </div>
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
    blue: 'bg-primary/10 text-primary border-primary/20',
    indigo: 'bg-secondary-container text-secondary border-border-subtle',
    emerald: 'bg-success-subtle text-success-strong border-success-strong/20',
  };

  return (
    <div className="bg-surface-lowest border border-border-base p-5 rounded-3xl shadow-sm hover:shadow-md transition-all">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">
          {label}
        </p>
        <div
          className={`w-8 h-8 rounded-xl flex items-center justify-center ${
            colorMap[color] || 'bg-surface-muted'
          }`}
        >
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <p className="text-3xl font-black text-text-base tracking-tight font-display">
        {value}
      </p>
    </div>
  );
}
