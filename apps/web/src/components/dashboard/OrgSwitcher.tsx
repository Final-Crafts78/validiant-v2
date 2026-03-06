'use client';
/**
 * Organization Switcher
 *
 * Dropdown in the dashboard header/sidebar that lets users switch
 * between their organizations. Updates the workspace store.
 */

import { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useWorkspaceStore } from '@/store/workspace';
import apiClient from '@/lib/api';
import { Building2, ChevronDown, Check } from 'lucide-react';

interface Organization {
  id: string;
  name: string;
  slug?: string;
  industry?: string;
  logoUrl?: string;
}

export function OrgSwitcher() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const activeOrgId = useWorkspaceStore((s) => s.activeOrgId);
  const setActiveOrg = useWorkspaceStore((s) => s.setActiveOrg);

  // Fetch orgs client-side (also used for refreshing after creating a new org)
  const { data: orgs = [] } = useQuery<Organization[]>({
    queryKey: ['organizations', 'my'],
    queryFn: async () => {
      const { data } = await apiClient.get('/organizations/my');
      return data?.data?.organizations ?? [];
    },
    staleTime: 5 * 60 * 1000,
  });

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
        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors w-full max-w-[220px]"
        id="org-switcher-trigger"
      >
        {activeOrg?.logoUrl ? (
          <img
            src={activeOrg.logoUrl}
            alt={activeOrg.name}
            className="w-5 h-5 rounded object-cover shrink-0"
          />
        ) : (
          <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
        )}
        <span className="truncate">{activeOrg?.name ?? 'Select Org'}</span>
        <ChevronDown
          className={`w-4 h-4 text-slate-400 ml-auto shrink-0 transition-transform ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute left-0 top-full mt-1 w-64 bg-white border border-slate-200 rounded-xl shadow-lg z-50 py-1 animate-in fade-in slide-in-from-top-1">
          <p className="px-3 py-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Organizations
          </p>
          {orgs.map((org) => (
            <button
              key={org.id}
              onClick={() => {
                setActiveOrg(org.id);
                setOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm text-left transition-colors ${
                org.id === activeOrgId
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              {org.logoUrl ? (
                <img
                  src={org.logoUrl}
                  alt={org.name}
                  className="w-8 h-8 rounded-lg object-cover shrink-0"
                />
              ) : (
                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                  <Building2 className="w-4 h-4 text-slate-400" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{org.name}</p>
                {org.industry && (
                  <p className="text-xs text-slate-400 truncate">
                    {org.industry}
                  </p>
                )}
              </div>
              {org.id === activeOrgId && (
                <Check className="w-4 h-4 text-blue-600 shrink-0" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
