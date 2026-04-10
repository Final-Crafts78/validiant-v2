'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useProject, useUpdateProject } from '@/hooks/useProjects';
import { ProjectStatus } from '@validiant/shared';
import {
  Loader2,
  AlertCircle,
  Database,
  GitMerge,
  LineChart,
  Settings,
  Map as MapIcon,
  ShieldAlert,
  Fingerprint,
  ChevronRight,
  Globe,
  Zap,
  LayoutDashboard,
} from 'lucide-react';

import { ProjectDashboard } from '@/components/projects/ProjectDashboard';

// Precision Components (Phase 2 Architect)
import { RecordsTab } from './components/RecordsTab';
import { SchemaBuilderTab } from './components/SchemaBuilderTab';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

// Stubbed Sub-Components
import { DataExplorerTab } from './components/DataExplorerTab';
import { WorkflowBuilderTab } from './components/WorkflowBuilderTab';
import { AutomationsTab } from './components/AutomationsTab';
import { AnalyticsTab } from './components/AnalyticsTab';
import { SettingsTab } from './components/SettingsTab';
import { RoutingMapTab } from './components/RoutingMapTab';
import { ActivityLogTab } from './components/ActivityLogTab';

const STATUS_OPTIONS = [
  { value: ProjectStatus.PLANNING, label: 'Planning' },
  { value: ProjectStatus.ACTIVE, label: 'Active' },
  { value: ProjectStatus.ON_HOLD, label: 'On Hold' },
  { value: ProjectStatus.COMPLETED, label: 'Completed' },
  { value: ProjectStatus.ARCHIVED, label: 'Archived' },
  { value: ProjectStatus.CANCELLED, label: 'Cancelled' },
];

const TABS = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'records', label: 'Data Universe', icon: Fingerprint },
  { id: 'schema', label: 'Schema Architect', icon: Database },
  { id: 'workflow', label: 'Orchestration', icon: GitMerge },
  { id: 'map', label: 'Geospatial', icon: MapIcon },
  { id: 'automations', label: 'Neural Flows', icon: Zap },
  { id: 'analytics', label: 'Intelligence', icon: LineChart },
  { id: 'audit', label: 'Forensic Logs', icon: ShieldAlert },
  { id: 'settings', label: 'Protocol', icon: Settings },
];

