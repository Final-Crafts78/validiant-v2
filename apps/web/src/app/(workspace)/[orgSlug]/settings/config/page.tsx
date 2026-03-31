'use client';

import React from 'react';
import { Layers, AlertCircle } from 'lucide-react';

export default function CaseConfigPage() {
  return (
    <div className="card-surface overflow-hidden">
      <div className="p-8 border-b border-[var(--color-border-base)] bg-[var(--color-surface-soft)]">
        <div className="flex items-center gap-4 mb-2">
          <div className="p-3 bg-[var(--color-accent-base)]/10 rounded-xl text-[var(--color-accent-base)]">
            <Layers className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[var(--color-text-base)] tracking-tight">
              Case Configuration
            </h1>
            <p className="text-[var(--color-text-muted)] text-sm italic">
              Configure system-wide case behaviors and automation rules.
            </p>
          </div>
        </div>
      </div>

      <div className="p-12 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 bg-[var(--color-surface-muted)] rounded-full flex items-center justify-center mb-6 text-[var(--color-text-muted)]">
          <AlertCircle className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-bold text-[var(--color-text-base)] mb-2">
          Configuration Module Under Maintenance
        </h2>
        <p className="text-[var(--color-text-muted)] max-w-md mx-auto mb-8">
          We are currently upgrading the Case Configuration engine to support
          advanced multi-layered workflows. This module will be available in the
          next release.
        </p>
        <div className="flex gap-4">
          <button
            onClick={() => window.history.back()}
            className="btn btn-primary px-6 py-2.5 shadow-lg shadow-[var(--color-accent-base)]/20"
          >
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
}
