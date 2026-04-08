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
  Unplug,
  Server,
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
      name: 'Integrations',
      href: `/${orgSlug}/settings/integrations`,
      icon: Unplug,
    },
    {
      name: 'Infrastructure',
      href: `/${orgSlug}/settings/infra`,
      icon: Server,
    },
    {
      name: 'Audit Log',
      href: `/${orgSlug}/settings/audit`,
      icon: History,
    },
    {
      name: 'Billing',
      href: `/${orgSlug}/settings/billing`,
      icon: Layers, // Placeholder icon, will use CreditCard if available
    },
  ];

  return (
    <div className="flex flex-col md:flex-row gap-8">
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 flex-shrink-0">
        <div className="card-surface overflow-hidden">
          <div className="p-4 border-b border-[var(--color-border-base)] bg-[var(--color-surface-soft)]">
            <h2 className="text-sm font-bold text-[var(--color-text-base)] uppercase tracking-tight">
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
                      ? 'bg-primary-500/10 text-[var(--color-accent-base)]'
                      : 'text-[var(--color-text-subtle)] hover:bg-[var(--color-surface-soft)] hover:text-[var(--color-text-base)]'
                  )}
                >
                  <Icon
                    className={cn(
                      'h-4 w-4 transition-colors',
                      isActive
                        ? 'text-[var(--color-accent-base)]'
                        : 'text-[var(--color-text-muted)] group-hover:text-[var(--color-text-base)]'
                    )}
                  />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Support Card */}
        <div className="mt-6 p-4 bg-[var(--color-accent-base)] rounded-2xl text-[var(--color-text-base)] shadow-lg shadow-[var(--color-accent-base)]/20">
          <h3 className="font-bold text-sm mb-1">Need help?</h3>
          <p className="text-xs text-[var(--color-text-base)]/80 mb-4">
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
