'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useWorkspaceStore } from '@/store/workspace';
import { useOrganizations } from '@/hooks/useOrganizations';
import { Loader2 } from 'lucide-react';

export default function DashboardRedirect() {
  const router = useRouter();
  const activeOrgSlug = useWorkspaceStore((s) => s.activeOrgSlug);
  const { data: orgs, isLoading } = useOrganizations();

  useEffect(() => {
    if (isLoading) return;
    
    // Redirect to active workspace if available, otherwise first org
    const slug = activeOrgSlug || orgs?.[0]?.slug;
    if (slug) {
      router.replace(`/${slug}/dashboard`);
    } else {
      // If no orgs exist, send to onboarding
      router.replace('/dashboard/onboarding');
    }
  }, [activeOrgSlug, orgs, router, isLoading]);

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-[var(--color-surface-base)]">
        <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-10 h-10 animate-spin text-[var(--color-accent-base)]" />
            <span className="text-sm font-bold uppercase tracking-widest text-[var(--color-text-muted)] animate-pulse">
                Entering Workspace...
            </span>
        </div>
    </div>
  );
}
