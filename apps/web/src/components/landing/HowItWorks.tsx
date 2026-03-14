'use client';

import { Users, ClipboardList, BarChart, ArrowRight } from 'lucide-react';

const STEPS = [
  {
    icon: Users,
    title: 'Onboard Your Organisation',
    description: 'Create your org, invite team members, configure roles and permissions in under 5 minutes.',
    cta: 'View role system',
  },
  {
    icon: ClipboardList,
    title: 'Assign & Track Field Tasks',
    description: 'Bulk import via CSV or create tasks with GPS-tagged addresses, KYC verification, and SLA deadlines.',
    cta: 'Explore task types',
  },
  {
    icon: BarChart,
    title: 'Monitor, Verify & Export',
    description: 'Real-time dashboard + tamper-proof audit chain + one-click compliance report PDF export.',
    cta: 'See report engine',
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-slate-50 py-32 scroll-mt-20">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center max-w-2xl mx-auto mb-20">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-600">
            Implementation Workflow
          </span>
          <h2 className="mt-4 text-4xl font-extrabold text-slate-900">
            From zero to auditable in minutes.
          </h2>
        </div>

        <div className="relative">
          {/* Vertical line connector (desktop) */}
          <div className="hidden lg:block absolute left-1/2 top-0 bottom-0 w-px bg-slate-200 -translate-x-1/2" />

          <div className="space-y-24 lg:space-y-32">
            {STEPS.map((step, idx) => (
              <div key={idx} className={`flex flex-col lg:flex-row items-center gap-12 lg:gap-24 ${idx % 2 !== 0 ? 'lg:flex-row-reverse' : ''}`}>
                {/* Visual side */}
                <div className="flex-1 flex justify-center">
                  <div className="relative">
                    <span className="text-[120px] font-black text-slate-100 absolute -top-20 -left-10 select-none">
                      0{idx + 1}
                    </span>
                    <div className="w-24 h-24 bg-white rounded-3xl shadow-xl shadow-blue-500/10 flex items-center justify-center relative z-10 border border-slate-100">
                      <step.icon size={40} className="text-blue-600" />
                    </div>
                  </div>
                </div>

                {/* Content side */}
                <div className="flex-1 text-center lg:text-left">
                  <h3 className="text-2xl font-bold text-slate-900 mb-4">{step.title}</h3>
                  <p className="text-lg text-slate-500 leading-relaxed mb-6">
                    {step.description}
                  </p>
                  <a href="#request-demo" className="inline-flex items-center gap-2 text-sm font-bold text-blue-600 hover:gap-3 transition-all">
                    {step.cta} <ArrowRight size={16} />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-24 text-center">
          <a
            href="#request-demo"
            className="inline-flex items-center justify-center px-10 py-5 text-lg font-bold bg-blue-600 text-white rounded-2xl shadow-xl shadow-blue-500/20 hover:bg-blue-700 hover:-translate-y-1 transition-all"
          >
            See it in action
          </a>
        </div>
      </div>
    </section>
  );
}
