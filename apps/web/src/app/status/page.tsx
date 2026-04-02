'use client';

import React from 'react';
import Link from 'next/link';

export default function StatusPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-black p-6 text-center text-white">
      <h1 className="mb-6 bg-gradient-to-r from-emerald-500 to-green-500 bg-clip-text text-4xl font-bold text-transparent underline decoration-green-500">
        System Status
      </h1>
      <div className="mb-12 max-w-lg rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-sm">
        <div className="mb-4 flex items-center justify-center space-x-2">
          <div className="h-3 w-3 animate-pulse rounded-full bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.5)]"></div>
          <p className="text-sm font-medium uppercase tracking-widest text-emerald-400">
            All Systems Operational
          </p>
        </div>
        <p className="italic text-slate-500">
          Continuous monitoring active across all Validiant infrastructure. No
          outages reported in the last 24 hours.
        </p>
      </div>
      <Link
        href="/"
        className="rounded-lg bg-emerald-700 px-8 py-3 font-medium text-white shadow-lg shadow-emerald-500/20 transition-colors hover:bg-emerald-600"
      >
        Return Home
      </Link>
    </div>
  );
}
