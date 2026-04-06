'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useProjects, useCreateProject } from '@/hooks/useProjects';
import { useWorkspaceStore } from '@/store/workspace';
import { ProjectStatus, ProjectPriority } from '@validiant/shared';
import {
  FolderOpen,
  Plus,
  Loader2,
  AlertCircle,
  Calendar,
  LayoutGrid,
  Search,
} from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';
import { ProjectsToolbar } from './ProjectsToolbar';
import { useSearchParams } from 'next/navigation';

// ── Status badge ──────────────────────────────────────────────────────────────
const STATUS_STYLES: Record<string, string> = {
  [ProjectStatus.ACTIVE]:
    'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
  [ProjectStatus.PLANNING]:
    'bg-primary-500/10 text-primary-600 dark:text-primary-400 border-primary-500/20',
  [ProjectStatus.ON_HOLD]:
    'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
  [ProjectStatus.COMPLETED]:
    'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700',
  [ProjectStatus.ARCHIVED]:
    'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-700',
  [ProjectStatus.CANCELLED]:
    'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
};

const STATUS_LABELS: Record<string, string> = {
  [ProjectStatus.ACTIVE]: 'Active',
  [ProjectStatus.PLANNING]: 'Planning',
  [ProjectStatus.ON_HOLD]: 'On Hold',
  [ProjectStatus.COMPLETED]: 'Completed',
  [ProjectStatus.ARCHIVED]: 'Archived',
  [ProjectStatus.CANCELLED]: 'Cancelled',
};
// ── Priority badge ────────────────────────────────────────────────────────────
const PRIORITY_STYLES: Record<string, string> = {
  [ProjectPriority.LOW]:
    'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400',
  [ProjectPriority.MEDIUM]:
    'bg-primary-500/10 text-primary-600 dark:text-primary-400',
  [ProjectPriority.HIGH]: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  [ProjectPriority.URGENT]:
    'bg-rose-500/10 text-rose-600 dark:text-rose-400',
};

