'use client';

import React from 'react';
import Link from 'next/link';

export default function PrivacyPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 p-6 text-center text-[var(--color-text-base)]">
      <h1 className="mb-6 bg-gradient-to-r from-teal-400 to-blue-400 bg-clip-text text-4xl font-bold text-transparent underline decoration-blue-400">
        Privacy Policy
      </h1>
      <div className="mb-12 max-w-md rounded-2xl border border-[var(--color-border-base)]/40 bg-[var(--color-surface-muted)]/50 p-8 backdrop-blur-sm">
        <p className="mb-2 text-sm font-medium uppercase tracking-widest text-blue-400">
          Status: Privacy Audit
        </p>
        <p className="italic text-slate-400">
          This page is currently being finalized. Please contact
          privacy@validiant.in for immediate privacy policy inquiries.
        </p>
      </div>
      <Link
        href="/"
        className="rounded-lg bg-teal-600 px-8 py-3 font-medium text-[var(--color-text-base)] shadow-lg shadow-teal-500/20 transition-colors hover:bg-teal-700"
      >
        Return Home
      </Link>
    </div>
  );
}
