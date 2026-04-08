'use client';
/**
 * Organization Switcher
 *
 * Dropdown in the dashboard header/sidebar that lets users switch
 * between their organizations. Updates the workspace store.
 */

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useWorkspaceStore } from '@/store/workspace';
import { useOrganizations } from '@/hooks/useOrganizations';
import { Building2, ChevronDown, Check } from 'lucide-react';

interface LocalOrganization {
  id: string;
  name: string;
  slug?: string;
  industry?: string;
  logoUrl?: string;
}

export function OrgSwitcher() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const activeOrgId = useWorkspaceStore((s) => s.activeOrgId);
  const setActiveOrg = useWorkspaceStore((s) => s.setActiveOrg);

  // Fetch orgs client-side using the shared hook to avoid cache poisoning
  const { data: orgsData = [] } = useOrganizations();
  const orgs = orgsData as unknown as LocalOrganization[];
  const activeOrg = orgs.find((o) => o.id === activeOrgId);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      {/* Trigger Button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 px-3 py-2 text-sm font-black text-[var(--color-text-subtle)] bg-glass border border-[var(--color-border-base)] rounded-xl hover:bg-primary-50 dark:hover:bg-primary-950/20 transition-all shadow-sm group"
        id="org-switcher-trigger"
      >
        {activeOrg?.logoUrl ? (
          <img
            src={activeOrg.logoUrl}
            alt={activeOrg.name}
            className="w-5 h-5 rounded-md object-cover shrink-0"
          />
        ) : (
          <div className="w-5 h-5 rounded-md bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center shrink-0">
            <Building2 className="w-3 h-3 text-primary-600" />
          </div>
        )}
        <span className="truncate text-[var(--color-text-base)]">
          {activeOrg?.name ?? 'Select Org'}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-[var(--color-text-muted)] group-hover:text-primary-600 ml-auto shrink-0 transition-transform ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute left-0 top-full mt-2 w-72 bg-glass border border-[var(--color-border-base)] rounded-2xl shadow-2xl z-50 py-2 animate-in fade-in slide-in-from-top-2">
          <p className="px-4 py-2 text-[10px] font-black text-[var(--color-text-muted)] uppercase tracking-widest">
            Your Organizations
          </p>
          <div className="max-h-[300px] overflow-y-auto px-2 space-y-1">
            {orgs.map((org) => (
              <button
                key={org.id}
                onClick={() => {
                  setActiveOrg(org.id, org.slug || '');
                  setOpen(false);
                  if (org.slug) {
                    router.push(`/${org.slug}/dashboard`);
                  }
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-left transition-all group ${
                  org.id === activeOrgId
                    ? 'bg-primary-600 text-[var(--color-text-base)] shadow-lg shadow-primary-600/20'
                    : 'text-[var(--color-text-subtle)] hover:bg-primary-50 dark:hover:bg-primary-950/20 hover:text-primary-600'
                }`}
              >
                {org.logoUrl ? (
                  <img
                    src={org.logoUrl}
                    alt={org.name}
                    className={`w-9 h-9 rounded-lg object-cover shrink-0 ${
                      org.id === activeOrgId ? 'ring-2 ring-white/20' : ''
                    }`}
                  />
                ) : (
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                      org.id === activeOrgId
                        ? 'bg-white/20'
                        : 'bg-slate-100 dark:bg-slate-800 group-hover:bg-primary-100'
                    }`}
                  >
                    <Building2
                      className={`w-4 h-4 ${
                        org.id === activeOrgId
                          ? 'text-[var(--color-text-base)]'
                          : 'text-[var(--color-text-muted)] group-hover:text-primary-600'
                      }`}
                    />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p
                    className={`font-black truncate ${
                      org.id === activeOrgId
                        ? 'text-[var(--color-text-base)]'
                        : 'text-[var(--color-text-base)]'
                    }`}
                  >
                    {org.name}
                  </p>
                  {org.industry && (
                    <p
                      className={`text-[10px] font-bold uppercase tracking-wider truncate ${
                        org.id === activeOrgId
                          ? 'text-[var(--color-text-base)]/70'
                          : 'text-[var(--color-text-muted)]'
                      }`}
                    >
                      {org.industry}
                    </p>
                  )}
                </div>
                {org.id === activeOrgId && (
                  <Check className="w-4 h-4 text-[var(--color-text-base)] shrink-0" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