// ── Create modal ──────────────────────────────────────────────────────────────
function CreateProjectModal({ onClose }: { onClose: (id?: string) => void }) {
  const createMutation = useCreateProject();
  const { setActiveProject } = useWorkspaceStore();

  const [name, setName] = useState('');
  const [description, setDesc] = useState('');
  const [priority, setPriority] = useState<ProjectPriority>(
    ProjectPriority.MEDIUM
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      // 🚩 CRITICAL FIX: Backend requires a 'key' field for project creation
      // We generate a short uppercase key from the name + random digits (e.g. "PRJ123")
      const projectKey =
        name
          .substring(0, 3)
          .toUpperCase()
          .replace(/[^A-Z]/g, 'X') + Math.floor(100 + Math.random() * 900);

      const project = await createMutation.mutateAsync({
        name,
        key: projectKey, // 👈 KEY ADDED
        description,
        priority,
      });
      setActiveProject(project.id);
      onClose(project.id);
    } catch (error) {
      console.error('Failed to create project:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="modal-surface w-full max-w-md p-8 space-y-6 shadow-2xl scale-in-center">
        <div>
          <h2 className="text-xl font-black text-[var(--color-text-base)] tracking-tight">
            New Project
          </h2>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">
            Start tracking your next workspace initiative
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-[10px] font-black text-[var(--color-text-muted)] uppercase tracking-widest pl-1">
              Project Name *
            </label>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Q4 Infrastructure Audit"
              className="input-themed w-full h-11"
              required
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-[10px] font-black text-[var(--color-text-muted)] uppercase tracking-widest pl-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDesc(e.target.value)}
              rows={3}
              placeholder="What is the objective of this project?"
              className="input-themed w-full resize-none py-3"
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-[10px] font-black text-[var(--color-text-muted)] uppercase tracking-widest pl-1">
              Priority Ranking
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as ProjectPriority)}
              className="input-themed w-full h-11"
            >
              <option value={ProjectPriority.LOW}>Low Intensity</option>
              <option value={ProjectPriority.MEDIUM}>Standard Priority</option>
              <option value={ProjectPriority.HIGH}>High Priority</option>
              <option value={ProjectPriority.URGENT}>
                Urgent Action Required
              </option>
            </select>
          </div>
          <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4">
            <button
              type="button"
              onClick={() => onClose()}
              className="flex-1 px-4 py-3 text-sm font-black text-[var(--color-text-subtle)] hover:bg-[var(--color-surface-muted)] rounded-xl transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending || !name.trim()}
              className="flex-1 btn-primary py-3 text-sm font-black disabled:opacity-50 shadow-lg shadow-primary-600/20 active:scale-95"
            >
              {createMutation.isPending ? 'Deploying…' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function ProjectsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { orgSlug } = useParams() as { orgSlug: string };
  const { setActiveProject } = useWorkspaceStore();
  const { data: projects = [], isLoading, isError } = useProjects();
  const [showCreate, setShowCreate] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Filtering logic
  const q = searchParams.get('q')?.toLowerCase() || '';
  const statusFilter = searchParams.get('status')?.split(',') || [];
  const priorityFilter = searchParams.get('priority')?.split(',') || [];

  const filteredProjects = projects.filter((p) => {
    const matchesSearch =
      !q ||
      p.name.toLowerCase().includes(q) ||
      p.description?.toLowerCase().includes(q);

    const matchesStatus =
      statusFilter.length === 0 || statusFilter.includes(p.status);

    const matchesPriority =
      priorityFilter.length === 0 || priorityFilter.includes(p.priority || '');

    return matchesSearch && matchesStatus && matchesPriority;
  });

  if (isLoading)
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="h-7 w-7 animate-spin text-[var(--color-accent-base)]" />
      </div>
    );

  if (isError)
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-3">
        <AlertCircle className="h-8 w-8 text-[var(--color-critical-base)]" />
        <p className="text-sm text-[var(--color-text-muted)]">
          Failed to load projects.
        </p>
      </div>
    );

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20 animate-in fade-in duration-700">
      {/* Header - Advanced Typography */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 pb-2">
        <div className="space-y-1">
          <h1 className="text-4xl font-black text-[var(--color-text-base)] tracking-tight font-manrope">
            Data Universe
          </h1>
          <p className="text-sm text-[var(--color-text-muted)] font-medium max-w-lg leading-relaxed">
            Curating precision records and operational initiatives for{' '}
            <span className="text-primary-500 font-bold">@{orgSlug}</span>.
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center justify-center gap-2 px-8 py-3.5 text-xs font-black uppercase tracking-widest bg-primary-600 text-white rounded-2xl shadow-2xl shadow-primary-600/20 hover:bg-primary-700 hover:scale-[1.02] active:scale-95 transition-all"
        >
          <Plus className="w-5 h-5" /> Initialize Project
        </button>
      </div>

      {/* Advanced Toolbar */}
      <ProjectsToolbar viewMode={viewMode} setViewMode={setViewMode} />

      {/* Empty state */}
      {projects.length === 0 && (
        <EmptyState
          icon={FolderOpen}
          title="No projects found"
          description="It looks like you haven't created any projects in this workspace yet. Start by creating one to track your team's progress."
          action={{
            label: 'Create First Project',
            onClick: () => setShowCreate(true),
          }}
        />
      )}

      {/* Grid View */}
      {viewMode === 'grid' && filteredProjects.length > 0 && (
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {filteredProjects.map((p) => (
            <button
              key={p.id}
              onClick={() => {
                setActiveProject(p.id);
                router.push(`/${orgSlug}/projects/${p.id}`);
              }}
              className="group relative flex flex-col bg-[var(--color-surface-soft)]/40 hover:bg-[var(--color-surface-soft)] rounded-[2.5rem] p-8 text-left transition-all duration-500 hover:-translate-y-1"
            >
              <div className="mb-6 flex justify-between items-start">
                <div className="w-14 h-14 rounded-2xl bg-[var(--color-surface-base)] flex items-center justify-center shadow-sm group-hover:shadow-md transition-all">
                  <LayoutGrid className="w-7 h-7 text-primary-500" />
                </div>
                <div className="flex items-center gap-3">
                  {(p as any).recordCount !== undefined && (
                    <span className="text-[10px] font-black bg-primary-500/10 text-primary-600 px-2.5 py-1 rounded-lg">
                      {(p as any).recordCount} Records
                    </span>
                  )}
                  <span
                    className={`text-[9px] font-black uppercase tracking-[0.15em] px-3 py-1.5 rounded-full border border-transparent shadow-sm ${
                      STATUS_STYLES[p.status] ??
                      STATUS_STYLES[ProjectStatus.PLANNING]
                    }`}
                  >
                    {STATUS_LABELS[p.status] ?? p.status}
                  </span>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-xl font-black text-[var(--color-text-base)] tracking-tight group-hover:text-primary-600 transition-colors mb-2 line-clamp-2 font-manrope">
                  {p.name}
                </h3>
                <p className="text-[11px] text-[var(--color-text-muted)] line-clamp-3 leading-relaxed font-medium">
                  {p.description || 'System-generated project environment for mission-critical data processing.'}
                </p>
              </div>

              <div className="mt-auto space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-3 px-1">
                    <span className="text-[9px] font-black uppercase tracking-widest text-[var(--color-text-muted)] opacity-50">
                      Sync Progress
                    </span>
                    <span className="text-xs font-black text-primary-600">
                      {p.progress ?? 0}%
                    </span>
                  </div>
                  <div className="h-1.5 bg-[var(--color-surface-base)] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary-500 rounded-full transition-all duration-1000 ease-out"
                      style={{ width: `${p.progress ?? 0}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span
                    className={`text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl ${
                      PRIORITY_STYLES[p.priority] ??
                      PRIORITY_STYLES[ProjectPriority.MEDIUM]
                    }`}
                  >
                    {p.priority}
                  </span>

                    <div className="flex items-center gap-4 text-[10px] font-bold text-[var(--color-text-muted)]/60 uppercase tracking-tighter">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        {p.endDate ? new Date(p.endDate).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        }) : '--'}
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
                        <span className="text-[8px] font-black opacity-40">API Active</span>
                      </div>
                    </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && filteredProjects.length > 0 && (
        <div className="flex flex-col gap-3 group/list animate-in fade-in slide-in-from-right-4 duration-500">
          <div className="flex items-center gap-6 px-4 mb-2">
            <div className="w-12" />
            <span className="flex-1 text-[9px] font-black uppercase tracking-[0.2em] text-[var(--color-text-muted)]/40">
              Identity
            </span>
            <span className="w-48 hidden md:block text-[9px] font-black uppercase tracking-[0.2em] text-[var(--color-text-muted)]/40">
              Status & Universe
            </span>
            <span className="w-32 hidden sm:block text-[9px] font-black uppercase tracking-[0.2em] text-[var(--color-text-muted)]/40">
              API Status
            </span>
            <span className="w-24 hidden lg:block text-right text-[9px] font-black uppercase tracking-[0.2em] text-[var(--color-text-muted)]/40">
              Timeline
            </span>
          </div>
          {filteredProjects.map((p) => (
            <button
              key={p.id}
              onClick={() => {
                setActiveProject(p.id);
                router.push(`/${orgSlug}/projects/${p.id}`);
              }}
              className="group flex items-center gap-6 p-4 bg-[var(--color-surface-soft)]/30 hover:bg-[var(--color-surface-soft)] transition-all rounded-3xl text-left border border-transparent hover:border-primary-500/10"
            >
              <div className="w-12 h-12 rounded-2xl bg-[var(--color-surface-base)] flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
                <FolderOpen className="w-6 h-6 text-primary-500" />
              </div>
              
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-black text-[var(--color-text-base)] truncate font-manrope">
                  {p.name}
                </h3>
                <p className="text-[10px] text-[var(--color-text-muted)] font-medium truncate opacity-60">
                  {p.description || 'Mission workspace'}
                </p>
              </div>

              <div className="hidden md:flex items-center gap-3 w-48">
                <span
                  className={`px-2.5 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${STATUS_STYLES[p.status]}`}
                >
                  {STATUS_LABELS[p.status]}
                </span>
                {(p as any).recordCount !== undefined && (
                  <span className="text-[9px] font-black text-primary-600 bg-primary-50 px-2 py-0.5 rounded-lg">
                    {(p as any).recordCount} Recs
                  </span>
                )}
              </div>

              <div className="w-32 hidden sm:flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-widest opacity-30">Active</span>
              </div>

              <div className="text-right hidden lg:block w-24 pr-2">
                <span className="text-[10px] font-bold text-[var(--color-text-muted)]">
                  {p.endDate
                    ? new Date(p.endDate).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })
                    : '--'}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* No Results from filters */}
      {projects.length > 0 && filteredProjects.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 bg-[var(--color-surface-soft)]/20 rounded-[3rem] border border-dashed border-[var(--color-border-base)]/10">
          <div className="w-16 h-16 rounded-full bg-[var(--color-surface-soft)] flex items-center justify-center mb-4">
            <Search className="w-8 h-8 text-[var(--color-text-muted)]/30" />
          </div>
          <h3 className="text-lg font-black text-[var(--color-text-base)] mb-1">
            No matching precision units
          </h3>
          <p className="text-sm text-[var(--color-text-muted)] font-medium">
            Try adjusting your filters to broaden the data scope.
          </p>
        </div>
      )}

      {showCreate && (
        <CreateProjectModal
          onClose={(newId) => {
            setShowCreate(false);
            if (newId) router.push(`/${orgSlug}/projects/${newId}`);
          }}
        />
      )}
    </div>
  );
}
