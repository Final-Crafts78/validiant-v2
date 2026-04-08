'use client';

import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import ScrollReveal from '@/components/ui/ScrollReveal';

const STEPS = [
  {
    title: 'Deploy Digital Infrastructure',
    description:
      'Instantly provision a private compliance workspace. Define your specific protocols, KYC requirements, and field verification rules using our rule-builder.',
    image: '/images/dashboard_iso.png',
  },
  {
    title: 'Coordinate Field Executives',
    description:
      'Dispatch tasks directly to your mobile workforce. Our field app provides real-time GPS tracking, biometric capture, and offline-first data synchronization.',
    image: '/images/field_app_iso.png',
  },
  {
    title: 'Immutable Audit Finality',
    description:
      'Every interaction is hashed and chained. Generate tamper-proof reports for stakeholders and regulators that prove absolute forensic compliance.',
    image: '/images/dashboard_iso.png', // Reusing dashboard for audit visualization
  },
];

export default function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="bg-slate-50 py-32 lg:py-48 scroll-mt-20 overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-6">
        <ScrollReveal className="max-w-3xl mb-24">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-600">
            The Validiant Workflow
          </span>
          <h2 className="mt-4 text-4xl md:text-6xl font-extrabold text-slate-900 leading-tight">
            How we deliver absolute <br className="hidden md:block" /> forensic
            certainty.
          </h2>
        </ScrollReveal>

        <div className="space-y-40">
          {STEPS.map((step, index) => (
            <div
              key={step.title}
              className={`flex flex-col ${
                index % 2 === 1 ? 'lg:flex-row-reverse' : 'lg:flex-row'
              } gap-20 items-center`}
            >
              {/* Image side */}
              <ScrollReveal
                delay={200}
                className="flex-1 w-full relative group"
              >
                {/* Decorative blob */}
                <div className="absolute -z-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[110%] h-[110%] bg-blue-100 rounded-full blur-[80px] opacity-40 group-hover:opacity-60 transition-opacity duration-500" />

                <div className="relative overflow-hidden rounded-[2.5rem] border border-slate-200 bg-white shadow-2xl p-4 lg:p-8 hover:-translate-y-2 transition-transform duration-500">
                  <Image
                    src={step.image}
                    alt={step.title}
                    width={800}
                    height={600}
                    className="w-full h-auto object-contain"
                    onLoadingComplete={() =>
                      console.log(`[ASSET:DEBUG] Success loading ${step.image}`)
                    }
                    onError={() =>
                      console.error(
                        `[ASSET:ERROR] Failed loading ${step.image}`
                      )
                    }
                  />
                </div>
              </ScrollReveal>

              {/* Text side */}
              <ScrollReveal
                delay={400}
                className="flex-1 flex flex-col items-center lg:items-start text-center lg:text-left"
              >
                <div className="w-16 h-16 bg-blue-600 text-[var(--color-text-base)] flex items-center justify-center rounded-2xl text-2xl font-black mb-10 shadow-lg shadow-blue-600/30">
                  0{index + 1}
                </div>
                <h3 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-8 max-w-md">
                  {step.title}
                </h3>
                <p className="text-xl text-slate-500 leading-relaxed mb-10 max-w-xl">
                  {step.description}
                </p>
                <a
                  href="#request-demo"
                  className="inline-flex items-center gap-3 text-base font-bold text-blue-600 hover:gap-4 transition-all"
                >
                  Explore the technology <ArrowRight size={20} />
                </a>
              </ScrollReveal>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
