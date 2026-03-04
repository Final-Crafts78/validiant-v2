'use client';
/**
 * Project Switcher
 *
 * Secondary dropdown that lists projects for the active organization.
 * Enabled only when an org is selected in the workspace store.
 */

import { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useWorkspaceStore } from '@/store/workspace';
import apiClient from '@/lib/api';
import { FolderKanban, ChevronDown, Check } from 'lucide-react';

interface Project {
  id: string;
  name: string;
  status: string;
  progress: number;
}

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-emerald-100 text-emerald-700',
  planning: 'bg-blue-100 text-blue-700',
  'on-hold': 'bg-amber-100 text-amber-700',
  completed: 'bg-slate-100 text-slate-600',
};

export function ProjectSwitcher() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const activeOrgId = useWorkspaceStore((s) => s.activeOrgId);
  const activeProjectId = useWorkspaceStore((s) => s.activeProjectId);
  const setActiveProject = useWorkspaceStore((s) => s.setActiveProject);

  // Fetch projects for the active org
  const { data: projects = [], isLoading } = useQuery<Project[]>({
    queryKey: ['projects', 'org', activeOrgId],
    queryFn: async () => {
      const { data } = await apiClient.get(
        `/organizations/${activeOrgId}/projects`
      );
      return data?.data ?? [];
    },
    enabled: !!activeOrgId,
    staleTime: 5 * 60 * 1000,
  });

  const activeProject = projects.find((p) => p.id === activeProjectId);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  if (!activeOrgId) return null;

  return (
    <div ref={ref} className="relative">
      {/* Trigger Button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors w-full max-w-[220px]"
        id="project-switcher-trigger"
      >
        <FolderKanban className="w-4 h-4 text-slate-400 shrink-0" />
        <span className="truncate">
          {isLoading ? 'Loading…' : (activeProject?.name ?? 'Select Project')}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-slate-400 ml-auto shrink-0 transition-transform ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute left-0 top-full mt-1 w-64 bg-white border border-slate-200 rounded-xl shadow-lg z-50 py-1 animate-in fade-in slide-in-from-top-1">
          <p className="px-3 py-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Projects
          </p>
          {projects.length === 0 ? (
            <p className="px-3 py-4 text-sm text-slate-400 text-center">
              No projects yet
            </p>
          ) : (
            projects.map((project) => (
              <button
                key={project.id}
                onClick={() => {
                  setActiveProject(project.id);
                  setOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm text-left transition-colors ${
                  project.id === activeProjectId
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{project.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span
                      className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                        STATUS_COLORS[project.status] ??
                        'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {project.status}
                    </span>
                    <span className="text-xs text-slate-400">
                      {project.progress}%
                    </span>
                  </div>
                </div>
                {project.id === activeProjectId && (
                  <Check className="w-4 h-4 text-blue-600 shrink-0" />
                )}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
