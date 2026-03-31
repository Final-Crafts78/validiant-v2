'use client';

/**
 * Basic Dashboard — Global Overview
 *
 * Provides a cross-organization summary for projects, tasks, and members.
 * Serves as the primary landing page after login.
 * Premium Phase 25 UI with support for Glassmorphism and Corporate Dark/Light themes.
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
  ChevronRight,
  Calendar,
  Activity,
} from 'lucide-react';
import Link from 'next/link';
import { useOrganizations } from '@/hooks/useOrganizations';
import { useAuthStore } from '@/store/auth';
import { useWorkspaceStore } from '@/store/workspace';
import { ROUTES } from '@/lib/config';
import { cn } from '@validiant/ui';

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
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600 mb-4" />
        <p className="text-sm font-bold text-slate-500 animate-pulse uppercase tracking-widest">
          Synchronizing Neural Interface...
        </p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
        <div className="w-16 h-16 bg-red-50 dark:bg-rose-500/10 rounded-2xl flex items-center justify-center mb-6">
          <AlertCircle className="h-8 w-8 text-red-500" />
        </div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">
          System Connectivity Interrupted
        </h1>
        <p className="text-slate-500 dark:text-slate-400 max-w-sm mb-8 font-medium">
          We couldn&apos;t synchronize your global dashboard data. This might be a
          temporary network oscillation.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-8 py-3 bg-blue-600 text-white rounded-xl text-sm font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 active:scale-95"
        >
          Re-establish Uplink
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-10 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Premium Hero Banner */}
      <div className="relative overflow-hidden rounded-[2.5rem] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-10 shadow-2xl shadow-slate-200/50 dark:shadow-none group">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/5 rounded-full -mr-48 -mt-48 blur-[80px] group-hover:bg-blue-600/10 transition-colors duration-1000" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-600/5 rounded-full -ml-32 -mb-32 blur-[60px] group-hover:bg-indigo-600/10 transition-colors duration-1000" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-700 shadow-2xl shadow-blue-600/30 flex items-center justify-center shrink-0">
              <LayoutDashboard className="w-10 h-10 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter flex items-center gap-3">
                Console Overview <Sparkles className="w-8 h-8 text-amber-400 animate-pulse" />
              </h1>
              <p className="text-slate-500 dark:text-slate-400 font-bold mt-1 uppercase tracking-widest text-xs">
                Uplink Active {' · '} {user?.email}
              </p>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-4">
            <button
              onClick={() => router.push(ROUTES.ONBOARDING)}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl text-sm font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-600/20 flex items-center gap-2 group/btn active:scale-95"
            >
              <Plus className="w-4 h-4 transition-transform group-hover/btn:rotate-90" />
              New Workspace
            </button>
            <button
               onClick={() => router.push(ROUTES.DASHBOARD_PROFILE)}
               className="px-6 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-sm font-black uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-slate-700 transition-all flex items-center gap-2 active:scale-95"
            >
              <Settings className="w-4 h-4" />
              Settings
            </button>
          </div>
        </div>
      </div>

      {/* Global Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          label="Workspaces"
          value={metrics.totalOrgs}
          icon={Building2}
          color="blue"
          trend="+2 this month"
        />
        <MetricCard
          label="Active Projects"
          value={metrics.totalProjects}
          icon={Briefcase}
          color="indigo"
          trend="Across all orgs"
        />
        <MetricCard
          label="Team Members"
          value={metrics.totalMembers}
          icon={Users}
          color="emerald"
          trend="Unique identity count"
        />
        <MetricCard
          label="System Health"
          value="99.9%"
          icon={Activity}
          color="blue"
          trend="Global uptime"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Main Workspaces Content */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Active Workspaces
            </h2>
            <Link 
              href={ROUTES.DASHBOARD_ORGANIZATIONS}
              className="text-xs font-black uppercase tracking-widest text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
            >
              See All <ChevronRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {organizations.map((org) => (
              <div
                key={org.id}
                className="group relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] p-6 shadow-sm hover:shadow-2xl hover:border-blue-200 dark:hover:border-blue-900/30 transition-all duration-500 transform hover:-translate-y-1 cursor-pointer flex flex-col justify-between min-h-[200px]"
                onClick={() => handleSelectOrg(org.id, org.slug)}
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-blue-600/5 rounded-full -mr-12 -mt-12 blur-2xl group-hover:bg-blue-600/10 transition-colors" />
                
                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-6">
                    <div className="w-14 h-14 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center border border-slate-100 dark:border-slate-700 group-hover:bg-blue-50 dark:group-hover:bg-blue-950 transition-all duration-300 shadow-sm">
                      {org.logoUrl ? (
                        <img
                          src={org.logoUrl}
                          alt={org.name}
                          className="w-10 h-10 rounded-xl object-contain grayscale group-hover:grayscale-0 transition-all"
                        />
                      ) : (
                        <Building2 className="w-7 h-7 text-slate-400 group-hover:text-blue-500 transition-colors" />
                      )}
                    </div>
                    <div className="px-3 py-1 rounded-full bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 text-[9px] font-black uppercase tracking-widest text-slate-400 group-hover:text-blue-600 transition-colors">
                      {org.industry || 'Enterprise'}
                    </div>
                  </div>

                  <h3 className="text-lg font-black text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors truncate tracking-tight">
                    {org.name}
                  </h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1 opacity-70">
                    validiant.in/{org.slug}
                  </p>
                </div>

                <div className="relative z-10 mt-8 pt-5 border-t border-slate-50 dark:border-slate-800/50 flex items-center justify-between">
                  <div className="flex items-center gap-4 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                    <span className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-950 px-2 py-1 rounded-lg">
                      <Briefcase className="w-3 h-3 text-blue-500" /> {org.projectCount || 0}
                    </span>
                    <span className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-950 px-2 py-1 rounded-lg">
                      <Users className="w-3 h-3 text-indigo-500" /> {org.memberCount || 0}
                    </span>
                  </div>
                  <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white translate-x-2 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all shadow-xl shadow-blue-600/40">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            ))}

            {organizations.length < 6 && (
              <button
                onClick={() => router.push(ROUTES.ONBOARDING)}
                className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[2rem] hover:border-blue-400 dark:hover:border-blue-800 hover:bg-blue-50/20 dark:hover:bg-blue-900/10 transition-all group min-h-[200px]"
              >
                <div className="w-14 h-14 rounded-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex items-center justify-center mb-4 group-hover:bg-blue-100 dark:group-hover:bg-blue-950 transition-colors">
                  <Plus className="w-7 h-7 text-slate-400 group-hover:text-blue-600" />
                </div>
                <span className="text-xs font-black uppercase tracking-widest text-slate-400 group-hover:text-blue-600 transition-colors">
                  Initialize New Org
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Sidebar widgets */}
        <div className="space-y-8">
          {/* Quick Schedule/Tasks Widget */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-8 shadow-sm">
             <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-xl bg-indigo-600/10 text-indigo-600">
                  <Calendar className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Today</h3>
             </div>
             <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 transition-all hover:border-indigo-200 dark:hover:border-indigo-900/50">
                  <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-1">Priority Milestone</p>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200 leading-tight">Review quarterly architecture</p>
                  <p className="text-[10px] text-slate-400 mt-2 font-medium">9:30 AM · Global Workspace</p>
                </div>
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 opacity-60">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Sync Session</p>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200 leading-tight">Project Delta kick-off</p>
                  <p className="text-[10px] text-slate-400 mt-2 font-medium">2:00 PM · Acme Corp</p>
                </div>
             </div>
             <button className="w-full mt-6 py-3 rounded-xl border border-slate-100 dark:border-slate-800 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-950 transition-all">
                Full Schedule
             </button>
          </div>

          {/* Tips Widget */}
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[2.5rem] p-8 text-white shadow-xl shadow-blue-600/20">
             <Sparkles className="w-8 h-8 mb-4 opacity-50" />
             <h3 className="text-xl font-black tracking-tight leading-tight mb-2">Power User Tip</h3>
             <p className="text-sm font-medium text-blue-50/80 leading-relaxed mb-6">
                Use <code className="bg-white/20 px-1.5 py-0.5 rounded font-bold">Cmd + K</code> to trigger the Global Search and jump between organizations instantly.
             </p>
             <button className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">
                Learn More
             </button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface MetricCardProps {
  label: string;
  value: string | number;
  icon: React.ElementType;
  color: 'blue' | 'indigo' | 'emerald';
  trend?: string;
}

function MetricCard({ label, value, icon: Icon, color, trend }: MetricCardProps) {
  const colorMap: Record<string, string> = {
    blue: 'bg-blue-600/10 text-blue-600 border-blue-600/20 dark:bg-blue-600/20 dark:text-blue-400',
    indigo: 'bg-indigo-600/10 text-indigo-600 border-indigo-600/20 dark:bg-indigo-600/20 dark:text-indigo-400',
    emerald: 'bg-emerald-600/10 text-emerald-600 border-emerald-600/20 dark:bg-emerald-600/20 dark:text-emerald-400',
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-[2rem] shadow-sm hover:shadow-xl transition-all duration-300 group overflow-hidden relative">
      <div className="absolute top-0 right-0 w-20 h-20 bg-slate-50 dark:bg-slate-800/20 rounded-full translate-x-10 -translate-y-10 group-hover:scale-150 transition-transform duration-700" />
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div
            className={cn(
              "w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:rotate-12 duration-500",
              colorMap[color] || 'bg-slate-50'
            )}
          >
            <Icon className="w-6 h-6" />
          </div>
          {trend && (
            <span className="text-[10px] font-black uppercase tracking-tighter text-slate-400">
               {trend}
            </span>
          )}
        </div>
        <div>
          <p className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">
            {label}
          </p>
          <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}
