'use client';

import React from 'react';
import Link from 'next/link';

const LegalLayout = ({
  title,
  status = 'Public Draft',
}: {
  title: string;
  status?: string;
}) => (
  <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 p-6 text-center text-[var(--color-text-base)]">
    <div className="max-w-2xl">
      <h1 className="mb-6 bg-gradient-to-r from-red-400 to-amber-400 bg-clip-text text-5xl font-bold text-transparent">
        {title}
      </h1>
      <p className="mb-8 text-xl leading-relaxed text-slate-400">
        We prioritize transparency and security in all our operations. Detailed
        legal documentation and compliance frameworks are currently being
        reviewed.
      </p>
      <div className="mb-12 rounded-2xl border border-[var(--color-border-base)]/40 bg-[var(--color-surface-muted)]/50 p-8 backdrop-blur-sm">
        <p className="mb-2 text-sm font-medium uppercase tracking-widest text-amber-400">
          Status: {status}
        </p>
        <p className="italic text-slate-500">
          This page is currently being finalized. Please contact
          support@validiant.in for immediate legal inquiries.
        </p>
      </div>
      <Link
        href="/"
        className="rounded-lg border border-[var(--color-border-base)]/40 bg-slate-800 px-8 py-3 font-medium transition-colors hover:bg-slate-700"
      >
        Return Home
      </Link>
    </div>
  </div>
);

export default function SecurityPage() {
  return <LegalLayout title="Security & Compliance" status="In Audit" />;
}
