'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useProjects, useCreateProject } from '@/hooks/useProjects';
import { useWorkspaceStore } from '@/store/workspace';
import { FolderOpen, Plus } from 'lucide-react';

export default function ProjectsPage() {
  const router = useRouter();
  const { setActiveProject } = useWorkspaceStore();
  const { data: projects = [], isLoading } = useProjects();
  const createMutation = useCreateProject();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const project = await createMutation.mutateAsync(name.trim());
    setName('');
    setShowForm(false);
    setActiveProject(project.id);
    router.push(`/dashboard/projects/${project.id}`);
  };

  if (isLoading)
    return <div className="p-8 text-slate-400">Loading projects…</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-900">Projects</h1>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" /> New Project
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleCreate}
          className="flex gap-3 bg-white border border-slate-200 rounded-xl p-4"
        >
          <input
            autoFocus
            type="text"
            placeholder="Project name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg disabled:opacity-50"
          >
            {createMutation.isPending ? 'Creating…' : 'Create'}
          </button>
          <button
            type="button"
            onClick={() => setShowForm(false)}
            className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900"
          >
            Cancel
          </button>
        </form>
      )}

      {projects.length === 0 ? (
        <div className="text-center py-16 bg-white border border-slate-200 rounded-2xl">
          <FolderOpen className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 text-sm">
            No projects yet. Create your first one.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {projects.map((p) => (
            <button
              key={p.id}
              onClick={() => {
                setActiveProject(p.id);
                router.push(`/dashboard/projects/${p.id}`);
              }}
              className="bg-white border border-slate-200 rounded-xl p-5 text-left hover:border-blue-400 hover:shadow-sm transition-all"
            >
              <h3 className="font-semibold text-slate-900">{p.name}</h3>
              <p className="text-xs text-slate-400 mt-1 capitalize">
                {p.status}
              </p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
