'use client';

import React from 'react';
import { Building2, Search, Plus, ArrowRight, Shield } from 'lucide-react';
import { useOrganizations } from '@/hooks/useOrganizations';
import { useRouter } from 'next/navigation';
import { useWorkspaceStore } from '@/store/workspace';
import { ROUTES } from '@/lib/config';

export default function GlobalOrganizationsPage() {
  const router = useRouter();
  const { data: organizations = [], isLoading } = useOrganizations();
  const setActiveOrg = useWorkspaceStore((s) => s.setActiveOrg);

  const handleSelectOrg = (orgId: string, slug: string) => {
    setActiveOrg(orgId, slug);
    router.push(ROUTES.DASHBOARD(slug));
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-6"></div>
        <h2 className="text-xl font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest">
          Synchronizing Hub...
        </h2>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-[var(--color-text-base)] tracking-tight">
            Workspace Hub
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">
            Global management of your authorized enterprise environments
          </p>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search workspaces..."
              className="pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none transition-all w-64"
            />
          </div>
          <button
            onClick={() => router.push(ROUTES.ONBOARDING)}
            className="px-6 py-2.5 bg-blue-600 text-[var(--color-text-base)] rounded-xl text-sm font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 active:scale-95 flex items-center gap-2 group"
          >
            <Plus className="w-4 h-4 transition-transform group-hover:rotate-90" />
            New Org
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-20">
        {organizations.map((org) => {
          // DEFENSIVE IDENTIFIER EXTRACTION
          const orgId = org?.id || '';
          const identifier = orgId
            ? orgId.split('-')[0]?.toUpperCase()
            : 'UNKNOWN';

          return (
            <div
              key={org.id}
              className="group relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-8 shadow-sm hover:shadow-2xl hover:border-blue-200 dark:hover:border-blue-900/30 transition-all duration-500 transform hover:-translate-y-1 cursor-pointer flex flex-col justify-between min-h-[350px]"
              onClick={() => handleSelectOrg(org.id, org.slug)}
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/5 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-blue-600/10 transition-colors" />

              <div>
                <div className="flex items-start justify-between mb-8">
                  <div className="w-16 h-16 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center border border-slate-100 dark:border-slate-700 group-hover:bg-blue-50 dark:group-hover:bg-blue-950 transition-all duration-300 shadow-sm">
                    {org.logoUrl ? (
                      <img
                        src={org.logoUrl}
                        alt={org.name}
                        className="w-10 h-10 rounded-xl object-contain grayscale group-hover:grayscale-0 transition-all"
                      />
                    ) : (
                      <Building2 className="w-8 h-8 text-slate-400 group-hover:text-blue-500 transition-colors" />
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5">
                      <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                      Operational
                    </div>
                    <div className="px-3 py-1 rounded-full bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 text-[9px] font-black uppercase tracking-widest text-slate-400 group-hover:text-blue-600 transition-colors">
                      {org.industry || 'Corporate'}
                    </div>
                  </div>
                </div>

                <h3 className="text-xl font-black text-slate-900 dark:text-[var(--color-text-base)] group-hover:text-blue-600 transition-colors truncate tracking-tighter">
                  {org.name}
                </h3>
                <p className="text-[11px] text-slate-400 font-bold uppercase tracking-[0.1em] mt-1 opacity-70">
                  Identifier: {identifier}
                </p>

                <div className="grid grid-cols-2 gap-4 mt-8">
                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 transition-all group-hover:border-blue-100 dark:group-hover:border-blue-900/40">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                      Projects
                    </p>
                    <p className="text-lg font-black text-slate-800 dark:text-[var(--color-text-base)]">
                      {org.projectCount || 0}
                    </p>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 transition-all group-hover:border-indigo-100 dark:group-hover:border-indigo-900/40">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                      Members
                    </p>
                    <p className="text-lg font-black text-slate-800 dark:text-[var(--color-text-base)]">
                      {org.memberCount || 0}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-5 border-t border-slate-50 dark:border-slate-800/50 flex items-center justify-between">
                <div className="flex items-center gap-4 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                  <span className="flex items-center gap-1.5 px-2 py-1 bg-slate-50 dark:bg-slate-950 rounded-lg">
                    <Shield className="w-3.5 h-3.5 text-blue-500" /> Owner Scope
                  </span>
                </div>
                <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-black text-[10px] uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                  Enter Vault <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </div>
          );
        })}

        <button
          onClick={() => router.push(ROUTES.ONBOARDING)}
          className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[2.5rem] hover:border-blue-400 dark:hover:border-blue-800 hover:bg-blue-50/20 dark:hover:bg-blue-900/10 transition-all group min-h-[350px]"
        >
          <div className="w-16 h-16 rounded-full bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 flex items-center justify-center mb-6 group-hover:bg-blue-100 dark:group-hover:bg-blue-950 transition-all shadow-sm">
            <Plus className="w-8 h-8 text-slate-400 group-hover:text-blue-600" />
          </div>
          <h4 className="text-lg font-black text-slate-400 group-hover:text-blue-600 transition-colors tracking-tight">
            Create Workspace
          </h4>
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-1">
            Initialize New Org Layer
          </span>
        </button>
      </div>
    </div>
  );
}
