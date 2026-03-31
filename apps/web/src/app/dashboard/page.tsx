'use client';

/**
 * Dashboard Root Page — Workspace Selector
 * 
 * Lists all organizations the user belongs to.
 * Provides a portal into specific organization workspaces.
 */

import { useRouter } from 'next/navigation';
import { useOrganizations } from '@/hooks/useOrganizations';
import { useWorkspaceStore } from '@/store/workspace';
import { ROUTES } from '@/lib/config';
import { 
  Building2, 
  ArrowRight, 
  LayoutDashboard, 
  Plus, 
  Loader2, 
  AlertCircle,
  Sparkles
} from 'lucide-react';

export default function DashboardRootPage() {
  const router = useRouter();
  const { data: organizations = [], isLoading, isError } = useOrganizations();
  const setActiveOrg = useWorkspaceStore((s) => s.setActiveOrg);

  // 🔍 HIGH-VISIBILITY INSTRUMENTATION
  console.debug('[Dashboard:Root] Rendering selector', {
    orgCount: organizations.length,
    isLoading,
    timestamp: new Date().toISOString(),
  });

  const handleSelectOrg = (orgId: string, slug: string) => {
    console.log(`[Dashboard:Root] Selecting workspace: ${slug} (${orgId})`);
    setActiveOrg(orgId, slug);
    router.push(ROUTES.DASHBOARD(slug));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50/50">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600 mb-4" />
        <p className="text-sm font-medium text-slate-500">Retrieving your workspaces...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50/50 px-4">
        <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mb-6">
          <AlertCircle className="h-8 w-8 text-red-500" />
        </div>
        <h1 className="text-xl font-bold text-slate-900 mb-2">Workspace Access Error</h1>
        <p className="text-slate-500 text-center max-w-sm mb-8">
          We encountered a problem retrieving your organizations. This might be due to a session timeout.
        </p>
        <button 
          onClick={() => window.location.reload()}
          className="px-6 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  // Fallback to onboarding if no organizations found
  if (organizations.length === 0) {
    console.warn('[Dashboard:Root] No organizations found, redirecting to onboarding');
    router.replace(ROUTES.ONBOARDING);
    return null;
  }

  return (
    <div className="min-h-screen bg-[var(--color-surface-subtle)] py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/20 mb-6">
            <LayoutDashboard className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Welcome to Validiant <Sparkles className="inline-block w-6 h-6 text-amber-400 -mt-1 ml-1" />
          </h1>
          <p className="mt-3 text-slate-500 text-lg">
            Select a workspace to continue your operations
          </p>
        </div>

        {/* Workspace Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {organizations.map((org) => (
            <div 
              key={org.id}
              className="group bg-white border border-slate-200 rounded-3xl p-6 shadow-sm hover:shadow-xl hover:border-blue-200 transition-all duration-300 transform hover:-translate-y-1 cursor-pointer"
              onClick={() => handleSelectOrg(org.id, org.slug)}
            >
              <div className="flex items-start justify-between mb-8">
                <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center border border-slate-100 group-hover:bg-blue-50 group-hover:border-blue-100 transition-colors">
                  <Building2 className="w-6 h-6 text-slate-400 group-hover:text-blue-500 transition-colors" />
                </div>
                <div className="px-3 py-1 rounded-full bg-slate-50 border border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-500 group-hover:bg-blue-100 group-hover:text-blue-700 transition-colors">
                  {org.industry || 'General'}
                </div>
              </div>
              
              <div className="space-y-1">
                <h3 className="text-xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                  {org.name}
                </h3>
                <p className="text-sm text-slate-500 flex items-center gap-1.5">
                  validiant.in/{org.slug}
                </p>
              </div>

              <div className="mt-8 pt-6 border-t border-slate-50 flex items-center justify-between">
                <span className="text-sm font-semibold text-blue-600">
                  Go to workspace
                </span>
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 transition-all">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </div>
          ))}

          {/* Create New Org Card */}
          <button 
            onClick={() => router.push(ROUTES.ONBOARDING)}
            className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-slate-200 rounded-3xl hover:border-blue-400 hover:bg-blue-50/30 transition-all group"
          >
            <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center mb-4 group-hover:bg-blue-100 transition-colors">
              <Plus className="w-6 h-6 text-slate-400 group-hover:text-blue-600" />
            </div>
            <span className="text-sm font-bold text-slate-500 group-hover:text-blue-600 transition-colors">
              Create New Organization
            </span>
          </button>
        </div>

        {/* Footer */}
        <div className="text-center">
          <p className="text-xs text-slate-400 uppercase tracking-widest font-bold">
            Validiant Enterprise v2.4.1
          </p>
        </div>
      </div>
    </div>
  );
}
