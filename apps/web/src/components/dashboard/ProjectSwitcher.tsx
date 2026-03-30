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
  active: 'bg-success-500/10 text-success-600',
  planning: 'bg-primary-500/10 text-primary-600',
  'on-hold': 'bg-warning-500/10 text-warning-600',
  completed: 'bg-surface-muted text-text-muted',
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
      console.debug('[ProjectSwitcher] Query firing', {
        activeOrgId,
        url: `/organizations/${activeOrgId}/projects`,
        cookieNames:
          typeof document !== 'undefined'
            ? document.cookie.split(';').map((c) => c.split('=')[0]?.trim())
            : 'N/A',
      });
      const { data } = await apiClient.get(
        `/organizations/${activeOrgId}/projects`
      );
      return data?.data?.projects ?? [];
    },
    enabled: !!activeOrgId,
    staleTime: 5 * 60 * 1000,
    meta: {
      onError: (err: any) => {
        console.error('[ProjectSwitcher] Query failed', {
          status: err.response?.status,
          message: err.message,
          url: err.config?.url,
        });
      },
    },
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
        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-[var(--color-text-subtle)] bg-[var(--color-surface-base)] border border-[var(--color-border-base)] rounded-lg hover:bg-[var(--color-surface-muted)] transition-colors w-full max-w-[220px]"
        id="project-switcher-trigger"
      >
        <FolderKanban className="w-4 h-4 text-[var(--color-text-muted)] shrink-0" />
        <span className="truncate text-[var(--color-text-base)]">
          {isLoading ? 'Loading…' : (activeProject?.name ?? 'Select Project')}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-[var(--color-text-muted)] ml-auto shrink-0 transition-transform ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute left-0 top-full mt-1 w-64 bg-[var(--color-surface-base)] border border-[var(--color-border-base)] rounded-xl shadow-lg z-50 py-1 animate-in fade-in slide-in-from-top-1">
          <p className="px-3 py-1.5 text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
            Projects
          </p>
          {projects.length === 0 ? (
            <p className="px-3 py-4 text-sm text-[var(--color-text-muted)] text-center">
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
                    ? 'bg-primary-500/10 text-[var(--color-accent-base)]'
                    : 'text-[var(--color-text-subtle)] hover:bg-[var(--color-surface-muted)]'
                }`}
              >
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-[var(--color-text-base)] truncate">{project.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span
                      className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                        STATUS_COLORS[project.status] ??
                        'bg-[var(--color-surface-muted)] text-[var(--color-text-muted)]'
                      }`}
                    >
                      {project.status}
                    </span>
                    <span className="text-xs text-[var(--color-text-muted)]">
                      {project.progress}%
                    </span>
                  </div>
                </div>
                {project.id === activeProjectId && (
                  <Check className="w-4 h-4 text-[var(--color-accent-base)] shrink-0" />
                )}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
