'use client';

import React from 'react';
import { WidgetProps } from '../types';
import { useProjects } from '@/hooks/useProjects';
import { FolderKanban } from 'lucide-react';
import Link from 'next/link';

export default function ProjectStatusMatrix({ orgId, isEditing }: WidgetProps) {
  const { data: projects, isLoading } = useProjects();

  if (isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center text-[var(--color-text-muted)] animate-pulse">
        Loading projects...
      </div>
    );
  }

  if (!projects || projects.length === 0) {
    return (
      <div className="flex flex-col h-full items-center justify-center text-center gap-4 text-[var(--color-text-muted)]">
        <FolderKanban className="w-10 h-10 opacity-20" />
        <p>No active projects</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
        {projects.slice(0, 6).map((project) => (
          <Link
            key={project.id}
            href={`/${orgId}/projects/${project.id}`}
            onClick={(e) => {
               if (isEditing) e.preventDefault();
            }}
            className={`p-4 rounded-2xl bg-[var(--color-surface-subtle)] border border-[var(--color-border-base)]/10 hover:border-primary/30 transition-colors ${isEditing ? 'pointer-events-none' : ''}`}
          >
            <div className="flex justify-between items-start mb-2">
              <h4 className="font-bold text-[var(--color-text-base)] truncate pr-2">{project.name}</h4>
              <span className={`text-[10px] uppercase font-black px-2 py-0.5 rounded-full ${
                project.status === 'completed' ? 'bg-green-500/10 text-green-500' :
                project.status === 'archived' ? 'bg-gray-500/10 text-gray-500' :
                'bg-blue-500/10 text-blue-500'
              }`}>
                {project.status || 'Active'}
              </span>
            </div>
            <p className="text-xs text-[var(--color-text-muted)] line-clamp-2">
              {project.description || 'No description provided'}
            </p>
          </Link>
        ))}
      </div>
      <div className="mt-auto flex justify-end">
        <Link 
          href={`/${orgId}/projects`}
          className={`text-xs font-bold text-primary hover:text-primary/80 ${isEditing ? 'pointer-events-none' : ''}`}
        >
          View All Projects →
        </Link>
      </div>
    </div>
  );
}
