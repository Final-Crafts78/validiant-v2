'use client';

import React from 'react';
import Link from 'next/link';

export default function AboutPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 p-6 text-center text-[var(--color-text-base)]">
      <div className="max-w-2xl">
        <h1 className="mb-6 bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-5xl font-bold text-transparent">
          About Validiant
        </h1>
        <p className="mb-8 text-xl leading-relaxed text-slate-400">
          The next generation of field-verification and background verification
          infrastructure. We&apos;re building the most secure, transparent, and
          efficient platform for enterprise verification workflows.
        </p>
        <div className="mb-12 rounded-2xl border border-[var(--color-border-base)]/40 bg-[var(--color-surface-muted)]/50 p-8 backdrop-blur-sm">
          <p className="mb-2 text-sm font-medium uppercase tracking-widest text-indigo-400">
            Status: In Development
          </p>
          <p className="italic text-slate-500">
            This page is currently being polished. Detailed company information
            coming soon.
          </p>
        </div>
        <Link
          href="/"
          className="rounded-lg bg-indigo-600 px-8 py-3 font-medium text-[var(--color-text-base)] shadow-lg shadow-indigo-500/20 transition-colors hover:bg-indigo-700"
        >
          Return Home
        </Link>
      </div>
    </div>
  );
}
