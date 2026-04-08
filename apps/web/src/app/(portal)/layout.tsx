'use client';

import { ReactNode } from 'react';

/**
 * Portal Layout - Ultra-minimal, high-contrast, mobile-first.
 * Used for Field Agent and Client portals.
 */
export default function PortalLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-primary-500/30 selection:text-[var(--color-text-base)] antialiased font-manrope">
      <div className="max-w-md mx-auto min-h-screen flex flex-col">
        <main className="flex-1 flex flex-col">{children}</main>

        {/* Verification Nucleus - Subtle Status Indicator */}
        <footer className="p-6 border-t border-slate-900 bg-slate-950/80 backdrop-blur-xl">
          <div className="flex items-center justify-between opacity-30 group hover:opacity-100 transition-opacity">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
              <span className="text-[10px] font-black uppercase tracking-widest">
                Validiant Secured
              </span>
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest">
              v2.4.0
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
}
