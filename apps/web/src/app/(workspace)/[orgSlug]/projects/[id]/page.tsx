'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useProject, useUpdateProject } from '@/hooks/useProjects';
import { ProjectStatus } from '@validiant/shared';
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  Database,
  GitMerge,
  Puzzle,
  LineChart,
  Settings,
  Map as MapIcon,
  ShieldAlert,
  Fingerprint,
} from 'lucide-react';

// Precision Components (Phase 2 Architect)
import { RecordsTab } from './components/RecordsTab';
import { SchemaBuilderTab } from './components/SchemaBuilderTab';

// Stubbed Sub-Components
import { DataExplorerTab } from './components/DataExplorerTab';
import { WorkflowBuilderTab } from './components/WorkflowBuilderTab';
import { AutomationsTab } from './components/AutomationsTab';
import { AnalyticsTab } from './components/AnalyticsTab';
import { SettingsTab } from './components/SettingsTab';
import { RoutingMapTab } from './components/RoutingMapTab';
import { ActivityLogTab } from './components/ActivityLogTab';

const STATUS_STYLES: Record<string, string> = {
  [ProjectStatus.ACTIVE]: 'bg-emerald-50 text-emerald-700',
  [ProjectStatus.PLANNING]: 'bg-blue-50 text-blue-700',
  [ProjectStatus.ON_HOLD]: 'bg-amber-50 text-amber-700',
  [ProjectStatus.COMPLETED]: 'bg-slate-100 text-slate-600',
  [ProjectStatus.ARCHIVED]: 'bg-slate-100 text-slate-400',
  [ProjectStatus.CANCELLED]: 'bg-red-50 text-red-600',
};

const STATUS_OPTIONS = [
  { value: ProjectStatus.PLANNING, label: 'Planning' },
  { value: ProjectStatus.ACTIVE, label: 'Active' },
  { value: ProjectStatus.ON_HOLD, label: 'On Hold' },
  { value: ProjectStatus.COMPLETED, label: 'Completed' },
  { value: ProjectStatus.ARCHIVED, label: 'Archived' },
  { value: ProjectStatus.CANCELLED, label: 'Cancelled' },
];

