'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import {
  LayoutGrid,
  Calendar,
  Activity,
  ArrowRight,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { Project, ProjectStatus, ProjectPriority } from '@validiant/shared';
import { cn } from '@/lib/utils';

/**
 * Obsidian Verifier: Project Tile
 *
 * Implements the "Architectural Verifier" design system:
 * - Tonal Layering (Recessed look)
 * - No horizontal/vertical lines
 * - Extreme Scale Typography
 * - Glassmorphic Accents
 */

interface ProjectCardProps {
  project: Project;
  orgSlug: string;
  className?: string;
  settings?: {
    showRecords: boolean;
    showProgress: boolean;
    showApiStatus: boolean;
    showDescription: boolean;
  };
}

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; icon: React.ElementType }
> = {
  [ProjectStatus.ACTIVE]: {
    label: 'Operational',
    color: 'text-emerald-400',
    icon: Activity,
  },
  [ProjectStatus.PLANNING]: {
    label: 'Architecting',
    color: 'text-blue-400',
    icon: Zap,
  },
  [ProjectStatus.ON_HOLD]: {
    label: 'Suspended',
    color: 'text-amber-400',
    icon: ShieldCheck,
  },
  default: {
    label: 'Initialized',
    color: 'text-slate-400',
    icon: ShieldCheck,
  },
};

export function ProjectCard({
  project,
  orgSlug,
  className,
  settings = {
    showRecords: true,
    showProgress: true,
    showApiStatus: true,
    showDescription: true,
  },
}: ProjectCardProps) {
  const router = useRouter();

  const statusConfig =
    STATUS_CONFIG[project.status as keyof typeof STATUS_CONFIG] ||
    STATUS_CONFIG.default;
  if (!statusConfig) {
    throw new Error('STATUS_CONFIG must include a default fallback.');
  }

  const progress = project.progress ?? 0;
  const currentRecordCount = (project as { recordCount?: number }).recordCount ?? 0;

  return (
    <button
      onClick={() => router.push(`/${orgSlug}/projects/${project.id}`)}
      className={cn(
        'group relative flex flex-col w-full text-left transition-premium',
        'bg-surface-container-low hover:bg-surface-soft rounded-[2.5rem] p-10',
        'shadow-obsidian hover:-translate-y-2',
        className
      )}
    >
      {/* 1. Header: Status & Visual Identity */}
      <div className="flex items-start justify-between mb-10">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-surface-lowest flex items-center justify-center group-hover:scale-110 transition-premium shadow-inner">
            <LayoutGrid className="w-8 h-8 text-primary" />
          </div>
          <div className="flex flex-col">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-primary opacity-60">
              Project Identity
            </label>
            <span className="text-[11px] font-mono font-black text-white/40 uppercase tracking-tighter">
              {project.key || 'PRJ-' + project.id.substring(0, 4)}
            </span>
          </div>
        </div>

        <div className="flex flex-col items-end text-right">
          <div
            className={cn(
              'flex items-center gap-2 mb-1 px-3 py-1 rounded-full bg-white/5 backdrop-blur-md border border-white/5',
              statusConfig.color
            )}
          >
            {statusConfig.icon &&
              React.createElement(statusConfig.icon, { className: 'w-3 h-3' })}
            <span className="text-[9px] font-black uppercase tracking-[0.15em]">
              {statusConfig.label}
            </span>
          </div>
          {settings.showApiStatus &&
            project.priority === ProjectPriority.URGENT && (
              <span className="text-[8px] font-black text-rose-500 uppercase tracking-widest animate-pulse">
                Critical Priority
              </span>
            )}
        </div>
      </div>

      {/* 2. Core Content: Editorial Typography */}
      <div className="space-y-3 mb-12">
        <h3 className="text-3xl font-black text-white tracking-tight leading-none group-hover:text-primary transition-colors font-display">
          {project.name}
        </h3>
        {settings.showDescription && (
          <p className="text-[13px] text-text-subtle font-medium leading-relaxed line-clamp-2 max-w-[90%]">
            {project.description ||
              'Precision-scoped architectural universe for mission-critical data verification and operational integrity.'}
          </p>
        )}
      </div>

      {/* 3. Metrics: Universal Counters */}
      {(settings.showRecords || settings.showProgress) && (
        <div className="grid grid-cols-2 gap-8 mb-10">
          {settings.showRecords && (
            <div className="flex flex-col gap-1.5 p-5 rounded-3xl bg-surface-lowest/50 border border-white/5 group-hover:bg-surface-lowest transition-all">
              <label className="text-[9px] font-black uppercase tracking-[0.2em] text-text-muted">
                Verified Records
              </label>
              <div className="flex items-baseline gap-2">
                <span className="text-[2xl] font-black text-white font-display leading-none">
                  {currentRecordCount}
                </span>
                <span className="text-[10px] font-bold text-emerald-500">
                  +12%
                </span>
              </div>
            </div>
          )}
          {settings.showProgress && (
            <div className="flex flex-col gap-1.5 p-5 rounded-3xl bg-surface-lowest/50 border border-white/5 group-hover:bg-surface-lowest transition-all">
              <label className="text-[9px] font-black uppercase tracking-[0.2em] text-text-muted">
                Sync Velocity
              </label>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-white font-display leading-none">
                  {progress}%
                </span>
                <div className="w-12 h-1 bg-surface-soft rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 4. Footer: Action & Timeline */}
      <div className="mt-auto pt-8 border-t border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-text-muted" />
            <span className="text-[10px] font-bold text-text-muted">
              {project.updatedAt
                ? new Date(project.updatedAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })
                : 'Never'}
            </span>
          </div>
          {settings.showApiStatus && (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
              <span className="text-[9px] font-black uppercase tracking-widest text-text-muted opacity-60">
                API Stream Active
              </span>
            </div>
          )}
        </div>

        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-background transition-all -rotate-45 group-hover:rotate-0">
          <ArrowRight className="w-5 h-5" />
        </div>
      </div>
    </button>
  );
}
