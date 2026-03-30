'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useProjects, useCreateProject } from '@/hooks/useProjects';
import { useWorkspaceStore } from '@/store/workspace';
import { ProjectStatus, ProjectPriority } from '@validiant/shared';
import { FolderOpen, Plus, Loader2, AlertCircle, Calendar } from 'lucide-react';

// ── Status badge ──────────────────────────────────────────────────────────────
const STATUS_STYLES: Record<string, string> = {
  [ProjectStatus.ACTIVE]: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  [ProjectStatus.PLANNING]: 'bg-blue-50    text-blue-700    border-blue-200',
  [ProjectStatus.ON_HOLD]: 'bg-amber-50   text-amber-700   border-amber-200',
  [ProjectStatus.COMPLETED]: 'bg-slate-100  text-slate-600   border-slate-200',
  [ProjectStatus.ARCHIVED]: 'bg-slate-100  text-slate-400   border-slate-200',
  [ProjectStatus.CANCELLED]: 'bg-red-50     text-red-600     border-red-200',
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
  [ProjectPriority.LOW]: 'bg-slate-100 text-slate-500',
  [ProjectPriority.MEDIUM]: 'bg-blue-50   text-blue-600',
  [ProjectPriority.HIGH]: 'bg-amber-50  text-amber-700',
  [ProjectPriority.URGENT]: 'bg-red-50    text-red-700',
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
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="modal-surface w-full max-w-md p-6 space-y-5">
        <h2 className="text-lg font-bold text-text-base">New Project</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-text-muted mb-1 uppercase tracking-wide">
              Name *
            </label>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Q3 Field Audit"
              className="input w-full"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-text-muted mb-1 uppercase tracking-wide">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDesc(e.target.value)}
              rows={3}
              placeholder="What is this project about?"
              className="input w-full resize-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-text-muted mb-1 uppercase tracking-wide">
              Priority
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as ProjectPriority)}
              className="input w-full"
            >
              <option value={ProjectPriority.LOW}>Low</option>
              <option value={ProjectPriority.MEDIUM}>Medium</option>
              <option value={ProjectPriority.HIGH}>High</option>
              <option value={ProjectPriority.URGENT}>Urgent</option>
            </select>
          </div>
          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              disabled={createMutation.isPending || !name.trim()}
              className="flex-1 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {createMutation.isPending ? 'Creating…' : 'Create Project'}
            </button>
            <button
              type="button"
              onClick={() => onClose()}
              className="btn btn-outline px-4"
            >
              Cancel
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
  const { setActiveProject } = useWorkspaceStore();
  const { data: projects = [], isLoading, isError } = useProjects();
  const [showCreate, setShowCreate] = useState(false);

  if (isLoading)
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="h-7 w-7 animate-spin text-blue-600" />
      </div>
    );

  if (isError)
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-3">
        <AlertCircle className="h-8 w-8 text-red-500" />
        <p className="text-sm text-slate-500">Failed to load projects.</p>
      </div>
    );

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-text-base">Projects</h1>
          <p className="text-sm text-text-muted mt-0.5">
            {projects.length} project{projects.length !== 1 ? 's' : ''} in this
            workspace
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" /> New Project
        </button>
      </div>

      {/* Empty state */}
      {projects.length === 0 && (
        <div className="text-center py-20 card-surface border-dashed">
          <FolderOpen className="w-10 h-10 text-text-muted mx-auto mb-3" />
          <p className="text-text-subtle text-sm font-medium">No projects yet.</p>
          <p className="text-text-muted text-xs mt-1">
            Create your first project to start tracking work.
          </p>
        </div>
      )}

      {/* Project cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {projects.map((p) => (
          <button
            key={p.id}
            onClick={() => {
              setActiveProject(p.id);
              router.push(`/${orgSlug}/projects/${p.id}`);
            }}
            className="card-surface p-5 text-left hover:border-blue-400 hover:shadow-md transition-all group"
          >
            {/* Top row: name + status */}
            <div className="flex items-start justify-between gap-2 mb-2">
              <h3 className="font-semibold text-text-base leading-snug group-hover:text-blue-700 transition-colors line-clamp-1">
                {p.name}
              </h3>
              <span
                className={`shrink-0 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                  STATUS_STYLES[p.status] ??
                  STATUS_STYLES[ProjectStatus.PLANNING]
                }`}
              >
                {STATUS_LABELS[p.status] ?? p.status}
              </span>
            </div>

            {/* Description */}
            {p.description && (
              <p className="text-xs text-slate-500 line-clamp-2 mb-3">
                {p.description}
              </p>
            )}

            {/* Progress bar */}
            <div className="mb-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] text-slate-400 font-medium">
                  Progress
                </span>
                <span className="text-[11px] text-slate-600 font-semibold">
                  {p.progress ?? 0}%
                </span>
              </div>
              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all"
                  style={{ width: `${p.progress ?? 0}%` }}
                />
              </div>
            </div>

            {/* Footer meta */}
            <div className="flex items-center gap-3 flex-wrap">
              {/* Priority */}
              <span
                className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                  PRIORITY_STYLES[p.priority] ??
                  PRIORITY_STYLES[ProjectPriority.MEDIUM]
                }`}
              >
                {p.priority}
              </span>

              {/* Due date */}
              {p.endDate && (
                <span className="flex items-center gap-1 text-[11px] text-slate-400">
                  <Calendar className="w-3 h-3" />
                  {new Date(p.endDate).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </span>
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
