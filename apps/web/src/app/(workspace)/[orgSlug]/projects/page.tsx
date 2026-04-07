'use client';

import { useWorkspaceStore } from '@/store/workspace';
import { FolderOpen, Plus, LayoutGrid } from 'lucide-react';
import { ProjectCard } from '@/components/projects/ProjectCard';
import { useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useProjects, useCreateProject } from '@/hooks/useProjects';
import { ProjectPriority } from '@validiant/shared';
import { ProjectsToolbar } from './ProjectsToolbar';
import { EmptyState } from '@/components/ui/EmptyState';

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
      const projectKey =
        name
          .substring(0, 3)
          .toUpperCase()
          .replace(/[^A-Z]/g, 'X') + Math.floor(100 + Math.random() * 900);

      const project = await createMutation.mutateAsync({
        name,
        key: projectKey,
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
    <div className="fixed inset-0 bg-background/80 backdrop-blur-2xl z-50 flex items-center justify-center p-6 animate-in fade-in duration-500">
      <div className="w-full max-w-xl bg-surface-container-low rounded-[3rem] p-12 border border-white/5 shadow-obsidian relative overflow-hidden scale-in-center">
        {/* Glow effect */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-primary/20 rounded-full blur-[80px]" />

        <div className="relative space-y-10">
          <div>
            <label className="text-[10px] font-black uppercase tracking-[0.4em] text-primary mb-2 block">
              Architectural Initiative
            </label>
            <h2 className="text-4xl font-black text-white tracking-tighter font-display leading-none">
              Initialize Project
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-3">
              <label className="block text-[10px] font-black text-text-muted uppercase tracking-[0.2em] pl-1">
                Universe Label *
              </label>
              <input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. ALPHA_VERIFIER_01"
                className="w-full h-16 px-6 bg-surface-lowest/50 border border-white/5 focus:border-primary/20 focus:bg-surface-lowest transition-premium rounded-2xl text-sm font-medium text-white placeholder:text-text-muted/20 shadow-obsidian-inner"
                required
              />
            </div>

            <div className="space-y-3">
              <label className="block text-[10px] font-black text-text-muted uppercase tracking-[0.2em] pl-1">
                Mission Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDesc(e.target.value)}
                rows={3}
                placeholder="Objective parameters and scope details..."
                className="w-full p-6 bg-surface-lowest/50 border border-white/5 focus:border-primary/20 focus:bg-surface-lowest transition-premium rounded-2xl text-sm font-medium text-white placeholder:text-text-muted/20 resize-none shadow-obsidian-inner"
              />
            </div>

            <div className="space-y-3">
              <label className="block text-[10px] font-black text-text-muted uppercase tracking-[0.2em] pl-1">
                Priority Ranking
              </label>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { value: ProjectPriority.LOW, label: 'Standard' },
                  { value: ProjectPriority.MEDIUM, label: 'Elevated' },
                  { value: ProjectPriority.HIGH, label: 'High' },
                  { value: ProjectPriority.URGENT, label: 'Critical' },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setPriority(opt.value)}
                    className={cn(
                      'h-14 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-premium border',
                      priority === opt.value
                        ? 'bg-primary text-background border-primary shadow-glow-primary'
                        : 'bg-surface-lowest/50 text-text-muted border-white/5 hover:bg-white/5'
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-4 pt-6">
              <button
                type="button"
                onClick={() => onClose()}
                className="flex-1 h-16 text-[10px] font-black uppercase tracking-[0.2em] text-text-muted hover:text-white transition-premium"
              >
                Abort
              </button>
              <button
                type="submit"
                disabled={createMutation.isPending || !name.trim()}
                className="flex-[2] btn-primary h-16 rounded-3xl text-[10px] font-black uppercase tracking-[0.2em] disabled:opacity-30 disabled:pointer-events-none active:scale-95"
              >
                {createMutation.isPending ? 'Processing...' : 'Deploy Universe'}
              </button>
            </div>
          </form>
        </div>
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
  const [viewSettings, setViewSettings] = useState({
    showRecords: true,
    showProgress: true,
    showApiStatus: true,
    showDescription: true,
  });

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32 bg-background min-h-screen">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-3 bg-background min-h-screen text-white">
        <div className="p-4 rounded-full bg-rose-500/10 text-rose-500 mb-4">
          <FolderOpen className="w-8 h-8" />
        </div>
        <p className="text-sm text-text-subtle font-medium">
          Failed to load precision data universe.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-white pb-20 animate-in fade-in duration-1000">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 space-y-12">
        {/* Header - Editorial Scale */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 pt-12">
          <div className="space-y-4">
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">
                Operational Intelligence
              </label>
              <h1 className="text-5xl lg:text-7xl font-black tracking-tighter font-display leading-[0.9]">
                Data Universe
              </h1>
            </div>
            <p className="text-lg text-text-subtle font-medium max-w-xl leading-relaxed">
              Managing precision verifications and high-fidelity project
              environments for{' '}
              <span className="text-primary font-black">@{orgSlug}</span>.
            </p>
          </div>

          <button
            onClick={() => setShowCreate(true)}
            className="btn-primary px-10 py-5 text-[10px] font-black uppercase tracking-[0.2em] rounded-3xl"
          >
            <div className="flex items-center gap-3">
              <Plus className="w-5 h-5" />
              <span>Initialize Project</span>
            </div>
          </button>
        </div>

        {/* 2. Advanced Toolbar */}
        <ProjectsToolbar
          viewMode={viewMode}
          setViewMode={setViewMode}
          viewSettings={viewSettings}
          setViewSettings={setViewSettings}
        />

        {/* 3. Projects List Infrastructure */}
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

        {/* Grid View - The Obsidian Stack */}
        {viewMode === 'grid' && filteredProjects.length > 0 && (
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {filteredProjects.map((p) => (
              <ProjectCard
                key={p.id}
                project={p}
                orgSlug={orgSlug}
                settings={viewSettings}
              />
            ))}
          </div>
        )}

        {/* List View - Refined Row Architecture */}
        {viewMode === 'list' && filteredProjects.length > 0 && (
          <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="flex items-center gap-8 px-8 mb-2">
              <div className="w-16" />
              <span className="flex-1 text-[9px] font-black uppercase tracking-[0.3em] text-text-muted opacity-40">
                Identity & Descriptor
              </span>
              <span className="w-48 hidden md:block text-[9px] font-black uppercase tracking-[0.3em] text-text-muted opacity-40">
                Universe Status
              </span>
              <span className="w-32 hidden sm:block text-[9px] font-black uppercase tracking-[0.3em] text-text-muted opacity-40">
                Sync Velocity
              </span>
              <span className="w-24 hidden lg:block text-right text-[9px] font-black uppercase tracking-[0.3em] text-text-muted opacity-40">
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
                className="group flex items-center gap-8 p-6 bg-surface-container-low hover:bg-surface-soft transition-premium rounded-[2rem] text-left shadow-lg hover:-translate-y-1"
              >
                <div className="w-16 h-16 rounded-2xl bg-surface-lowest flex items-center justify-center group-hover:scale-105 transition-premium">
                  <LayoutGrid className="w-8 h-8 text-primary" />
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-black text-white tracking-tight leading-none mb-1 font-display">
                    {p.name}
                  </h3>
                  <p className="text-[11px] text-text-muted font-medium truncate opacity-60">
                    {p.description || 'System initiative environment'}
                  </p>
                </div>

                <div className="hidden md:flex items-center gap-3 w-48">
                  <div className="px-3 py-1 rounded-full bg-white/5 border border-white/5">
                    <span className="text-[8px] font-black uppercase tracking-widest text-primary">
                      {p.status}
                    </span>
                  </div>
                  {(p as { recordCount?: number }).recordCount !==
                    undefined && (
                    <span className="text-[9px] font-black text-text-subtle">
                      {(p as { recordCount?: number }).recordCount} Records
                    </span>
                  )}
                </div>

                <div className="w-32 hidden sm:flex items-center gap-4">
                  <div className="flex-1 h-1 bg-surface-lowest rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500"
                      style={{ width: `${p.progress ?? 0}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-black text-white">
                    {p.progress ?? 0}%
                  </span>
                </div>

                <div className="text-right hidden lg:block w-24 pr-4">
                  <span className="text-[11px] font-bold text-text-muted">
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
          <div className="flex flex-col items-center justify-center py-24 bg-surface-container-low/20 rounded-[3rem] border border-dashed border-white/5">
            <div className="w-20 h-20 rounded-full bg-surface-lowest flex items-center justify-center mb-6">
              <FolderOpen className="w-10 h-10 text-text-muted opacity-30" />
            </div>
            <h3 className="text-xl font-black text-white mb-2 font-display">
              No matching precision units
            </h3>
            <p className="text-sm text-text-subtle font-medium">
              Try adjusting your architectural filters to broaden the scope.
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
    </div>
  );
}
