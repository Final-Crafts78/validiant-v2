'use client';

import ScrollReveal from '@/components/ui/ScrollReveal';

export default function TrustBand() {
  return (
    <section className="bg-slate-50 py-12 border-y border-slate-100 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        <ScrollReveal className="flex flex-col md:flex-row items-center justify-between gap-12">
          {/* Headline for Social Proof */}
          <div className="flex-shrink-0 text-center md:text-left">
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
              Trusted by forensic teams at
            </span>
          </div>

          {/* Marquee/Logo Cloud area */}
          <div className="flex flex-wrap items-center justify-center gap-x-16 gap-y-8 opacity-40 grayscale contrast-125">
            <div className="text-xl font-black tracking-tighter text-slate-900">
              CYBERDINE
            </div>
            <div className="text-xl font-black tracking-tighter text-slate-900 font-serif italic">
              Omni Consumer
            </div>
            <div className="text-xl font-black tracking-tighter text-slate-900">
              WEYLAND-YUTANI
            </div>
            <div className="text-xl font-black tracking-tighter text-slate-900 font-mono">
              Tyrell_Corp
            </div>
          </div>

          {/* Trust Quote */}
          <div className="hidden lg:block border-l border-slate-200 pl-12 max-w-[280px]">
            <p className="text-xs text-slate-500 italic leading-relaxed">
              &quot;The only platform we trust for multi-jurisdictional forensic
              identity chain of custody.&quot;
            </p>
            <p className="mt-2 text-[10px] font-bold uppercase tracking-widest text-slate-900">
              — Chief Compliance Officer
            </p>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
