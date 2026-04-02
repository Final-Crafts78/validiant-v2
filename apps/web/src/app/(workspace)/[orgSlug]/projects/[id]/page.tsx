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
} from 'lucide-react';

// Stubbed Sub-Components (To be built in subsequent phases)
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
  { id: 'data', label: 'Data Explorer', icon: Database },
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

  const [activeTab, setActiveTab] = useState('data');

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
  const settings = project.settings as any;
  const themeColor = settings?.themeColor || '#4F46E5';

  return (
    <div className="h-screen flex flex-col bg-slate-50/50">
      {/* 1. Command Header (Sticky) */}
      <header className="sticky top-0 z-20 bg-white border-b border-slate-200">
        <div className="px-6 py-4">
          <button
            onClick={() => router.push(`/${orgSlug}/projects`)}
            className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-slate-800 transition-colors mb-4"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
          </button>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Optional Client Logo Injection */}
              {settings?.logoUrl ? (
                <img
                  src={settings.logoUrl}
                  alt="Client Logo"
                  className="w-10 h-10 rounded-lg border border-slate-100 object-contain bg-white"
                />
              ) : (
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold"
                  style={{ backgroundColor: themeColor }}
                >
                  {project.name.charAt(0)}
                </div>
              )}

              <div>
                <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
                  {project.name}
                  <span
                    className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                      STATUS_STYLES[project.status] ??
                      STATUS_STYLES[ProjectStatus.PLANNING]
                    }`}
                  >
                    {project.status}
                  </span>
                </h1>
                <p className="text-sm text-slate-500 font-medium">
                  Command Center
                </p>
              </div>
            </div>

            {/* Global Actions */}
            <div className="flex items-center gap-3">
              <select
                value={project.status}
                onChange={(e) =>
                  updateMutation.mutate({
                    status: e.target.value as ProjectStatus,
                  })
                }
                className="text-sm border shadow-sm border-slate-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {STATUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="px-6 border-t border-slate-100">
          <div className="flex space-x-8">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 flex items-center gap-2 text-sm font-semibold transition-all border-b-2 ${
                  activeTab === tab.id
                    ? 'border-indigo-600 text-indigo-700'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }`}
                style={
                  activeTab === tab.id
                    ? { borderColor: themeColor, color: themeColor }
                    : {}
                }
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* 2. Scrollable Body Area */}
      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-7xl mx-auto h-full space-y-6">
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
