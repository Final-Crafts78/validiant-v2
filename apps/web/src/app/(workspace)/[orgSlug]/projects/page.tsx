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
} from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';

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
  const { orgSlug } = useParams() as { orgSlug: string };
  const { setActiveProject, activeOrgId } = useWorkspaceStore();
  const { data: projects = [], isLoading, isError } = useProjects();
  const [showCreate, setShowCreate] = useState(false);

  // 🔍 EXTREME VISIBILITY: Track project list state in the UI
  // eslint-disable-next-line no-console
  console.debug('[Page:Projects] State Update', {
    orgSlug,
    activeOrgId,
    projectCount: projects.length,
    isLoading,
    isError,
    timestamp: new Date().toISOString(),
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
    <div className="max-w-6xl mx-auto space-y-10 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-[var(--color-text-base)] tracking-tight">
            Projects
          </h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-1 font-medium">
            Manage and track your active initiatives across {orgSlug}
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center justify-center gap-2 px-6 py-3 text-sm font-black btn-primary rounded-xl shadow-lg shadow-primary-600/20 active:scale-95 transition-all"
        >
          <Plus className="w-5 h-5" /> New Project
        </button>
      </div>

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

      {/* Project cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {projects.map((p) => (
          <button
            key={p.id}
            onClick={() => {
              setActiveProject(p.id);
              router.push(`/${orgSlug}/projects/${p.id}`);
            }}
            className="group relative flex flex-col bg-glass border border-[var(--color-border-base)] rounded-3xl p-6 text-left hover-lift shadow-sm hover:border-primary-500/30 overflow-hidden"
          >
            {/* Background highlight */}
            <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="w-8 h-8 rounded-full bg-primary-500/10 flex items-center justify-center">
                <LayoutGrid className="w-4 h-4 text-primary-600" />
              </div>
            </div>

            {/* Top row: name + status */}
            <div className="mb-4 pr-8">
              <h3 className="text-lg font-black text-[var(--color-text-base)] leading-tight group-hover:text-primary-600 transition-colors mb-2 line-clamp-2">
                {p.name}
              </h3>
              <span
                className={`inline-flex shrink-0 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg border shadow-sm ${
                  STATUS_STYLES[p.status] ??
                  STATUS_STYLES[ProjectStatus.PLANNING]
                }`}
              >
                {STATUS_LABELS[p.status] ?? p.status}
              </span>
            </div>

            {/* Description */}
            {p.description ? (
              <p className="text-xs text-[var(--color-text-muted)] line-clamp-3 mb-6 leading-relaxed font-medium">
                {p.description}
              </p>
            ) : (
              <div className="flex-1 mb-6 italic text-[var(--color-text-muted)]/40 text-xs">
                No description provided for this initiative.
              </div>
            )}

            {/* Progress bar */}
            <div className="mt-auto pt-4 border-t border-[var(--color-border-base)]/30">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-muted)]/70">
                  Mission Progress
                </span>
                <span className="text-xs font-black text-primary-600">
                  {p.progress ?? 0}%
                </span>
              </div>
              <div className="h-2 bg-[var(--color-surface-soft)] rounded-full overflow-hidden shadow-inner">
                <div
                  className="h-full bg-gradient-to-r from-primary-500 to-primary-700 rounded-full transition-all duration-1000 ease-out shadow-[0_0_8px_rgba(37,99,235,0.4)]"
                  style={{ width: `${p.progress ?? 0}%` }}
                />
              </div>
            </div>

            {/* Footer meta */}
            <div className="flex items-center justify-between mt-4">
              <span
                className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md ${
                  PRIORITY_STYLES[p.priority] ??
                  PRIORITY_STYLES[ProjectPriority.MEDIUM]
                }`}
              >
                {p.priority}
              </span>

              {p.endDate && (
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-tight">
                  <Calendar className="w-3.5 h-3.5" />
                  {new Date(p.endDate).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </div>
              )}
            </div>
          </button>
        ))}
      </div>

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
