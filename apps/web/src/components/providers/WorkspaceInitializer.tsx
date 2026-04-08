'use client';
/**
 * Workspace Initializer
 *
 * Client component that hydrates the workspace store from server-fetched orgs.
 * Auto-selects the first org if none is persisted in localStorage.
 */

import { useEffect } from 'react';
import { useWorkspaceStore } from '@/store/workspace';

interface Organization {
  id: string;
  name: string;
  slug?: string;
  industry?: string;
  logoUrl?: string;
  settings?: any;
}

interface WorkspaceInitializerProps {
  orgs: Organization[];
  urlOrgSlug?: string;
}

export function WorkspaceInitializer({ orgs, urlOrgSlug }: WorkspaceInitializerProps) {
  useEffect(() => {
    function syncOrgFromUrl() {
      const state = useWorkspaceStore.getState();
      const currentOrgId = state.activeOrgId;
      
      let targetOrg = null;
      if (urlOrgSlug && urlOrgSlug !== 'new') {
        targetOrg = orgs?.find((o) => o.slug === urlOrgSlug);
      } else if (orgs && orgs.length > 0) {
        if (!currentOrgId || !orgs.find(o => o.id === currentOrgId)) {
          targetOrg = orgs[0];
        } else {
          targetOrg = orgs.find(o => o.id === currentOrgId);
        }
      }

      if (targetOrg && targetOrg.id !== currentOrgId) {
        state.setActiveOrg(targetOrg.id, targetOrg.slug || '', targetOrg.settings?.brandConfig);
      }
    }

    const hasHydrated = useWorkspaceStore.getState()._hasHydrated;
    if (!hasHydrated) {
      const unsub = useWorkspaceStore.subscribe((state) => {
        if (state._hasHydrated) {
          syncOrgFromUrl();
          unsub();
        }
      });
      return unsub;
    }
    syncOrgFromUrl();
  }, [orgs, urlOrgSlug]);

  return null; // Headless component — no UI
}
