'use client';

import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center rounded-3xl border-2 border-dashed border-[var(--color-border-base)] bg-[var(--color-surface-soft)]/30 backdrop-blur-sm animate-in fade-in zoom-in duration-500">
      <div className="w-16 h-16 bg-primary-500/10 rounded-2xl flex items-center justify-center mb-6 shadow-sm">
        <Icon className="w-8 h-8 text-primary-600" />
      </div>
      <h3 className="text-xl font-black text-[var(--color-text-base)] mb-2 tracking-tight">
        {title}
      </h3>
      <p className="text-sm text-[var(--color-text-muted)] max-w-sm mb-8 leading-relaxed">
        {description}
      </p>
      {action && (
        <button
          onClick={action.onClick}
          className="btn-primary px-6 py-2.5 text-sm font-black rounded-xl transition-all hover:scale-105 active:scale-95 shadow-lg shadow-primary-600/20"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
