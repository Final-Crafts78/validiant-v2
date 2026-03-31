'use client';
/**
 * Workspace Initializer
 *
 * Client component that hydrates the workspace store from server-fetched orgs.
 * Auto-selects the first org if none is persisted in localStorage.
 */

import { useEffect } from 'react';
import { useWorkspaceStore } from '@/store/workspace';
import { useAuthStore } from '@/store/auth';

interface Organization {
  id: string;
  name: string;
  slug?: string;
  industry?: string;
  logoUrl?: string;
}

interface WorkspaceInitializerProps {
  orgs: Organization[];
}

export function WorkspaceInitializer({ orgs }: WorkspaceInitializerProps) {
  // SERVER-SIDE SSR AUDIT (Finding 43)
  if (typeof window === 'undefined') {
    // eslint-disable-next-line no-console
    console.debug('[Workspace:Initializer] EP-SSR: Initializing on server', {
      orgCount: orgs?.length || 0,
      orgIds: orgs?.map((o) => o.id),
      timestamp: new Date().toISOString(),
    });
  }

  const activeOrgId = useWorkspaceStore((s) => s.activeOrgId);
  const setActiveOrg = useWorkspaceStore((s) => s.setActiveOrg);
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (!orgs || orgs.length === 0) return;

    const orgIds = orgs.map((o) => o.id);
    const userPreferredOrgId = user?.activeOrganizationId;

    // ELITE: Multi-tenant context resolution strategy
    // 1. If currently selected org is STILL valid, keep it.
    if (activeOrgId && orgIds.includes(activeOrgId)) return;

    // 2. If user has a preferred org in their profile, and it belongs to this list, use it.
    if (userPreferredOrgId && orgIds.includes(userPreferredOrgId)) {
      const preferredOrg = orgs.find((o) => o.id === userPreferredOrgId);
      if (preferredOrg) {
        setActiveOrg(preferredOrg.id, preferredOrg.slug || '');
        return;
      }
    }

    // 3. Fallback: Select the first available organization from the list
    if (orgs.length > 0 && orgs[0]) {
      setActiveOrg(orgs[0].id, orgs[0].slug || '');
    }
  }, [orgs, activeOrgId, setActiveOrg, user?.activeOrganizationId]);

  return null; // Headless component — no UI
}
