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
        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-[var(--color-text-subtle)] bg-[var(--color-surface-base)] border border-[var(--color-border-base)] rounded-lg hover:bg-[var(--color-surface-muted)] transition-colors w-full max-w-[220px]"
        id="org-switcher-trigger"
      >
        {activeOrg?.logoUrl ? (
          <img
            src={activeOrg.logoUrl}
            alt={activeOrg.name}
            className="w-5 h-5 rounded object-cover shrink-0"
          />
        ) : (
          <Building2 className="w-4 h-4 text-[var(--color-text-muted)] shrink-0" />
        )}
        <span className="truncate text-[var(--color-text-base)]">
          {activeOrg?.name ?? 'Select Org'}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-[var(--color-text-muted)] ml-auto shrink-0 transition-transform ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute left-0 top-full mt-1 w-64 bg-[var(--color-surface-base)] border border-[var(--color-border-base)] rounded-xl shadow-lg z-50 py-1 animate-in fade-in slide-in-from-top-1">
          <p className="px-3 py-1.5 text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
            Organizations
          </p>
          {orgs.map((org) => (
            <button
              key={org.id}
              onClick={() => {
                setActiveOrg(org.id, org.slug || '');
                setOpen(false);
                // Redirect to the new organization's dashboard
                if (org.slug) {
                  router.push(`/${org.slug}/dashboard`);
                }
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm text-left transition-colors ${
                org.id === activeOrgId
                  ? 'bg-primary-500/10 text-[var(--color-accent-base)]'
                  : 'text-[var(--color-text-subtle)] hover:bg-[var(--color-surface-muted)]'
              }`}
            >
              {org.logoUrl ? (
                <img
                  src={org.logoUrl}
                  alt={org.name}
                  className="w-8 h-8 rounded-lg object-cover shrink-0"
                />
              ) : (
                <div className="w-8 h-8 rounded-lg bg-[var(--color-surface-muted)] flex items-center justify-center shrink-0">
                  <Building2 className="w-4 h-4 text-[var(--color-text-muted)]" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-bold text-[var(--color-text-base)] truncate">
                  {org.name}
                </p>
                {org.industry && (
                  <p className="text-xs text-[var(--color-text-muted)] truncate">
                    {org.industry}
                  </p>
                )}
              </div>
              {org.id === activeOrgId && (
                <Check className="w-4 h-4 text-[var(--color-accent-base)] shrink-0" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
