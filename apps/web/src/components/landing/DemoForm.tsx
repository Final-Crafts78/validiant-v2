'use client';

import { useState } from 'react';
import { CheckCircle, Loader2, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { ROUTES } from '@/lib/config';
import ScrollReveal from '@/components/ui/ScrollReveal';

interface ContactForm {
  name: string;
  email: string;
  company: string;
  phone: string;
  message: string;
}

export default function DemoForm() {
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

  return (
    <section
      id="request-demo"
      className="bg-white py-32 lg:py-48 border-t border-slate-100 overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          {/* Left — Copy */}
          <ScrollReveal>
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-600">
              Request a Demo
            </span>
            <h2 className="mt-4 text-4xl lg:text-6xl font-extrabold text-slate-900 leading-tight">
              Talk to an{' '}
              <span className="text-blue-600">Enterprise Architect</span>
            </h2>
            <p className="mt-8 text-xl text-slate-500 leading-relaxed mb-10 max-w-xl">
              Our experts will help you design a field compliance workflow
              tailored to your specific industry regulations and team structure.
            </p>

            <ul className="space-y-6 mb-12">
              {[
                'Personalized 30-minute live walkthrough',
                'Compliance gap analysis at no cost',
                'Custom onboarding and integration roadmap',
                'Dedicated enterprise success manager',
              ].map((item) => (
                <li key={item} className="flex items-start gap-4">
                  <div className="mt-1 bg-blue-50 p-1 rounded-md">
                    <CheckCircle className="h-5 w-5 text-blue-600 shrink-0" />
                  </div>
                  <span className="text-base text-slate-600 font-bold">
                    {item ?? ''}
                  </span>
                </li>
              ))}
            </ul>

            <div className="flex items-center gap-6">
              <Link
                href={ROUTES.REGISTER}
                className="flex items-center justify-center gap-2 group text-blue-600 font-bold border-b-2 border-transparent hover:border-blue-600 transition-all pb-1"
              >
                Sign up free{' '}
                <ArrowRight
                  size={18}
                  className="group-hover:translate-x-1 transition-transform"
                />
              </Link>
            </div>
          </ScrollReveal>

          {/* Right — Form Card */}
          <ScrollReveal delay={200} className="relative">
            {/* Background blobs for depth */}
            <div className="absolute -z-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-blue-50/50 rounded-full blur-3xl" />

            <div className="bg-white border border-slate-200 rounded-[3rem] shadow-2xl shadow-blue-500/10 p-10 lg:p-14 relative z-10">
              {isSuccess ? (
                <div className="flex flex-col items-center justify-center text-center py-16 gap-6 animate-fadeInUp">
                  <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="h-10 w-10 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-slate-900 mb-2">
                      Request Received
                    </h3>
                    <p className="text-slate-500 font-medium max-w-xs">
                      Our enterprise team will reach out within one business day
                      to schedule your demo.
                    </p>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} noValidate className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label
                        htmlFor="name"
                        className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-1"
                      >
                        Full Name
                      </label>
                      <input
                        id="name"
                        name="name"
                        type="text"
                        required
                        value={form.name}
                        onChange={handleChange}
                        placeholder="Jane Doe"
                        className="w-full px-5 py-4 text-sm bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all placeholder:text-slate-300"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="email"
                        className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-1"
                      >
                        Work Email
                      </label>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        required
                        value={form.email}
                        onChange={handleChange}
                        placeholder="jane@company.com"
                        className="w-full px-5 py-4 text-sm bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all placeholder:text-slate-300"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label
                        htmlFor="company"
                        className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-1"
                      >
                        Company
                      </label>
                      <input
                        id="company"
                        name="company"
                        type="text"
                        required
                        value={form.company}
                        onChange={handleChange}
                        placeholder="Acme Inc."
                        className="w-full px-5 py-4 text-sm bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all placeholder:text-slate-300"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="phone"
                        className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-1"
                      >
                        Phone
                      </label>
                      <input
                        id="phone"
                        name="phone"
                        type="tel"
                        value={form.phone}
                        onChange={handleChange}
                        placeholder="+1 (555) 000-0000"
                        className="w-full px-5 py-4 text-sm bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all placeholder:text-slate-300"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="message"
                      className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-1"
                    >
                      Requirements
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      rows={4}
                      value={form.message}
                      onChange={handleChange}
                      placeholder="Tell us about your field operations..."
                      className="w-full px-5 py-4 text-sm bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all placeholder:text-slate-300 resize-none"
                    />
                  </div>

                  {error && (
                    <p className="text-red-500 text-xs font-bold ml-1">
                      {error}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-5 bg-blue-600 text-white font-black uppercase tracking-widest text-xs rounded-2xl shadow-xl shadow-blue-500/30 hover:bg-blue-700 hover:-translate-y-0.5 disabled:opacity-50 transition-all flex items-center justify-center gap-3"
                  >
                    {isSubmitting ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      'Request Enterprise Demo'
                    )}
                  </button>
                </form>
              )}
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}
