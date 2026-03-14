'use client';

import React from 'react';
import Link from 'next/link';
import { useParams, usePathname } from 'next/navigation';
import {
  Settings as SettingsIcon,
  Palette,
  Users,
  ShieldCheck,
  Layers,
  History,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { orgSlug } = useParams() as { orgSlug: string };

  const settingsNav = [
    {
      name: 'General',
      href: `/${orgSlug}/settings/general`,
      icon: SettingsIcon,
    },
    {
      name: 'Branding',
      href: `/${orgSlug}/settings/branding`,
      icon: Palette,
    },
    {
      name: 'Members',
      href: `/${orgSlug}/settings/members`,
      icon: Users,
    },
    {
      name: 'Roles',
      href: `/${orgSlug}/settings/roles`,
      icon: ShieldCheck,
    },
    {
      name: 'Case Config',
      href: `/${orgSlug}/settings/config`,
      icon: Layers,
    },
    {
      name: 'Audit Log',
      href: `/${orgSlug}/settings/audit`,
      icon: History,
    },
  ];

  return (
    <div className="flex flex-col md:flex-row gap-8">
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 flex-shrink-0">
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-tight">
              Organization Settings
            </h2>
          </div>
          <nav className="p-2 space-y-1">
            {settingsNav.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group',
                    isActive
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  )}
                >
                  <Icon
                    className={cn(
                      'h-4 w-4 transition-colors',
                      isActive
                        ? 'text-primary-600'
                        : 'text-slate-400 group-hover:text-slate-600'
                    )}
                  />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Support Card */}
        <div className="mt-6 p-4 bg-primary-600 rounded-2xl text-white shadow-lg shadow-primary-200">
          <h3 className="font-bold text-sm mb-1">Need help?</h3>
          <p className="text-xs text-primary-100 mb-4">
            Check our documentation or contact enterprise support.
          </p>
          <button className="w-full py-2 bg-white/20 hover:bg-white/30 rounded-lg text-xs font-bold transition-all backdrop-blur-sm">
            Support Center
          </button>
        </div>
      </aside>

      {/* Main Settings Content */}
      <section className="flex-1 min-w-0">{children}</section>
    </div>
  );
}
