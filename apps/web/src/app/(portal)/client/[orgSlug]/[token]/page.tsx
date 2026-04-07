'use client';

import { usePortalContext, usePortalRecords } from '@/hooks/usePortalRecords';
import {
  ShieldCheck,
  Database,
  Fingerprint,
  MapPin,
  Calendar,
  ExternalLink,
  QrCode,
  LayoutGrid,
  ChevronRight,
  TrendingUp,
  Clock,
} from 'lucide-react';
import { useState, useMemo } from 'react';

/**
 * Client Portal - Read-only project universe lookup.
 * Optimized for high-trust verification and data transparency.
 */
export default function ClientPortal({
  params,
}: {
  params: { orgSlug: string; token: string };
}) {
  const { orgSlug, token } = params;

  // 1. Fetch Portal Context (Account + Project Access)
  const { data: context, isLoading: isContextLoading } =
    usePortalContext(token);

  // 2. Select Active Project (Default to first one)
  const [activeProjectKey, setActiveProjectKey] = useState<string | null>(null);

  const projects = useMemo(() => {
    return (
      (context?.account?.projectAccess as {
        projectId: string;
        projectKey: string;
      }[]) || []
    );
  }, [context]);

  // Handle initial project selection
  useMemo(() => {
    if (projects.length > 0 && !activeProjectKey) {
      const firstProject = projects[0];
      if (firstProject) {
        setActiveProjectKey(firstProject.projectKey || firstProject.projectId);
      }
    }
  }, [projects, activeProjectKey]);

  // 3. Fetch Records for selected project
  const {
    records,
    project,
    isLoading: isRecordsLoading,
  } = usePortalRecords(activeProjectKey || '', token);

  const isLoading = isContextLoading || isRecordsLoading;

  if (isLoading && !context) {
    return (
      <div className="flex flex-1 items-center justify-center bg-slate-950">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-800 border-t-primary-500" />
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
            Synchronizing Pulse...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-1 flex-col gap-10 bg-slate-950 px-8 pt-16 duration-1000 animate-in fade-in slide-in-from-bottom-8">
      <header className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-800 bg-[var(--color-surface-base)] shadow-2xl">
            <QrCode className="h-6 w-6 text-primary-500" />
          </div>
          <div className="flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
            <span className="text-[9px] font-black uppercase tracking-widest text-emerald-500">
              {context?.account?.type === 'client_viewer'
                ? 'Client Verified'
                : 'Agent Node'}
            </span>
          </div>
        </div>
        <div className="space-y-1">
          <h1 className="font-manrope text-3xl font-black tracking-tight text-white">
            Verification Universe
          </h1>
          <p className="px-1 text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
            Precision Reporting for{' '}
            <span className="text-primary-500">@{orgSlug}</span>
          </p>
        </div>
      </header>

      {/* Global Status Nucleus */}
      <div className="group relative space-y-6 overflow-hidden rounded-[3rem] border border-slate-800 bg-slate-900/40 p-8 shadow-2xl shadow-primary-500/5 backdrop-blur-3xl">
        <div className="absolute right-0 top-0 p-8 opacity-20 duration-700 transition-transform group-hover:scale-110">
          <TrendingUp className="h-20 w-20 text-primary-500" />
        </div>

        <div className="relative z-10 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-600">
              Active Records
            </p>
            <p className="text-2xl font-black text-white">
              {records?.length || 0}
            </p>
          </div>
          <div
            className={`flex h-14 w-14 items-center justify-center rounded-full border-4 border-slate-800/50 border-t-primary-500 ${isRecordsLoading ? 'animate-spin' : ''}`}
          >
            <Database className="h-5 w-5 animate-pulse text-primary-500" />
          </div>
        </div>
        <div className="h-px bg-slate-800/50" />
        <div className="relative z-10 grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-600">
              Project Cluster
            </p>
            <p className="text-[11px] font-bold text-slate-400">
              {project?.name || 'Loading...'}
            </p>
          </div>
          <div className="space-y-1 text-right">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-600">
              Access Identity
            </p>
            <p className="text-[11px] font-bold text-primary-500">
              {context?.account?.name}
            </p>
          </div>
        </div>
      </div>

      {/* Records Feed */}
      <div className="flex-1 space-y-6">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-600">
            Verification Stream
          </h3>
          <div className="flex items-center gap-2">
            <Clock className="h-3 w-3 text-slate-700" />
            <span className="text-[9px] font-bold uppercase tracking-widest text-slate-700">
              Live Updates
            </span>
          </div>
        </div>

        {isRecordsLoading ? (
          <div className="animate-pulse space-y-4">
            <div className="h-28 rounded-[2.5rem] bg-slate-900/50" />
            <div className="h-28 rounded-[2.5rem] bg-slate-900/50" />
            <div className="h-28 rounded-[2.5rem] bg-slate-900/50" />
          </div>
        ) : (
          <div className="scroller-hidden flex max-h-[500px] flex-col gap-4 overflow-y-auto pb-10">
            {records?.map((record) => (
              <div
                key={record.id}
                className="group cursor-pointer rounded-[2.5rem] border border-slate-800 bg-slate-900/40 p-6 transition-all duration-500 hover:border-slate-700 hover:bg-slate-900"
              >
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-700/50 bg-slate-800/50 transition-colors group-hover:border-primary-500/20 group-hover:bg-primary-500/10">
                      <Fingerprint className="h-5 w-5 text-slate-500 transition-colors group-hover:text-primary-500" />
                    </div>
                    <div className="space-y-0.5">
                      <p className="font-mono text-[11px] font-black uppercase tracking-tighter text-white">
                        #{record.number}
                      </p>
                      <p className="text-[9px] font-bold uppercase tracking-widest text-slate-600">
                        Immutable Node
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="rounded-full border border-slate-700 bg-slate-800 px-3 py-1 text-[8px] font-black uppercase tracking-widest text-slate-400">
                      {record.status}
                    </span>
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800/50 opacity-0 transition-opacity group-hover:opacity-100">
                      <ChevronRight className="h-4 w-4 text-primary-500" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-tighter text-slate-500">
                    <Calendar className="h-3.5 w-3.5 opacity-50" />
                    {new Date(record.createdAt!).toLocaleDateString()}
                  </div>
                  <div className="flex items-center justify-end gap-1.5 text-[10px] font-bold uppercase tracking-tighter text-slate-500">
                    <MapPin className="h-3.5 w-3.5 text-emerald-500 opacity-50" />
                    Location Logged
                  </div>
                </div>
              </div>
            ))}

            {!records?.length && (
              <div className="flex flex-col items-center justify-center rounded-[3rem] border border-dashed border-slate-800 bg-slate-900/20 py-20 gap-4">
                <LayoutGrid className="h-12 w-12 text-slate-800" />
                <div className="text-center">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-600">
                    Universe is Empty
                  </p>
                  <p className="mt-1 text-[9px] font-bold uppercase text-slate-700">
                    Pending synchronization from master node
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="fixed bottom-8 left-8 right-8 z-50">
        <button className="flex w-full items-center justify-center gap-3 rounded-[2.5rem] border border-primary-500/20 bg-primary-600 py-6 text-[11px] font-black uppercase tracking-widest text-white shadow-2xl shadow-primary-600/30 backdrop-blur-md transition-all hover:bg-primary-700 active:scale-[0.98]">
          <ExternalLink className="h-4 w-4" />
          Download Verifier Protocol (.XLSX)
        </button>
      </div>
    </div>
  );
}
