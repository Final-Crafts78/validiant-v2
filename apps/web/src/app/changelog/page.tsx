'use client';

import React from 'react';
import Link from 'next/link';

export default function ChangelogPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-900 p-6 text-center text-[var(--color-text-base)]">
      <h1 className="mb-6 bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text text-4xl font-bold text-transparent underline decoration-amber-400">
        Changelog
      </h1>
      <div className="mb-12 max-w-lg rounded-2xl border border-[var(--color-border-base)]/40 bg-[var(--color-surface-muted)]/50 p-8 backdrop-blur-sm">
        <p className="mb-2 text-sm font-medium uppercase tracking-widest text-amber-400">
          Latest Release: v2.0.0-beta
        </p>
        <p className="mb-4 italic text-slate-400">
          Major infrastructure migration to Next.js Edge and Hono. Initial audit
          and stabilization in progress.
        </p>
        <div className="space-y-2 text-left text-sm text-slate-500">
          <p>• Enhanced JWT detailed error logging</p>
          <p>• Stabilized real-time SSE stream monitoring</p>
          <p>• Resolved project/verification schema mismatches</p>
        </div>
      </div>
      <Link
        href="/"
        className="rounded-lg bg-orange-600 px-8 py-3 font-medium text-[var(--color-text-base)] shadow-lg shadow-orange-500/20 transition-colors hover:bg-orange-700"
      >
        Return Home
      </Link>
    </div>
  );
}
