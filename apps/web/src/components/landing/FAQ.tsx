'use client';

import { useState } from 'react';
import { Plus, Minus } from 'lucide-react';
import ScrollReveal from '@/components/ui/ScrollReveal';

const FAQS = [
  {
    q: 'What is Validiant?',
    a: 'Validiant is an enterprise-grade field compliance operating system that helps teams coordinate background verifications, KYC checks, and on-site tasks with forensic-level auditability.',
  },
  {
    q: 'How does KYC verification work?',
    a: 'Our platform automates identity checks through integrated data providers and biometric field capture, ensuring results are verified in real-time and stored in a tamper-proof audit chain.',
  },
  {
    q: 'Is my data secure?',
    a: 'Yes. Validiant uses AES-256 encryption at rest and TLS 1.3 in transit. We are SOC 2 Type II aligned and feature a cryptographic hash chain for all audit logs to prevent database tampering.',
  },
  {
    q: 'Can I use Validiant on mobile?',
    a: 'We provide a high-performance React Native application for field executives with offline-first synchronization, GPS-tagged media capture, and biometric unlock.',
  },
  {
    q: 'How does the audit log hash chain work?',
    a: 'Every action in the system generates a hash that includes the hash of the previous log entry. This creates an un-breakable chain of events guaranteed by SHA-256 cryptography.',
  },
  {
    q: "What's the difference between Starter and Enterprise?",
    a: 'Starter is for small teams to test the platform. Enterprise includes dedicated support, custom legal report exports, Saml/SSO integration, and guaranteed uptime SLAs.',
  },
];

function FAQItem({ q, a }: { q: string; a: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-slate-200 last:border-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-6 flex items-center justify-between text-left group transition-all"
      >
        <span className="text-lg font-bold text-slate-800 group-hover:text-blue-600 transition-colors pr-8">
          {q}
        </span>
        <div
          className={`p-2 rounded-full transition-all shrink-0 ${
            isOpen
              ? 'bg-blue-600 text-[var(--color-text-base)]'
              : 'bg-slate-50 text-slate-400 group-hover:bg-slate-100'
          }`}
        >
          {isOpen ? <Minus size={16} /> : <Plus size={16} />}
        </div>
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isOpen ? 'max-h-96 pb-6' : 'max-h-0'
        }`}
      >
        <p className="text-slate-500 leading-relaxed max-w-3xl font-medium">
          {a}
        </p>
      </div>
    </div>
  );
}

export default function FAQ() {
  return (
    <section
      id="faq"
      className="bg-slate-50 py-32 lg:py-48 scroll-mt-20 overflow-hidden"
    >
      <div className="max-w-4xl mx-auto px-6">
        <ScrollReveal className="text-center mb-20">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-600">
            Frequently Asked Questions
          </span>
          <h2 className="mt-4 text-4xl md:text-5xl font-extrabold text-slate-900">
            Common Inquiries
          </h2>
        </ScrollReveal>

        <ScrollReveal
          delay={200}
          className="bg-white rounded-[2.5rem] p-8 lg:p-16 shadow-2xl shadow-slate-200/50 border border-slate-200"
        >
          <div className="divide-y divide-slate-100">
            {FAQS.map((faq, idx) => (
              <FAQItem key={idx} q={faq.q} a={faq.a} />
            ))}
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
