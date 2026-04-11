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
import { queryKeys } from '@/lib/query-keys';
import { FolderKanban, ChevronDown, Check } from 'lucide-react';
import { logger } from '@/lib/logger';

interface Project {
  id: string;
  name: string;
  status: string;
  progress: number;
}

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  planning: 'bg-primary-500/10 text-primary-600 dark:text-primary-400',
  'on-hold': 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  completed:
    'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
};

export function ProjectSwitcher() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const activeOrgId = useWorkspaceStore((s) => s.activeOrgId);
  const activeProjectId = useWorkspaceStore((s) => s.activeProjectId);
  const setActiveProject = useWorkspaceStore((s) => s.setActiveProject);

  // Fetch projects for the active org
  const { data: projects = [], isLoading } = useQuery<Project[]>({
    queryKey: queryKeys.projects.org(activeOrgId || ''),
    enabled: !!activeOrgId,
    queryFn: async () => {
      logger.debug('[ProjectSwitcher] Query firing', {
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
    staleTime: 5 * 60 * 1000,
    meta: {
      onError: (err: Error) => {
        logger.error('[ProjectSwitcher] Query failed', {
          status: (err as unknown as { response?: { status?: number } })
            ?.response?.status,
          message: err.message,
          url: (err as unknown as { config?: { url?: string } })?.config?.url,
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
        className="flex items-center gap-2 px-3 py-2 text-sm font-black text-[var(--color-text-subtle)] bg-glass border border-[var(--color-border-base)] rounded-xl hover:bg-primary-50 dark:hover:bg-primary-950/20 transition-all shadow-sm group"
        id="project-switcher-trigger"
      >
        <div className="w-5 h-5 rounded-md bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center shrink-0">
          <FolderKanban className="w-3 h-3 text-primary-600" />
        </div>
        <span className="truncate text-[var(--color-text-base)]">
          {isLoading ? 'Loading…' : (activeProject?.name ?? 'Select Project')}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-[var(--color-text-muted)] group-hover:text-primary-600 ml-auto shrink-0 transition-transform ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute left-0 top-full mt-2 w-72 bg-glass border border-[var(--color-border-base)] rounded-2xl shadow-2xl z-50 py-2 animate-in fade-in slide-in-from-top-2">
          <p className="px-4 py-2 text-[10px] font-black text-[var(--color-text-muted)] uppercase tracking-widest">
            Active Projects
          </p>
          <div className="max-h-[300px] overflow-y-auto px-2 space-y-1">
            {projects.length === 0 ? (
              <p className="px-4 py-8 text-sm text-[var(--color-text-muted)] text-center font-bold italic">
                No active initiatives
              </p>
            ) : (
              projects.map((project) => (
                <button
                  key={project.id}
                  onClick={() => {
                    setActiveProject(project.id);
                    setOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-left transition-all group ${
                    project.id === activeProjectId
                      ? 'bg-primary-600 text-[var(--color-text-base)] shadow-lg shadow-primary-600/20'
                      : 'text-[var(--color-text-subtle)] hover:bg-primary-50 dark:hover:bg-primary-950/20 hover:text-primary-600'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <p
                      className={`font-black truncate ${
                        project.id === activeProjectId
                          ? 'text-[var(--color-text-base)]'
                          : 'text-[var(--color-text-base)]'
                      }`}
                    >
                      {project.name}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span
                        className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
                          project.id === activeProjectId
                            ? 'bg-white/20 text-[var(--color-text-base)]'
                            : (STATUS_COLORS[project.status] ??
                              'bg-slate-100 text-slate-500')
                        }`}
                      >
                        {project.status}
                      </span>
                      <span
                        className={`text-[10px] font-bold ${
                          project.id === activeProjectId
                            ? 'text-[var(--color-text-base)]/70'
                            : 'text-[var(--color-text-muted)]'
                        }`}
                      >
                        {project.progress}% Complete
                      </span>
                    </div>
                  </div>
                  {project.id === activeProjectId && (
                    <Check className="w-4 h-4 text-[var(--color-text-base)] shrink-0" />
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
