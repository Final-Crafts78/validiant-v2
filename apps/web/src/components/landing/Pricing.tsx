'use client';

import { CheckCircle, ArrowRight } from 'lucide-react';
import { ROUTES } from '@/lib/config';
import Link from 'next/link';

const TIERS = [
  {
    name: 'Starter',
    price: 'Free',
    description: 'Solo or small teams, up to 3 projects.',
    features: ['Up to 10 field agents', 'Basic identity verification', 'Audit log basics', 'Standard support'],
    cta: 'Get Started',
    popular: false,
  },
  {
    name: 'Growth',
    price: '$29/mo',
    description: 'For scaling operations with unlimited projects.',
    features: ['Unlimited projects/KYC', 'Real-time PartyKit sync', 'Advanced audit chaining', 'Priority support'],
    cta: 'Start Free Trial',
    popular: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    description: 'Dedicated infrastructure and compliance controls.',
    features: ['SSO & SAML integration', 'SLA guarantees', 'Dedicated support', 'Custom report exports'],
    cta: 'Contact Sales',
    popular: false,
  },
];

export default function Pricing() {
  return (
    <section id="pricing" className="bg-white py-32 scroll-mt-20">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center max-w-2xl mx-auto mb-20">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-600">
            Enterprise Pricing
          </span>
          <h2 className="mt-4 text-4xl font-extrabold text-slate-900 leading-tight">
            Transparent plans for teams <br /> of all scales.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {TIERS.map((tier) => (
            <div 
              key={tier.name}
              className={`relative flex flex-col p-10 rounded-[2rem] border ${
                tier.popular 
                  ? 'border-blue-600 shadow-2xl shadow-blue-500/10' 
                  : 'border-slate-100 shadow-sm'
              }`}
            >
              {tier.popular && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-blue-600 text-white text-[10px] uppercase font-black tracking-widest px-4 py-1 rounded-full">
                  Most Popular
                </div>
              )}
              
              <div className="mb-8 text-center lg:text-left">
                <h3 className="text-xl font-bold text-slate-900 mb-2">{tier.name}</h3>
                <div className="flex items-baseline justify-center lg:justify-start gap-1">
                  <span className="text-4xl font-black text-slate-900">{tier.price}</span>
                  {tier.name === 'Growth' && <span className="text-slate-400 font-bold">/org</span>}
                </div>
                <p className="mt-4 text-sm text-slate-500 font-medium leading-relaxed">
                  {tier.description}
                </p>
              </div>

              <div className="flex-1 space-y-4 mb-10">
                {tier.features.map((feature) => (
                  <div key={feature} className="flex items-start gap-3">
                    <CheckCircle size={18} className="text-blue-600 shrink-0 mt-0.5" />
                    <span className="text-sm text-slate-600 font-medium">{feature}</span>
                  </div>
                ))}
              </div>

              <Link
                href={tier.cta === 'Contact Sales' ? '#request-demo' : ROUTES.REGISTER}
                className={`w-full py-4 text-center font-bold rounded-2xl transition-all flex items-center justify-center gap-2 ${
                  tier.popular
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30 hover:bg-blue-700'
                    : 'bg-slate-50 text-slate-900 hover:bg-slate-100'
                }`}
              >
                {tier.cta}
                <ArrowRight size={18} />
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
