'use client';

import React, { ReactNode } from 'react';
import { GripHorizontal, X } from 'lucide-react';

interface WidgetShellProps {
  id: string; // Instance ID
  title: string;
  isEditing: boolean;
  onRemove?: (id: string) => void;
  children: ReactNode;
}

export function WidgetShell({
  id,
  title,
  isEditing,
  onRemove,
  children,
}: WidgetShellProps) {
  return (
    <div
      className={`relative h-full flex flex-col bg-[var(--color-surface-base)] rounded-3xl overflow-hidden transition-all duration-300 shadow-obsidian border border-[var(--color-border-base)]/10 group
        ${isEditing ? 'ring-2 ring-primary/30 ring-offset-2 ring-offset-[var(--color-background)]' : ''}`}
    >
      {/* Header bar - visible consistently during edit mode, or on hover otherwise */}
      <div 
        className={`shrink-0 flex items-center justify-between px-6 py-4 border-b border-[var(--color-border-base)]/10 bg-[var(--color-surface-subtle)] ${
          isEditing ? 'cursor-move drag-handle' : ''
        }`}
      >
        <div className="flex items-center gap-3">
          {isEditing && (
            <GripHorizontal className="w-4 h-4 text-[var(--color-text-muted)]" />
          )}
          <h3 className="text-[11px] font-black uppercase tracking-widest text-[var(--color-text-base)]">
            {title}
          </h3>
        </div>

        {isEditing && onRemove && (
          <button
            onPointerDown={(e) => {
              // Vital: stop propagation so grid doesn't intercept as drag start
              e.stopPropagation();
              onRemove(id);
            }}
            className="p-1.5 rounded-xl text-[var(--color-text-muted)] hover:text-red-500 hover:bg-red-500/10 transition-colors z-50 pointer-events-auto cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Content wrapper */}
      <div className="flex-1 min-h-0 relative">
        {/* Anti-interaction shield during edit mode */}
        {isEditing && (
          <div className="absolute inset-0 z-10 bg-[var(--color-background)]/5" />
        )}
        <div className="absolute inset-0 p-6 overflow-y-auto custom-scrollbar">
          {children}
        </div>
      </div>
    </div>
  );
}
