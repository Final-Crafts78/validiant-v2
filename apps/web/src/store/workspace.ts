'use client';
/**
 * Workspace Store (Persisted)
 *
 * Manages the active Organization and Project context.
 * Persisted to localStorage so users return to their exact workspace on refresh.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { queryClient } from '../lib/query-client';

interface WorkspaceStore {
  activeOrgId: string | null;
  activeOrgSlug: string | null;
  activeProjectId: string | null;
  setActiveOrg: (
    id: string,
    slug: string,
    brandConfig?: Record<string, unknown>
  ) => void;
  setActiveProject: (id: string) => void;
  clearWorkspace: () => void;
}

export const useWorkspaceStore = create<WorkspaceStore>()(
  persist(
    (set, get) => ({
      activeOrgId: null,
      activeOrgSlug: null,
      activeProjectId: null,

      // Setting a new org resets the project selection and purges stale cache
      setActiveOrg: (id, slug, brandConfig) => {
        const prevOrgId = get().activeOrgId;

        if (prevOrgId && prevOrgId !== id) {
          queryClient.removeQueries({ queryKey: ['organizations', prevOrgId] });
          queryClient.removeQueries({
            queryKey: ['projects', 'org', prevOrgId],
          });
        }

        // Sync brandConfig to cookie for flash prevention (Mini-Phase 8)
        if (typeof document !== 'undefined') {
          try {
            const currentCookies = document.cookie
              .split('; ')
              .find((row) => row.startsWith('userPrefs='));
            let prefs = {};
            if (currentCookies) {
              const part = currentCookies.split('=')[1];
              if (part) {
                prefs = JSON.parse(decodeURIComponent(part));
              }
            }

            const newPrefs = { ...prefs, brandConfig };
            document.cookie = `userPrefs=${encodeURIComponent(JSON.stringify(newPrefs))}; path=/; max-age=31536000; sameSite=lax`;
          } catch (e) {
            console.error('Failed to sync brand config to cookie', e);
          }
        }

        set({ activeOrgId: id, activeOrgSlug: slug, activeProjectId: null });
      },

      setActiveProject: (id) => set({ activeProjectId: id }),

      clearWorkspace: () => {
        const orgId = get().activeOrgId;
        if (orgId) {
          queryClient.removeQueries({ queryKey: ['organizations', orgId] });
        }
        set({ activeOrgId: null, activeOrgSlug: null, activeProjectId: null });
      },
    }),
    { name: 'validiant-workspace-storage' }
  )
);

/**
 * Workspace selectors for optimized re-renders
 */
export const selectActiveOrgId = (state: WorkspaceStore) => state.activeOrgId;
export const selectActiveProjectId = (state: WorkspaceStore) =>
  state.activeProjectId;
