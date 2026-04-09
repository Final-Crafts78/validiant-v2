'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useWorkspaceStore } from '@/store/workspace';
import { useOrganizations } from '@/hooks/useOrganizations';
import { Loader2 } from 'lucide-react';

/**
 * Global Projects Redirect
 * 
 * Redirects to the workspace-scoped projects page.
 * Per Masterplan Phase 3: users should always land in the workspace-scoped view.
 */
export default function GlobalProjectsRedirect() {
  const router = useRouter();
  const activeOrgSlug = useWorkspaceStore((s) => s.activeOrgSlug);
  const { data: orgs, isLoading } = useOrganizations();

  useEffect(() => {
    // If we already have an active org slug, redirect immediately
    if (activeOrgSlug) {
      router.replace(`/${activeOrgSlug}/projects`);
      return;
    }

    // Otherwise, wait for orgs to load and use the first one
    if (!isLoading && orgs && orgs.length > 0) {
      const firstOrg = orgs[0];
      if (!firstOrg) return;
      const slug = firstOrg.slug || firstOrg.id;
      router.replace(`/${slug}/projects`);
    }
  }, [activeOrgSlug, orgs, isLoading, router]);

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-[var(--color-surface-base)]">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-[var(--color-accent-base)]" />
        <span className="text-sm font-bold uppercase tracking-widest text-[var(--color-text-muted)] animate-pulse">
          Redirecting to workspace...
        </span>
      </div>
    </div>
  );
}
