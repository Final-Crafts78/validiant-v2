'use client';

import { useOrganizations } from '@/hooks/useOrganizations';
import { Loader2, LayoutDashboard, Building } from 'lucide-react';
import Link from 'next/link';

export default function DashboardRedirect() {
  const { data: orgs, isLoading } = useOrganizations();

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[var(--color-surface-base)]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-[var(--color-accent-base)]" />
          <span className="text-sm font-bold uppercase tracking-widest text-[var(--color-text-muted)] animate-pulse">
            Loading Workspaces...
          </span>
        </div>
      </div>
    );
  }

  if (!orgs || orgs.length === 0) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[var(--color-surface-base)]">
        <Link 
          href="/dashboard/onboarding" 
          className="bg-[var(--color-accent-base)] text-[var(--color-text-base)] px-6 py-3 rounded-lg font-bold hover:opacity-90 transition-opacity"
        >
          Create Organization
        </Link>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-[var(--color-surface-base)] p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-[var(--color-accent-base)]/10 text-[var(--color-accent-base)] rounded-2xl flex items-center justify-center mx-auto mb-6">
            <LayoutDashboard className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-black text-[var(--color-text-base)] mb-3 tracking-tight">Select Workspace</h1>
          <p className="text-[var(--color-text-muted)] text-sm">Choose an organization to continue</p>
        </div>

        <div className="flex flex-col gap-3">
          {orgs.map((org) => (
            <Link 
              key={org.id} 
              href={`/${org.slug || org.id}/dashboard`}
              className="group flex items-center gap-4 p-4 rounded-2xl bg-[var(--color-surface-subtle)] border border-[var(--color-border-base)] hover:border-[var(--color-accent-base)] hover:shadow-lg transition-all text-left"
            >
              <div className="w-12 h-12 rounded-xl bg-[var(--color-surface-soft)] flex items-center justify-center group-hover:bg-[var(--color-accent-base)] transition-colors overflow-hidden">
                {org.logoUrl ? (
                  <img src={org.logoUrl} alt={org.name} className="w-full h-full object-cover" />
                ) : (
                  <Building className="w-6 h-6 text-[var(--color-text-muted)] group-hover:text-[var(--color-text-base)]" />
                )}
              </div>
              <div className="flex flex-col flex-1">
                <span className="font-bold text-[var(--color-text-base)] group-hover:text-[var(--color-accent-base)] transition-colors">
                  {org.name}
                </span>
                <span className="text-xs text-[var(--color-text-muted)] font-mono">
                  {org.slug || org.id}
                </span>
              </div>
              <div className="text-[var(--color-text-muted)] group-hover:text-[var(--color-accent-base)] transition-colors text-xl font-bold">
                &rarr;
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
