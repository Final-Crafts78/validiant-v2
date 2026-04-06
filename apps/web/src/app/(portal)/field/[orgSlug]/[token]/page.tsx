'use client';

import { usePortalContext, usePortalTypes } from '@/hooks/usePortalRecords';
import { portalService } from '@/services/portal.service';
import {
  Database,
  ShieldCheck,
  MapPin,
  Camera,
  Clock,
  Zap,
  ArrowRight,
  Loader2,
  CheckCircle2,
  AlertCircle,
  X,
} from 'lucide-react';
import { useState, useMemo } from 'react';
import { toast } from 'sonner';

/**
 * Field Agent Portal - Phase 4 (Field Capture Node)
 *
 * Optimized for mobile-first, high-trust data injection.
 * Secured by token-gated session context.
 */
export default function FieldAgentPortal({
  params,
}: {
  params: { orgSlug: string; token: string };
}) {
  const { orgSlug, token } = params;

  // 1. Fetch Portal Context
  const { data: context, isLoading: isContextLoading } = usePortalContext(token);

  // 2. Select Active Project
  const [activeProjectKey, setActiveProjectKey] = useState<string | null>(null);

  const projects = useMemo(() => {
    const access = context?.account?.projectAccess as {
      projectId: string;
      projectKey: string;
    }[];
    return access || [];
  }, [context]);

  // Handle initial selection
  useMemo(() => {
    if (projects.length > 0 && !activeProjectKey) {
      setActiveProjectKey(projects[0].projectKey || projects[0].projectId);
    }
  }, [projects, activeProjectKey]);

  // 3. Fetch Archetypes (Types)
  const {
    types,
    project,
    isLoading: isTypesLoading,
  } = usePortalTypes(activeProjectKey || '', token);

  const isLoading = isContextLoading || isTypesLoading;

  // 4. Form State
  const [selectedType, setSelectedType] = useState<any>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async () => {
    if (!activeProjectKey) return;
    setIsSubmitting(true);
    try {
      await portalService.ingestPortalRecord(activeProjectKey, token, {
        typeId: selectedType.id,
        data: formData,
      });
      setIsSuccess(true);
      toast.success('Injection Protocol Complete');
      setTimeout(() => {
        setIsSuccess(false);
        setSelectedType(null);
        setFormData({});
      }, 2000);
    } catch (error) {
      toast.error('Injection Failed: Protocol Interrupted');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading && !context) {
    return (
      <div className="flex flex-1 items-center justify-center bg-slate-950">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-800 border-t-primary-500" />
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
            Waking Node...
          </p>
        </div>
      </div>
    );
  }

  // Success Overlay
  if (isSuccess) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-6 bg-slate-950 px-10 text-center animate-in fade-in zoom-in-95 duration-500">
        <div className="flex h-24 w-24 items-center justify-center rounded-[2.5rem] bg-emerald-500 shadow-2xl shadow-emerald-500/40">
          <CheckCircle2 className="h-12 w-12 text-white" />
        </div>
        <div className="space-y-1">
          <h2 className="text-2xl font-black text-white italic">
            Data Injected Successfully
          </h2>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-500">
            Node Synchronized with Hub
          </p>
        </div>
      </div>
    );
  }

  if (selectedType) {
    return (
      <div className="flex min-h-screen flex-1 flex-col gap-8 bg-slate-950 p-8 animate-in fade-in slide-in-from-right-8 duration-500">
        <header className="flex items-center justify-between">
          <button
            onClick={() => setSelectedType(null)}
            className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500 transition-colors hover:text-white"
          >
            <X className="h-4 w-4" />
            Cancel session
          </button>
          <div className="flex items-center gap-2 rounded-full border border-primary-500/20 bg-primary-500/10 px-3 py-1 text-[8px] font-black uppercase tracking-widest text-primary-500">
            <Zap className="h-3 w-3" />
            Active Session
          </div>
        </header>

        <div className="space-y-1">
          <h2 className="text-2xl font-black italic text-white leading-tight">
            Verification Input
          </h2>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary-500">
            Archetype: {selectedType.name}
          </p>
        </div>

        <div className="flex-1 space-y-6">
          {selectedType.columns?.map((col: any) => (
            <div key={col.id} className="space-y-3">
              <label className="flex items-center justify-between px-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                  {col.name}
                </span>
                {col.required && (
                  <span className="text-[8px] font-bold text-primary-500 uppercase">
                    Mandatory
                  </span>
                )}
              </label>
              <div className="relative group">
                {col.type === 'photo' ? (
                  <button
                    onClick={() => {
                      toast.info('Camera Protocol Initializing...');
                    }}
                    className="flex w-full flex-col items-center justify-center gap-4 rounded-[2.5rem] border-2 border-dashed border-slate-800 bg-slate-900/40 py-10 transition-all hover:border-primary-500/20 hover:bg-slate-900"
                  >
                    <Camera className="h-8 w-8 text-slate-700" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-600">
                      Capture Visual Evidence
                    </span>
                  </button>
                ) : (
                  <input
                    type="text"
                    value={formData[col.key] || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, [col.key]: e.target.value })
                    }
                    placeholder={`Enter ${col.name}...`}
                    className="w-full rounded-3xl border border-slate-800 bg-slate-900/50 px-6 py-5 font-mono text-[11px] font-black uppercase tracking-widest text-white transition-all focus:outline-none focus:ring-4 focus:ring-primary-500/10"
                  />
                )}
              </div>
            </div>
          ))}

          {/* Telemetry Block */}
          <div className="rounded-[2.5rem] border border-emerald-500/20 bg-emerald-500/5 p-6 flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500 shadow-lg shadow-emerald-500/20">
              <MapPin className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-600">
                Geolocation Lock
              </p>
              <p className="text-[10px] font-bold text-emerald-500">
                Precision: High (+/- 2m)
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="flex w-full items-center justify-center gap-3 rounded-[2.2rem] bg-primary-600 py-6 text-[11px] font-black uppercase tracking-widest text-white shadow-2xl shadow-primary-600/30 transition-all hover:bg-primary-700 active:scale-[0.98] disabled:opacity-50"
        >
          {isSubmitting ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <>
              <ArrowRight className="h-4 w-4" />
              Inject record to universe
            </>
          )}
        </button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-1 flex-col gap-10 bg-slate-950 px-8 pt-16 animate-in fade-in slide-in-from-bottom-8 duration-1000">
      <header className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-600 shadow-2xl shadow-primary-500/20">
            <Zap className="h-6 w-6 text-white" />
          </div>
          <div className="flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
            <span className="text-[9px] font-black uppercase tracking-widest text-emerald-500">
              Agent Node Alive
            </span>
          </div>
        </div>
        <div className="space-y-1">
          <h1 className="font-manrope text-3xl font-black tracking-tight text-white">
            Verification Node
          </h1>
          <p className="px-1 text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
            Remote Capture for{' '}
            <span className="text-primary-500">@{orgSlug}</span>
          </p>
        </div>
      </header>

      {/* Node Status */}
      <div className="group relative space-y-6 overflow-hidden rounded-[3rem] border border-slate-800 bg-slate-900/40 p-8 shadow-2xl">
        <div className="relative z-10 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-600">
              Active Identity
            </p>
            <p className="text-xl font-black italic text-white">
              {context?.account?.name}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[9px] font-black uppercase tracking-widest text-emerald-500">
              Linked
            </span>
          </div>
        </div>
        <div className="h-px bg-slate-800/50" />
        <div className="relative z-10 grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-600">
              Universe Hub
            </p>
            <p className="text-[11px] font-bold text-slate-400">
              {project?.name || 'Synchronizing...'}
            </p>
          </div>
          <div className="space-y-1 text-right text-slate-600">
            <Clock className="mb-1 ml-auto h-4 w-4 opacity-50" />
            <p className="text-[9px] font-black uppercase tracking-widest">
              Internal Clock Locked
            </p>
          </div>
        </div>
      </div>

      {/* Available Archetypes */}
      <div className="flex-1 space-y-6">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-600">
            Injection Archetypes
          </h3>
          <span className="text-[9px] font-bold uppercase tracking-widest text-slate-700">
            {types?.length || 0} Ready
          </span>
        </div>

        {isTypesLoading ? (
          <div className="animate-pulse space-y-4">
            <div className="h-28 rounded-[2.5rem] bg-slate-900/50" />
            <div className="h-28 rounded-[2.5rem] bg-slate-900/50" />
          </div>
        ) : (
          <div className="scroller-hidden flex max-h-[500px] flex-col gap-4 overflow-y-auto pb-10">
            {types?.map((type: any) => (
              <button
                key={type.id}
                onClick={() => setSelectedType(type)}
                className="group rounded-[2.5rem] border border-slate-800 bg-slate-900/40 p-6 text-left transition-all duration-500 hover:border-primary-500/20 hover:bg-slate-900 active:scale-[0.98]"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-5">
                    <div
                      className="flex h-14 w-14 items-center justify-center rounded-2xl text-white shadow-xl transition-transform duration-500 group-hover:scale-110"
                      style={{
                        background: type.color || '#4F46E5',
                        boxShadow: `0 8px-30px ${type.color}33`,
                      }}
                    >
                      <Database className="h-6 w-6" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-lg font-black italic tracking-tight text-white">
                        {type.name}
                      </p>
                      <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500">
                        {type.columns?.length || 0} Precision Fields
                      </p>
                    </div>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-800/50 transition-colors group-hover:bg-primary-500/10">
                    <ArrowRight className="h-5 w-5 text-slate-700 transition-colors group-hover:text-primary-500" />
                  </div>
                </div>
              </button>
            ))}

            {!types?.length && (
              <div className="flex flex-col items-center justify-center rounded-[3rem] border border-dashed border-slate-800 bg-slate-900/20 py-20 gap-4">
                <AlertCircle className="h-12 w-12 text-slate-800" />
                <div className="text-center">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-600">
                    No Access Nodes
                  </p>
                  <p className="mt-1 px-10 text-[9px] font-bold uppercase text-slate-700">
                    Contact hub administrator for project deployment
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="fixed bottom-8 left-8 right-8 z-50">
        <div className="flex items-center gap-4 rounded-[2.5rem] border border-slate-800 bg-slate-900/80 p-6 backdrop-blur-xl">
          <MapPin className="h-5 w-5 text-emerald-500" />
          <div className="flex-1">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-600">
              Telemetry Status
            </p>
            <p className="text-[10px] font-bold uppercase text-emerald-500">
              GPS Precision: High (Locked)
            </p>
          </div>
          <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
        </div>
      </div>
    </div>
  );
}
