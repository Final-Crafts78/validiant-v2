'use client';

import { ShieldCheck } from 'lucide-react';
import Link from 'next/link';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white border-t border-slate-100 pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-20">
          {/* Brand Column */}
          <div className="space-y-6">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-sm">
                <ShieldCheck className="h-4 w-4 text-white" />
              </div>
              <span className="text-lg font-bold tracking-tight text-slate-900">
                Validiant
              </span>
            </Link>
            <p className="text-sm text-slate-500 font-medium leading-relaxed">
              The operating system for field compliance teams. Accelerate growth through absolute trust.
            </p>
            <p className="text-xs text-slate-400">
              © {currentYear} Validiant Inc. <br /> All rights reserved.
            </p>
          </div>

          {/* Product Column */}
          <div>
            <h4 className="text-xs font-black uppercase tracking-[0.2em] text-slate-900 mb-6">Product</h4>
            <nav className="flex flex-col gap-4">
              <a href="#features" className="text-sm font-medium text-slate-500 hover:text-blue-600 transition-colors">Features</a>
              <a href="#how-it-works" className="text-sm font-medium text-slate-500 hover:text-blue-600 transition-colors">How it Works</a>
              <a href="#pricing" className="text-sm font-medium text-slate-500 hover:text-blue-600 transition-colors">Pricing</a>
              <Link href="/changelog" className="text-sm font-medium text-slate-500 hover:text-blue-600 transition-colors">Changelog</Link>
            </nav>
          </div>

          {/* Company Column */}
          <div>
            <h4 className="text-xs font-black uppercase tracking-[0.2em] text-slate-900 mb-6">Company</h4>
            <nav className="flex flex-col gap-4">
              <Link href="/about" className="text-sm font-medium text-slate-500 hover:text-blue-600 transition-colors">About</Link>
              <Link href="/security" className="text-sm font-medium text-slate-500 hover:text-blue-600 transition-colors">Security</Link>
              <Link href="/privacy" className="text-sm font-medium text-slate-500 hover:text-blue-600 transition-colors">Privacy Policy</Link>
              <Link href="/terms" className="text-sm font-medium text-slate-500 hover:text-blue-600 transition-colors">Terms of Service</Link>
            </nav>
          </div>

          {/* Developers Column */}
          <div>
            <h4 className="text-xs font-black uppercase tracking-[0.2em] text-slate-900 mb-6">Developers</h4>
            <nav className="flex flex-col gap-4">
              <Link href="/docs" className="text-sm font-medium text-slate-500 hover:text-blue-600 transition-colors">API Docs</Link>
              <Link href="/status" className="text-sm font-medium text-slate-500 hover:text-blue-600 transition-colors">Status</Link>
              <a href="#request-demo" className="text-sm font-medium text-slate-500 hover:text-blue-600 transition-colors">Contact Support</a>
              <Link href="https://github.com" className="text-sm font-medium text-slate-500 hover:text-blue-600 transition-colors">GitHub</Link>
            </nav>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-50 flex flex-col md:flex-row items-center justify-between gap-6">
          <p className="text-[10px] uppercase font-bold tracking-[0.1em] text-slate-400">
            Built with ❤️ on Cloudflare Workers · Supabase · Next.js
          </p>
          <div className="flex items-center gap-6">
             <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
             <span className="text-[10px] font-black uppercase tracking-widest text-slate-900">System Status: Operational</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
