'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShieldCheck, X, ArrowRight } from 'lucide-react';
import { ROUTES } from '@/lib/config';

export default function Navbar() {
  const [showAnnouncement, setShowAnnouncement] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="fixed top-0 left-0 right-0 z-50">
      {showAnnouncement && (
        <div className="bg-blue-600 text-[var(--color-text-base)] px-4 py-2 text-center text-xs font-medium flex items-center justify-center relative">
          <span>Now with AI-powered task routing →</span>
          <button
            onClick={() => setShowAnnouncement(false)}
            className="absolute right-4 hover:opacity-70 transition-opacity"
          >
            <X size={14} />
          </button>
        </div>
      )}
      <header
        className={`transition-all duration-300 border-b ${
          isScrolled
            ? 'bg-white/90 backdrop-blur-md border-slate-200 shadow-md py-3'
            : 'bg-white/50 backdrop-blur-sm border-transparent py-4'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2.5 hover:opacity-90 transition-opacity"
          >
            <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center shadow-sm">
              <ShieldCheck className="h-5 w-5 text-[var(--color-text-base)]" />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900">
              Validiant
            </span>
          </Link>

          {/* Nav links */}
          <nav className="hidden md:flex items-center gap-8">
            <a
              href="#features"
              className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors"
            >
              Features
            </a>
            <a
              href="#how-it-works"
              className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors"
            >
              How it Works
            </a>
            <a
              href="#pricing"
              className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors"
            >
              Pricing
            </a>
            <a
              href="#faq"
              className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors"
            >
              FAQ
            </a>
          </nav>

          {/* Nav actions */}
          <div className="flex items-center gap-3">
            <Link
              href={ROUTES.LOGIN}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 rounded-md transition-colors"
            >
              Sign In
            </Link>
            <Link
              href={ROUTES.REGISTER}
              className="px-5 py-2 text-sm font-semibold bg-blue-600 text-[var(--color-text-base)] rounded-md shadow-sm hover:bg-blue-700 transition-all flex items-center gap-2"
            >
              Client Portal
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </header>
    </div>
  );
}
