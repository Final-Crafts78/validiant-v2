'use client';

import { ShieldCheck, Lock, FileText, CheckCircle, Shield } from 'lucide-react';

const TRUST_ITEMS = [
  { icon: ShieldCheck, label: 'SOC 2 Type II' },
  { icon: Shield, label: 'ISO 27001' },
  { icon: FileText, label: 'GDPR Ready' },
  { icon: Lock, label: 'WebAuthn Passkeys' },
  { icon: CheckCircle, label: '256-bit Encryption' },
  // Duplicate for seamless marquee
  { icon: ShieldCheck, label: 'SOC 2 Type II' },
  { icon: Shield, label: 'ISO 27001' },
  { icon: FileText, label: 'GDPR Ready' },
  { icon: Lock, label: 'WebAuthn Passkeys' },
  { icon: CheckCircle, label: '256-bit Encryption' },
];

export default function TrustBand() {
  return (
    <section className="bg-slate-50 border-y border-slate-200 overflow-hidden">
      {/* Logos Marquee */}
      <div className="py-12 relative flex">
        <div className="flex animate-marquee whitespace-nowrap gap-12 lg:gap-24 px-12 lg:px-24 items-center">
          {TRUST_ITEMS.map((item, idx) => (
            <div key={idx} className="flex items-center gap-3 grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all cursor-default">
              <item.icon className="h-5 w-5 text-slate-900" />
              <span className="text-sm font-bold tracking-tight text-slate-900">{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Quote */}
      <div className="max-w-4xl mx-auto px-6 pb-12 text-center">
        <div className="w-12 h-1 bg-blue-600 mx-auto mb-8 rounded-full" />
        <blockquote className="text-xl md:text-2xl font-medium text-slate-800 italic leading-relaxed mb-6">
          "Validiant cut our KYC processing time by 60%. It's the only tool 
          our compliance team trusts."
        </blockquote>
        <cite className="not-italic">
          <span className="block text-slate-900 font-bold">Head of Operations</span>
          <span className="text-sm text-slate-500 font-medium">Enterprise Client</span>
        </cite>
      </div>
    </section>
  );
}
