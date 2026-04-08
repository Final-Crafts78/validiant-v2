'use client';

import React from 'react';
import Link from 'next/link';

export default function DocsPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 p-6 text-center text-[var(--color-text-base)]">
      <h1 className="mb-6 bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-5xl font-bold text-transparent underline decoration-emerald-400">
        Documentation
      </h1>
      <div className="mb-12 rounded-2xl border border-[var(--color-border-base)]/40 bg-[var(--color-surface-muted)]/50 p-8 backdrop-blur-sm">
        <p className="mb-2 text-sm font-medium uppercase tracking-widest text-emerald-400">
          Status: Being Polished
        </p>
        <p className="italic text-slate-500">
          This page is currently being authored. Check back soon.
        </p>
      </div>
      <Link
        href="/"
        className="rounded-lg bg-emerald-600 px-8 py-3 font-medium text-[var(--color-text-base)] shadow-lg shadow-emerald-500/20 transition-colors hover:bg-emerald-700"
      >
        Return Home
      </Link>
    </div>
  );
}
