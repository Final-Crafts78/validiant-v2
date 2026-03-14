'use client';

import Link from 'next/link';
import { Play, ArrowRight } from 'lucide-react';
import { ROUTES } from '@/lib/config';

export default function Hero() {
  return (
    <section className="relative pt-48 pb-24 lg:pt-64 lg:pb-40 overflow-hidden">
      {/* Animated Gradient Background */}
      <div className="absolute inset-0 -z-10 bg-white">
        <div className="absolute inset-0 opacity-[0.03] animate-gradient bg-gradient-to-br from-blue-600 via-indigo-600 to-emerald-600" />
        <div 
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: 'linear-gradient(to bottom, rgba(241,245,249,0.4) 1px, transparent 1px), linear-gradient(to right, rgba(241,245,249,0.4) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />
      </div>

      <div className="relative max-w-5xl mx-auto px-6 text-center animate-fadeInUp">
        {/* Eyebrow Badge */}
        <span className="inline-block mb-8 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-blue-600 bg-blue-50 border border-blue-100 rounded-full">
          Enterprise Field Compliance OS
        </span>

        {/* Headline */}
        <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-slate-900 leading-[1.1] mb-8">
          The Operating System for <br className="hidden md:block" />
          <span className="text-blue-600">Field Compliance Teams</span>
        </h1>

        {/* Sub-headline */}
        <p className="text-xl text-slate-500 max-w-3xl mx-auto mb-12 leading-relaxed">
          Manage multiple organizations, track real-time field tasks, and maintain a tamper-proof audit chain. 
          Built for scale, verified by forensics, trusted by global enterprises.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-16">
          <Link
            href={ROUTES.REGISTER}
            className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 text-base font-bold bg-blue-600 text-white rounded-xl shadow-xl shadow-blue-500/20 hover:bg-blue-700 hover:-translate-y-0.5 transition-all gap-2"
          >
            Start Free
            <ArrowRight size={20} />
          </Link>
          <a
            href="#how-it-works"
            className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 text-base font-bold text-slate-600 border border-slate-200 bg-white rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all gap-2"
          >
            <Play size={18} fill="currentColor" />
            Watch 2-min Demo
          </a>
        </div>

        {/* Micro-stats */}
        <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-6 text-slate-400">
          <div className="flex flex-col items-center">
            <span className="text-slate-900 font-bold text-lg">10,000+</span>
            <span className="text-[10px] uppercase tracking-widest font-bold">Tasks Tracked</span>
          </div>
          <div className="w-px h-8 bg-slate-100 hidden sm:block" />
          <div className="flex flex-col items-center">
            <span className="text-slate-900 font-bold text-lg">99.9%</span>
            <span className="text-[10px] uppercase tracking-widest font-bold">Uptime SLA</span>
          </div>
          <div className="w-px h-8 bg-slate-100 hidden sm:block" />
          <div className="flex flex-col items-center">
            <span className="text-slate-900 font-bold text-lg">&lt;2s</span>
            <span className="text-[10px] uppercase tracking-widest font-bold">Avg. API Response</span>
          </div>
        </div>
      </div>
    </section>
  );
}
