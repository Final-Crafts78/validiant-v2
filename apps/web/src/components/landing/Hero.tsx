'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Play, ArrowRight } from 'lucide-react';
import { ROUTES } from '@/lib/config';
import ScrollReveal from '@/components/ui/ScrollReveal';

export default function Hero() {
  return (
    <section className="relative pt-32 pb-24 lg:pt-48 lg:pb-40 overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 -z-10 bg-white">
        <div className="absolute inset-0 opacity-[0.03] animate-gradient bg-gradient-to-br from-blue-600 via-indigo-600 to-emerald-600" />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              'linear-gradient(to bottom, rgba(241,245,249,0.4) 1px, transparent 1px), linear-gradient(to right, rgba(241,245,249,0.4) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />
      </div>

      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left Column: Content */}
          <div className="relative z-10 text-left">
            <ScrollReveal>
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
              <p className="text-xl text-slate-500 max-w-xl mb-12 leading-relaxed">
                Manage multiple organizations, track real-time field tasks, and
                maintain a tamper-proof audit chain. Built for scale, verified
                by forensics, trusted by global enterprises.
              </p>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row items-center gap-6 mb-16">
                <Link
                  href={ROUTES.REGISTER}
                  className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 text-base font-bold bg-blue-600 text-[var(--color-text-base)] rounded-xl shadow-xl shadow-blue-500/20 hover:bg-blue-700 hover:-translate-y-0.5 transition-all gap-2"
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
              <div className="flex flex-wrap items-center gap-x-12 gap-y-6 text-slate-400">
                <div className="flex flex-col">
                  <span className="text-slate-900 font-bold text-lg">
                    10,000+
                  </span>
                  <span className="text-[10px] uppercase tracking-widest font-bold">
                    Tasks Tracked
                  </span>
                </div>
                <div className="w-px h-8 bg-slate-100 hidden sm:block" />
                <div className="flex flex-col">
                  <span className="text-slate-900 font-bold text-lg">
                    99.9%
                  </span>
                  <span className="text-[10px] uppercase tracking-widest font-bold">
                    Uptime SLA
                  </span>
                </div>
                <div className="w-px h-8 bg-slate-100 hidden sm:block" />
                <div className="flex flex-col">
                  <span className="text-slate-900 font-bold text-lg">
                    &lt;2s
                  </span>
                  <span className="text-[10px] uppercase tracking-widest font-bold">
                    Avg. API Response
                  </span>
                </div>
              </div>
            </ScrollReveal>
          </div>

          {/* Right Column: Media */}
          <div className="relative">
            <ScrollReveal delay={200} className="relative z-10">
              <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-slate-200">
                <Image
                  src="/images/hero_field_compliance.png"
                  alt="Field Compliance Professional"
                  width={800}
                  height={600}
                  className="w-full h-auto transform object-cover transition-transform duration-700 hover:scale-105"
                  onLoadingComplete={() =>
                    console.log(
                      '[ASSET:DEBUG] Hero image loaded successfully: /images/hero_field_compliance.png'
                    )
                  }
                  onError={() =>
                    console.error(
                      '[ASSET:ERROR] Hero image failed to load: /images/hero_field_compliance.png'
                    )
                  }
                />
                {/* Visual Accent */}
                <div className="absolute inset-0 bg-gradient-to-t from-blue-600/10 to-transparent pointer-events-none" />
              </div>

              {/* Floating Element 1 */}
              <div className="absolute -top-6 -left-6 bg-white p-4 rounded-2xl shadow-xl border border-slate-100 hidden xl:block animate-slide-up">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-bold text-xs uppercase tracking-widest">
                    ✔
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 uppercase tracking-widest leading-none mb-1">
                      Identity Verified
                    </div>
                    <div className="text-[10px] text-slate-500 font-medium leading-none">
                      Forensic ID Match: 99.8%
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating Element 2 */}
              <div className="absolute -bottom-8 -right-8 bg-white p-6 rounded-2xl shadow-xl border border-slate-100 hidden xl:block animate-slide-down reveal-delay-300">
                <div className="space-y-3">
                  <div className="text-xs font-bold text-slate-900 uppercase tracking-widest flex items-center gap-2">
                    <span className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" />
                    Live Audit Stream
                  </div>
                  <div className="flex gap-1.5">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div
                        key={i}
                        className="w-6 h-1 bg-slate-100 rounded-full overflow-hidden"
                      >
                        <div
                          className="w-full h-full bg-blue-600 animate-grow"
                          style={{ animationDelay: `${i * 0.4}s` }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </div>
    </section>
  );
}
