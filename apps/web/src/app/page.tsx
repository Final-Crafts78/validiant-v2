/**
 * Home/Landing Page
 *
 * Enterprise Corporate Light Theme — Validiant
 * Preserves existing auth redirect logic and ROUTES.
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ShieldCheck,
  Target,
  FileText,
  Lock,
  BarChart2,
  Zap,
  CheckCircle,
  Loader2,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import { ROUTES } from '@/lib/config';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface ContactForm {
  name: string;
  email: string;
  company: string;
  phone: string;
  message: string;
}

// ---------------------------------------------------------------------------
// Feature card data
// ---------------------------------------------------------------------------
const CAPABILITIES = [
  {
    icon: ShieldCheck,
    title: 'Identity & KYC Verification',
    description:
      'Automated background checks and real-time credential validation for every stakeholder.',
  },
  {
    icon: Target,
    title: 'Precision Workflow Tracking',
    description:
      'Monitor task progression and team velocity with immutable, tamper-proof audit logs.',
  },
  {
    icon: FileText,
    title: 'Automated Compliance',
    description:
      'Generate audit-ready reports and maintain strict regulatory adherence across all jurisdictions.',
  },
  {
    icon: Lock,
    title: 'Role-Based Access Control',
    description:
      'Granular enterprise permissions ensure sensitive data is strictly siloed by function and region.',
  },
  {
    icon: BarChart2,
    title: 'Actionable Intelligence',
    description:
      'Transform raw operational data into strategic dashboards that leadership can act on immediately.',
  },
  {
    icon: Zap,
    title: 'Process Automation',
    description:
      'Streamline repetitive verifications and approval workflows to eliminate manual bottlenecks.',
  },
];

// ---------------------------------------------------------------------------
// Home Page Component
// ---------------------------------------------------------------------------
export default function HomePage() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isLoading = useAuthStore((state) => state.isLoading);

  // -- Lead capture form state --
  const [form, setForm] = useState<ContactForm>({
    name: '',
    email: '',
    company: '',
    phone: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push(ROUTES.DASHBOARD);
    }
  }, [isAuthenticated, isLoading, router]);

  // Show loading while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="spinner spinner-lg text-primary-600" />
      </div>
    );
  }

  // -- Form handlers --
  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (error) setError(null);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(
          (data as { message?: string }).message ||
            'Something went wrong. Please try again.'
        );
      }

      setIsSuccess(true);
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : 'Something went wrong. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-white font-sans antialiased">

      {/* ===================================================================
          NAVIGATION — Sticky Top Bar
      =================================================================== */}
      <header className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center shadow-sm">
              <ShieldCheck className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900">
              Validiant
            </span>
          </div>

          {/* Nav actions */}
          <nav className="flex items-center gap-3">
            <Link
              href={ROUTES.LOGIN}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 rounded-md transition-colors"
            >
              Sign In
            </Link>
            <Link
              href={ROUTES.REGISTER}
              className="px-5 py-2 text-sm font-semibold bg-blue-600 text-white rounded-md shadow-sm hover:bg-blue-700 transition-colors"
            >
              Client Portal
            </Link>
          </nav>
        </div>
      </header>

      {/* ===================================================================
          SECTION 1 — Hero Funnel
      =================================================================== */}
      <section className="relative bg-white overflow-hidden">
        {/* Subtle grid background */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              'linear-gradient(to bottom, rgba(241,245,249,0.6) 1px, transparent 1px), linear-gradient(to right, rgba(241,245,249,0.6) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />
        <div className="relative max-w-4xl mx-auto px-6 py-28 lg:py-40 text-center">
          {/* Eyebrow Badge */}
          <span className="inline-block mb-6 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-blue-600 bg-blue-50 border border-blue-100 rounded-full">
            Enterprise Workflow &amp; Identity Verification
          </span>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 leading-tight mb-6">
            Verify Performance.{' '}
            <span className="text-blue-600">Ensure Compliance.</span>{' '}
            Accelerate Growth.
          </h1>

          {/* Sub-headline */}
          <p className="text-lg sm:text-xl text-slate-500 max-w-2xl mx-auto mb-10 leading-relaxed">
            The enterprise standard for background verification, operational
            compliance, and precision tracking. Build a foundation of absolute
            trust.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="#request-demo"
              className="inline-flex items-center justify-center px-7 py-3.5 text-sm font-semibold bg-blue-600 text-white rounded-md shadow-md hover:bg-blue-700 transition-colors"
            >
              Request Enterprise Demo
            </a>
            <Link
              href={ROUTES.REGISTER}
              className="inline-flex items-center justify-center px-7 py-3.5 text-sm font-semibold text-blue-600 border border-blue-300 bg-white rounded-md hover:bg-blue-50 transition-colors"
            >
              Start Free Trial
            </Link>
          </div>
        </div>
      </section>

      {/* ===================================================================
          SECTION 2 — Social Proof & Trust Band
      =================================================================== */}
      <section className="bg-slate-50 border-y border-slate-200">
        <div className="max-w-5xl mx-auto px-6 py-10 flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-12 text-center">
          <div className="flex items-center gap-2 text-slate-400">
            <ShieldCheck className="h-5 w-5 text-slate-400" />
            <span className="text-sm font-medium text-slate-500">
              SOC 2 Type II Certified
            </span>
          </div>
          <div className="hidden sm:block w-px h-5 bg-slate-300" />
          <div className="flex items-center gap-2 text-slate-400">
            <Lock className="h-5 w-5 text-slate-400" />
            <span className="text-sm font-medium text-slate-500">
              ISO 27001 Aligned
            </span>
          </div>
          <div className="hidden sm:block w-px h-5 bg-slate-300" />
          <div className="flex items-center gap-2 text-slate-400">
            <FileText className="h-5 w-5 text-slate-400" />
            <span className="text-sm font-medium text-slate-500">
              GDPR &amp; Data Privacy Ready
            </span>
          </div>
          <div className="hidden sm:block w-px h-5 bg-slate-300" />
          <p className="text-sm font-medium text-slate-500">
            Trusted by compliance-first organizations globally.
          </p>
        </div>
      </section>

      {/* ===================================================================
          SECTION 3 — Enterprise Capabilities (6-Grid)
      =================================================================== */}
      <section className="bg-white py-24">
        <div className="max-w-7xl mx-auto px-6">
          {/* Section header */}
          <div className="max-w-2xl mb-14">
            <span className="text-xs font-semibold uppercase tracking-widest text-blue-600">
              Platform Capabilities
            </span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-extrabold text-slate-900 leading-snug">
              Built for every layer of your compliance stack.
            </h2>
            <p className="mt-4 text-base text-slate-500 leading-relaxed">
              From identity verification to automated reporting, Validiant
              consolidates your critical enterprise workflows into a single,
              auditable platform.
            </p>
          </div>

          {/* 3×2 Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {CAPABILITIES.map(({ icon: Icon, title, description }) => (
              <div
                key={title}
                className="bg-white border border-slate-200 rounded-xl p-7 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="w-11 h-11 bg-blue-50 rounded-lg flex items-center justify-center mb-5">
                  <Icon className="h-5 w-5 text-blue-600" />
                </div>
                <h3 className="text-base font-semibold text-slate-900 mb-2">
                  {title}
                </h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  {description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===================================================================
          SECTION 4 — Lead Capture / Request Demo Form
      =================================================================== */}
      <section id="request-demo" className="bg-slate-50 py-24 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

            {/* Left — Copy */}
            <div>
              <span className="text-xs font-semibold uppercase tracking-widest text-blue-600">
                Request a Demo
              </span>
              <h2 className="mt-3 text-3xl sm:text-4xl font-extrabold text-slate-900 leading-snug">
                Modernize your operations.{' '}
                <span className="text-blue-600">
                  Speak with our enterprise architects.
                </span>
              </h2>
              <p className="mt-5 text-base text-slate-500 leading-relaxed">
                Our solutions team will walk you through a tailored demo of
                Validiant — designed around your industry, compliance framework,
                and team size.
              </p>

              <ul className="mt-8 space-y-4">
                {[
                  'Personalized 30-minute live walkthrough',
                  'Compliance gap analysis at no cost',
                  'Custom onboarding and integration roadmap',
                  'Dedicated enterprise success manager',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
                    <span className="text-sm text-slate-600">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Right — Form Card */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-md p-8">
              {isSuccess ? (
                /* Success state */
                <div className="flex flex-col items-center justify-center text-center py-12 gap-4">
                  <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center">
                    <CheckCircle className="h-8 w-8 text-emerald-500" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">
                    Request Received
                  </h3>
                  <p className="text-sm text-slate-500 max-w-xs">
                    Thank you! Our enterprise team will reach out within one
                    business day to schedule your demo.
                  </p>
                </div>
              ) : (
                /* Contact form */
                <form onSubmit={handleSubmit} noValidate className="space-y-5">
                  <h3 className="text-lg font-bold text-slate-900 mb-1">
                    Get in touch
                  </h3>

                  {/* Error banner */}
                  {error && (
                    <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                      {error}
                    </div>
                  )}

                  {/* Name */}
                  <div>
                    <label
                      htmlFor="name"
                      className="block text-xs font-semibold text-slate-700 mb-1.5"
                    >
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="name"
                      name="name"
                      type="text"
                      required
                      value={form.name}
                      onChange={handleChange}
                      placeholder="Jane Doe"
                      className="w-full px-3.5 py-2.5 text-sm text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-slate-400 transition"
                    />
                  </div>

                  {/* Work Email */}
                  <div>
                    <label
                      htmlFor="email"
                      className="block text-xs font-semibold text-slate-700 mb-1.5"
                    >
                      Work Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      required
                      value={form.email}
                      onChange={handleChange}
                      placeholder="jane@company.com"
                      className="w-full px-3.5 py-2.5 text-sm text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-slate-400 transition"
                    />
                  </div>

                  {/* Company */}
                  <div>
                    <label
                      htmlFor="company"
                      className="block text-xs font-semibold text-slate-700 mb-1.5"
                    >
                      Company <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="company"
                      name="company"
                      type="text"
                      required
                      value={form.company}
                      onChange={handleChange}
                      placeholder="Acme Corporation"
                      className="w-full px-3.5 py-2.5 text-sm text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-slate-400 transition"
                    />
                  </div>

                  {/* Phone */}
                  <div>
                    <label
                      htmlFor="phone"
                      className="block text-xs font-semibold text-slate-700 mb-1.5"
                    >
                      Phone Number
                    </label>
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={form.phone}
                      onChange={handleChange}
                      placeholder="+91 98765 43210"
                      className="w-full px-3.5 py-2.5 text-sm text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-slate-400 transition"
                    />
                  </div>

                  {/* Message */}
                  <div>
                    <label
                      htmlFor="message"
                      className="block text-xs font-semibold text-slate-700 mb-1.5"
                    >
                      Message
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      rows={4}
                      value={form.message}
                      onChange={handleChange}
                      placeholder="Tell us about your use case or compliance requirements..."
                      className="w-full px-3.5 py-2.5 text-sm text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-slate-400 transition resize-none"
                    />
                  </div>

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold bg-blue-600 text-white rounded-lg shadow-sm hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Submitting…
                      </>
                    ) : (
                      'Request Enterprise Demo'
                    )}
                  </button>

                  <p className="text-xs text-slate-400 text-center pt-1">
                    We respect your privacy. No spam, ever.
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================================
          SECTION 5 — Enterprise Footer
      =================================================================== */}
      <footer className="bg-white border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-10 flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Brand */}
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-blue-600 rounded-md flex items-center justify-center">
              <ShieldCheck className="h-4 w-4 text-white" />
            </div>
            <span className="text-sm font-bold text-slate-900">Validiant</span>
          </div>

          {/* Links */}
          <nav className="flex flex-wrap items-center justify-center gap-5">
            {[
              { label: 'Privacy Policy', href: '/privacy' },
              { label: 'Terms of Service', href: '/terms' },
              { label: 'Security', href: '/security' },
              { label: 'Contact', href: '#request-demo' },
            ].map(({ label, href }) => (
              <a
                key={label}
                href={href}
                className="text-xs text-slate-500 hover:text-slate-800 transition-colors"
              >
                {label}
              </a>
            ))}
          </nav>

          {/* Copyright */}
          <p className="text-xs text-slate-400">
            &copy; {new Date().getFullYear()} Validiant. All rights reserved.
          </p>
        </div>
      </footer>

    </div>
  );
}
