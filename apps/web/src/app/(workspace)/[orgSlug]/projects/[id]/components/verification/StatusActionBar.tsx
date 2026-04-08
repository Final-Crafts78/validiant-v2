'use client';

import React from 'react';
import { ShieldCheck, ShieldX, Clock, ChevronRight } from 'lucide-react';
import { ProjectType } from '@validiant/shared';

interface StatusActionBarProps {
  projectType: ProjectType;
  currentStatus: string;
  onUpdateStatus: (label: string) => void;
  isUpdating?: boolean;
}

/**
 * [x] Resolve StatusActionBar.tsx type mismatch
 * StatusActionBar - The high-fidelity decision engine for executives.
 * Uses custom project-scoped verification labels for 100% data alignment.
 */
export function StatusActionBar({
  projectType,
  currentStatus,
  onUpdateStatus,
  isUpdating = false,
}: StatusActionBarProps) {
  // Extract custom verification labels from projectType (Fallbacks provided)
  // Normalize verification labels with custom overrides from projectType settings
  const labels = [
    {
      id: 'verified',
      label:
        projectType.settings?.customVerificationLabels?.['completed'] ||
        'Verified',
      color: 'var(--success)',
      icon: 'check',
    },
    {
      id: 'rejected',
      label:
        projectType.settings?.customVerificationLabels?.['rejected'] ||
        'Rejected',
      color: 'var(--error)',
      icon: 'x',
    },
  ];

  return (
    <div className="absolute bottom-0 left-0 right-0 p-6 bg-surface-container-low/80 backdrop-blur-2xl border-t border-[var(--color-border-base)]/20 flex items-center justify-between z-10 animate-in slide-in-from-bottom-10 duration-700 delay-300">
      <div className="flex items-center gap-4">
        <div className="p-3 bg-[var(--color-surface-muted)]/50 rounded-2xl border border-[var(--color-border-base)]/20">
          <Clock className="w-5 h-5 text-[var(--text-muted)]/30" />
        </div>
        <div className="space-y-0.5">
          <p className="text-[10px] font-black text-[var(--text-muted)]/20 uppercase tracking-[0.2em]">
            CURRENT_PROTOCOL_STATE
          </p>
          <div className="flex items-center gap-2">
            <span className="text-sm font-black text-[var(--color-text-base)] italic uppercase tracking-tight">
              {currentStatus || 'PENDING_INITIALIZATION'}
            </span>
            <ChevronRight className="w-3 h-3 text-[var(--color-text-base)]/10" />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {labels.map((labelInfo) => (
          <button
            key={labelInfo.id}
            onClick={() => onUpdateStatus(labelInfo.label)}
            disabled={isUpdating}
            style={{
              backgroundColor: `color-mix(in srgb, ${labelInfo.color}, transparent 90%)`,
              borderColor: `color-mix(in srgb, ${labelInfo.color}, transparent 80%)`,
              color: labelInfo.color,
            }}
            className="group relative flex items-center gap-3 px-6 py-3 rounded-2xl border text-[10px] font-black uppercase tracking-widest transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
          >
            <div className="absolute inset-0 bg-current opacity-0 group-hover:opacity-10 transition-opacity rounded-2xl" />
            {labelInfo.icon === 'check' ? (
              <ShieldCheck className="w-4 h-4 shadow-lg" />
            ) : (
              <ShieldX className="w-4 h-4 shadow-lg" />
            )}
            {labelInfo.label}
          </button>
        ))}
      </div>
    </div>
  );
}
