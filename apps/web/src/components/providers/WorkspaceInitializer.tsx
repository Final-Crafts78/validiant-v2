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
}

interface WorkspaceInitializerProps {
  orgs: Organization[];
}

export function WorkspaceInitializer({ orgs }: WorkspaceInitializerProps) {
  const activeOrgId = useWorkspaceStore((s) => s.activeOrgId);
  const setActiveOrg = useWorkspaceStore((s) => s.setActiveOrg);

  useEffect(() => {
    if (orgs.length === 0) return;

    // If no org is selected, or the persisted org no longer exists, auto-select the first
    const orgIds = orgs.map((o) => o.id);
    if (!activeOrgId || !orgIds.includes(activeOrgId)) {
      if (orgs.length > 0 && orgs[0]) {
        setActiveOrg(orgs[0].id);
      }
    }
  }, [orgs, activeOrgId, setActiveOrg]);

  return null; // Headless component — no UI
}