const TABS = [
  { id: 'records', label: 'Records', icon: Fingerprint },
  { id: 'schema', label: 'Schema Architect', icon: Database },
  { id: 'data', label: 'Data Explorer (Legacy)', icon: Database },
  { id: 'map', label: 'Live Map', icon: MapIcon },
  { id: 'workflow', label: 'Workflow Builder', icon: GitMerge },
  { id: 'automations', label: 'Automations', icon: Puzzle },
  { id: 'analytics', label: 'Analytics', icon: LineChart },
  { id: 'audit', label: 'Audit Log', icon: ShieldAlert },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export default function CommandCenterShell({
  params,
}: {
  params: { id: string; orgSlug: string };
}) {
  const { id, orgSlug } = params;
  const router = useRouter();

  const [activeTab, setActiveTab] = useState('records');

  const { data: project, isLoading, isError } = useProject(id);
  const updateMutation = useUpdateProject(id);

  if (isLoading)
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );

  if (isError || !project)
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-3">
        <AlertCircle className="h-8 w-8 text-red-500" />
        <p className="text-sm text-slate-500">Project not found.</p>
        <button
          onClick={() => router.back()}
          className="text-sm text-blue-600 underline"
        >
          Go back
        </button>
      </div>
    );

  // Dynamic Theme (Phase 13.5 Customization)
  const settings = project.settings as Record<string, unknown> | null;
  const themeColor = (settings?.themeColor as string) || '#4F46E5';

  return (
    <div className="h-screen flex flex-col bg-[var(--color-surface-base)] font-manrope selection:bg-primary-500/30 selection:text-primary-900">
      {/* Precision Header - Obsidian Layering */}
      <header className="z-20 bg-[var(--color-surface-base)]">
        <div className="px-8 pt-6 pb-2">
          <button
            onClick={() => router.push(`/${orgSlug}/projects`)}
            className="group flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--color-text-muted)] hover:text-primary-600 transition-all mb-4"
          >
            <ArrowLeft className="w-3 h-3 group-hover:-translate-x-1 transition-transform" /> 
            Back to Universe
          </button>
 
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              {/* Identity Nucleus */}
              <div
                className="w-14 h-14 rounded-[1.25rem] flex items-center justify-center text-white font-black text-xl shadow-2xl shadow-indigo-500/20 active:scale-95 transition-transform cursor-pointer"
                style={{
                  background: `linear-gradient(135deg, ${themeColor}, ${themeColor}CC)`,
                }}
              >
                {project.name.charAt(0)}
              </div>
 
              <div className="space-y-1">
                <div className="flex items-center gap-4">
                  <h1 className="text-3xl font-black text-[var(--color-text-base)] tracking-tight">
                    {project.name}
                  </h1>
                  <span
                    className={`text-[8px] font-black uppercase tracking-[0.2em] px-3 py-1.5 rounded-full shadow-sm border border-transparent ${
                      STATUS_STYLES[project.status] ??
                      STATUS_STYLES[ProjectStatus.PLANNING]
                    }`}
                  >
                    {project.status}
                  </span>
                </div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--color-text-muted)]/50">
                  Precision Command Node{' '}
                  <span className="mx-2 opacity-20">/</span> ID:{' '}
                  {id.slice(0, 8).toUpperCase()}
                </p>
              </div>
            </div>
 
            {/* Global Actions - Surface Layering */}
            <div className="flex items-center gap-4 bg-[var(--color-surface-soft)] p-1.5 rounded-2xl border border-[var(--color-border-base)]/5">
              <select
                value={project.status}
                onChange={(e) =>
                  updateMutation.mutate({
                    status: e.target.value as ProjectStatus,
                  })
                }
                className="bg-transparent text-[10px] font-black uppercase tracking-widest px-4 py-2 focus:outline-none cursor-pointer hover:bg-[var(--color-surface-base)] rounded-xl transition-all"
              >
                {STATUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value} className="bg-[var(--color-surface-base)]">
                    {o.label}
                  </option>
                ))}
              </select>
              <div className="w-px h-4 bg-[var(--color-border-base)]/10" />
              <button className="p-2.5 text-[var(--color-text-muted)] hover:text-primary-600 transition-all rounded-xl hover:bg-[var(--color-surface-base)]">
                <Settings className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
 
        {/* Navigation Tabs - No-Line Design */}
        <div className="px-8 mt-4 overflow-x-auto scroller-hidden">
          <div className="flex items-center gap-2">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2.5 px-5 py-3.5 rounded-t-2xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 relative ${
                  activeTab === tab.id
                    ? 'bg-[var(--color-surface-soft)] text-primary-600'
                    : 'text-[var(--color-text-muted)]/60 hover:text-[var(--color-text-base)] hover:bg-[var(--color-surface-soft)]/50'
                }`}
              >
                <tab.icon
                  className={`w-3.5 h-3.5 transition-transform duration-500 ${
                    activeTab === tab.id ? 'scale-110' : ''
                  }`}
                />
                {tab.label}
                {activeTab === tab.id && (
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-primary-500 rounded-full shadow-lg shadow-primary-500/40" />
                )}
              </button>
            ))}
          </div>
        </div>
      </header>
 
      {/* Main Grid - Tonal Fluidity */}
      <main className="flex-1 overflow-y-auto bg-[var(--color-surface-soft)] rounded-tl-[3.5rem] mt-[-1px] z-10 border-t border-[var(--color-border-base)]/5">
        <div className="max-w-7xl mx-auto p-10 animate-in fade-in slide-in-from-bottom-6 duration-1000">
          {activeTab === 'records' && <RecordsTab projectId={project.id} />}
          {activeTab === 'schema' && <SchemaBuilderTab projectId={project.id} />}
          {activeTab === 'data' && <DataExplorerTab projectId={project.id} />}
          {activeTab === 'map' && <RoutingMapTab projectId={project.id} />}
          {activeTab === 'workflow' && (
            <WorkflowBuilderTab projectId={project.id} />
          )}
          {activeTab === 'automations' && (
            <AutomationsTab projectId={project.id} />
          )}
          {activeTab === 'analytics' && <AnalyticsTab projectId={project.id} />}
          {activeTab === 'audit' && <ActivityLogTab projectId={project.id} />}
          {activeTab === 'settings' && <SettingsTab project={project} />}
        </div>
      </main>
    </div>
  );
}
