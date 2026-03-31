'use client';

import React from 'react';
import {
  Shield,
  Bell,
  Globe,
  Zap,
  ChevronRight,
  Monitor,
  Moon,
  Sun,
  Layout,
} from 'lucide-react';
import { cn } from '@validiant/ui';

export default function GlobalSettingsPage() {
  const [activeTheme, setActiveTheme] = React.useState<
    'light' | 'dark' | 'system'
  >('system');

  return (
    <div className="max-w-5xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div>
        <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">
          System Preferences
        </h1>
        <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">
          Configure your global Validiant experience and infrastructure defaults
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
        {/* Sidebar Nav */}
        <div className="lg:col-span-1 space-y-2">
          {[
            { icon: Monitor, label: 'Appearance', active: true },
            { icon: Bell, label: 'Alerting', active: false },
            { icon: Globe, label: 'Regional', active: false },
            { icon: Shield, label: 'Access Control', active: false },
            { icon: Zap, label: 'Integrations', active: false },
          ].map((item) => (
            <button
              key={item.label}
              className={cn(
                'w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-black uppercase tracking-widest transition-all',
                item.active
                  ? 'bg-blue-600/10 text-blue-600 dark:bg-blue-600/20 dark:text-blue-400 shadow-sm'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900'
              )}
            >
              <div className="flex items-center gap-3">
                <item.icon className="w-4 h-4" />
                {item.label}
              </div>
              {item.active && <ChevronRight className="w-4 h-4 opacity-50" />}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="lg:col-span-3 space-y-8 pb-20">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-10 shadow-sm">
            <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight mb-8 pb-4 border-b border-slate-50 dark:border-slate-800/50">
              Interface Thematic
            </h3>

            <div className="grid grid-cols-3 gap-6">
              {[
                { id: 'light', label: 'Light', icon: Sun },
                { id: 'dark', label: 'Dark', icon: Moon },
                { id: 'system', label: 'System', icon: Layout },
              ].map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => setActiveTheme(theme.id as any)}
                  className={cn(
                    'flex flex-col items-center gap-3 p-6 rounded-3xl border-2 transition-all group',
                    activeTheme === theme.id
                      ? 'border-blue-600 bg-blue-600/5 dark:bg-blue-600/10'
                      : 'border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700'
                  )}
                >
                  <div
                    className={cn(
                      'p-4 rounded-2xl transition-all shadow-sm',
                      activeTheme === theme.id
                        ? 'bg-blue-600 text-white shadow-blue-600/20'
                        : 'bg-slate-50 dark:bg-slate-950 text-slate-400 group-hover:text-slate-600'
                    )}
                  >
                    <theme.icon className="w-6 h-6" />
                  </div>
                  <span
                    className={cn(
                      'text-[10px] font-black uppercase tracking-widest',
                      activeTheme === theme.id
                        ? 'text-blue-600 dark:text-blue-400'
                        : 'text-slate-400'
                    )}
                  >
                    {theme.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-10 shadow-sm">
            <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight mb-8 pb-4 border-b border-slate-50 dark:border-slate-800/50">
              Global Display Language
            </h3>

            <div className="space-y-4">
              <div className="relative">
                <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 pointer-events-none" />
                <select className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl px-12 py-4 text-sm font-bold text-slate-800 dark:text-slate-200 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all cursor-pointer">
                  <option value="en">English (United States) - Primary</option>
                  <option value="hi">हिन्दी (India)</option>
                </select>
              </div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest ml-1">
                Affects date formatting and system interface markers.
              </p>
            </div>
          </div>

          <div className="p-10 bg-gradient-to-br from-slate-900 to-slate-950 dark:from-slate-950 dark:to-black rounded-[2.5rem] text-white overflow-hidden relative group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full -mr-32 -mt-32 blur-3xl" />

            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-xl bg-blue-600 shadow-lg shadow-blue-600/30">
                  <Shield className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-black tracking-tight">
                  Security Hardening
                </h3>
              </div>
              <p className="text-sm font-medium text-slate-400 mb-8 max-w-lg">
                Manage session duration, concurrent device limits, and biometric
                authentication defaults for your global infrastructure layer.
              </p>
              <button className="px-6 py-3 bg-white text-slate-900 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-100 transition-all active:scale-95">
                Launch Security Tunnel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