export default function CommandCenterShell({
  params,
}: {
  params: { id: string; orgSlug: string };
}) {
  const { id, orgSlug } = params;
  const router = useRouter();

  const [activeTab, setActiveTab] = useState('overview');

  const { data: project, isLoading, isError } = useProject(id);
  const updateMutation = useUpdateProject(id);

  if (isLoading)
    return (
      <div className="flex h-screen items-center justify-center bg-[var(--surface-lowest)]">
        <div className="relative">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <div className="absolute inset-0 blur-xl bg-[#adc6ff]/20 animate-pulse" />
        </div>
      </div>
    );

  if (isError || !project)
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-[var(--surface-lowest)] gap-4">
        <AlertCircle className="h-12 w-12 text-rose-500" />
        <div className="text-center">
          <h2 className="text-xl font-black text-[var(--color-text-base)] uppercase tracking-widest">
            Connection_Lost
          </h2>
          <p className="text-xs text-[var(--text-muted)] font-mono mt-1">
            // TARGET_PROJECT_NOT_FOUND_IN_COORDINATES
          </p>
        </div>
        <button
          onClick={() => router.back()}
          className="mt-4 px-6 py-2 bg-[var(--color-surface-muted)]/50 border border-[var(--color-border-base)]/40 rounded-full text-[10px] font-black uppercase tracking-widest text-primary hover:bg-[#adc6ff]/10 transition-all"
        >
          Return to Hub
        </button>
      </div>
    );

  return (
    <div className="h-screen flex flex-col bg-[var(--surface-lowest)] font-manrope selection:bg-primary/30 selection:text-[var(--color-text-base)] overflow-hidden">
      {/* 
          OBSIDIAN HEADER 
          Editorial layout with glassmorphism and tonal layering.
      */}
      <header className="z-30 relative bg-[var(--color-surface-lowest)]/80 backdrop-blur-xl border-b border-[var(--color-border-base)]/10">
        <div className="px-10 pt-8 pb-4">
          {/* Breadcrumbs - High Detail */}
          <nav className="flex items-center gap-2 mb-6">
            <button
              onClick={() => router.push(`/${orgSlug}/projects`)}
              className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--color-text-muted)] hover:text-primary transition-all flex items-center gap-1.5"
            >
              <Globe className="w-3 h-3" />
              Universe
            </button>
            <ChevronRight className="w-3 h-3 text-[var(--color-text-base)]/10" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">
              {project.name.replace(/\s+/g, '_').toUpperCase()}
            </span>
          </nav>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-8">
              {/* Identity Nucleus */}
              <div className="relative group p-1">
                <div className="absolute -inset-1 bg-gradient-to-r from-[#adc6ff] to-transparent rounded-[1.75rem] blur opacity-0 group-hover:opacity-20 transition duration-500" />
                <div className="relative w-16 h-16 rounded-[1.5rem] bg-[var(--color-surface-container-low)] border border-[var(--color-border-base)]/20 flex items-center justify-center text-primary font-black text-2xl shadow-inner active:scale-95 transition-transform cursor-pointer">
                  {project.name.charAt(0)}
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center gap-4">
                  <h1 className="text-4xl font-black text-[var(--color-text-base)] tracking-tighter leading-none">
                    {project.name}
                  </h1>
                  <div
                    className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all ${
                      project.status === ProjectStatus.ACTIVE
                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.1)]'
                        : 'bg-primary/10 border-primary/20 text-primary'
                    }`}
                  >
                    {project.status}
                  </div>
                </div>
                <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--color-text-muted)]">
                  <span className="flex items-center gap-1.5 underline decoration-white/10 underline-offset-4">
                    COMMAND_NODE_PRECISION
                  </span>
                  <span className="opacity-20">/</span>
                  <span className="font-mono text-primary/50">
                    ID:{id.slice(0, 12).toUpperCase()}
                  </span>
                </div>
              </div>
            </div>

            {/* Contextual Actions */}
            <div className="flex items-center gap-4">
              <ThemeToggle />
              <div className="flex items-center gap-2 bg-[var(--color-surface-container-low)]/50 p-1.5 rounded-[1.25rem] border border-[var(--color-border-base)]/20 shadow-inner">
                <select
                  value={project.status}
                  onChange={(e) =>
                    updateMutation.mutate({
                      status: e.target.value as ProjectStatus,
                    })
                  }
                  className="bg-transparent text-[10px] font-black uppercase tracking-widest pl-4 pr-10 py-2.5 focus:outline-none cursor-pointer hover:bg-[var(--color-surface-muted)]/50 rounded-xl transition-all appearance-none"
                >
                  {STATUS_OPTIONS.map((o) => (
                    <option
                      key={o.value}
                      value={o.value}
                      className="bg-[var(--color-surface-lowest)] text-[var(--color-text-base)]"
                    >
                      {o.label.toUpperCase()}
                    </option>
                  ))}
                </select>
                <div className="w-px h-5 bg-[var(--color-surface-muted)]/50" />
                <button
                  onClick={() => setActiveTab('settings')}
                  className="p-2.5 text-[var(--color-text-muted)] hover:text-primary transition-all rounded-xl hover:bg-[var(--color-surface-muted)]/50"
                >
                  <Settings className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Obsidian Tabs - No-Line Design */}
        <div className="px-10 mt-6 overflow-x-auto scroller-hidden">
          <div className="flex items-center gap-1">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 px-6 py-4 rounded-t-2xl text-[10px] font-black uppercase tracking-widest transition-all duration-500 relative group overflow-hidden ${
                  activeTab === tab.id
                    ? 'bg-[var(--color-surface-container-low)] text-primary'
                    : 'text-[var(--color-text-muted)]/60 hover:text-[var(--color-text-base)] hover:bg-[var(--color-surface-muted)]/50'
                }`}
              >
                <tab.icon
                  className={`w-4 h-4 transition-all duration-700 ${
                    activeTab === tab.id
                      ? 'scale-110 shadow-[0_0_10px_currentColor]'
                      : 'group-hover:scale-110'
                  }`}
                />
                {tab.label}
                {activeTab === tab.id && (
                  <div className="absolute top-0 left-0 w-full h-0.5 bg-primary animate-in slide-in-from-left duration-700" />
                )}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* 
          MAIN VIEWPORT 
          Tonal fluid background with deep surface containers.
      */}
      <main className="flex-1 overflow-y-auto bg-[var(--color-surface-container-low)] z-10 relative">
        {/* Subtle Background Glows */}
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/5 blur-[150px] pointer-events-none rounded-full" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-indigo-500/5 blur-[120px] pointer-events-none rounded-full" />

        <div className="max-w-[1600px] mx-auto p-12 relative z-20 animate-in fade-in slide-in-from-bottom-8 duration-1000">
          {activeTab === 'overview' && <ProjectDashboard projectId={id} />}
          {activeTab === 'records' && <RecordsTab projectId={id} />}
          {activeTab === 'schema' && <SchemaBuilderTab projectId={id} />}
          {activeTab === 'workflow' && <WorkflowBuilderTab projectId={id} />}
          {activeTab === 'map' && <RoutingMapTab projectId={id} />}
          {activeTab === 'automations' && <AutomationsTab projectId={id} />}
          {activeTab === 'analytics' && <AnalyticsTab projectId={id} />}
          {activeTab === 'audit' && <ActivityLogTab projectId={id} />}
          {activeTab === 'settings' && <SettingsTab project={project} />}

          {/* Legacy Tab */}
          {activeTab === 'data' && <DataExplorerTab projectId={id} />}
        </div>
      </main>
    </div>
  );
}
