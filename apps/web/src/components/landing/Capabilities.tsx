'use client';

import { 
  ShieldCheck, 
  Target, 
  FileText, 
  Lock, 
  BarChart2, 
  Zap, 
  Users, 
  Smartphone,
  ArrowRight
} from 'lucide-react';

const CAPABILITIES = [
  {
    icon: ShieldCheck,
    title: 'Identity & KYC Verification',
    description: 'Automated background checks and real-time credential validation for every stakeholder.',
  },
  {
    icon: Target,
    title: 'Precision Workflow Tracking',
    description: 'Monitor task progression and team velocity with immutable, tamper-proof audit logs.',
  },
  {
    icon: FileText,
    title: 'Automated Compliance',
    description: 'Generate audit-ready reports and maintain strict regulatory adherence across all jurisdictions.',
  },
  {
    icon: Lock,
    title: 'Role-Based Access Control',
    description: 'Granular enterprise permissions ensure sensitive data is strictly siloed by function and region.',
  },
  {
    icon: BarChart2,
    title: 'Actionable Intelligence',
    description: 'Transform raw operational data into strategic dashboards that leadership can act on immediately.',
  },
  {
    icon: Zap,
    title: 'Process Automation',
    description: 'Streamline repetitive verifications and approval workflows to eliminate manual bottlenecks.',
  },
  {
    icon: Users,
    title: 'Real-Time Collaboration',
    description: 'Live multi-user sync powered by PartyKit. Coordinate field teams with zero latency.',
  },
  {
    icon: Smartphone,
    title: 'Mobile Field App',
    description: 'Native React Native app with offline support, biometric security, and GPS-tagged capture.',
  },
];

export default function Capabilities() {
  return (
    <section id="features" className="bg-white py-32 scroll-mt-20">
      <div className="max-w-7xl mx-auto px-6">
        {/* Section header */}
        <div className="max-w-3xl mb-16">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-600">
            Platform Capabilities
          </span>
          <h2 className="mt-4 text-4xl font-extrabold text-slate-900 leading-tight">
            Built for every layer of your <br className="hidden md:block" /> compliance stack.
          </h2>
          <p className="mt-6 text-lg text-slate-500 leading-relaxed">
            Validiant consolidates your identity verification, field operations, and 
            regulatory reporting into a single, forensic-locked audit chain.
          </p>
        </div>

        {/* 2×4 Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {CAPABILITIES.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="group bg-white border border-slate-200 rounded-2xl p-8 shadow-sm hover:shadow-xl hover:shadow-blue-500/5 hover:-translate-y-1 transition-all duration-300 flex flex-col"
            >
              <div className="w-12 h-12 bg-blue-50 group-hover:bg-blue-600 rounded-xl flex items-center justify-center mb-6 transition-colors duration-300">
                <Icon className="h-6 w-6 text-blue-600 group-hover:text-white transition-colors duration-300" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-3">
                {title}
              </h3>
              <p className="text-sm text-slate-500 leading-relaxed mb-6 flex-1">
                {description}
              </p>
              <a href="#how-it-works" className="text-xs font-bold text-blue-600 flex items-center gap-1.5 group-hover:gap-2.5 transition-all">
                Learn more <ArrowRight size={14} />
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
