'use client';
/**
 * Workspace Store (Persisted)
 *
 * Manages the active Organization and Project context.
 * Persisted to localStorage so users return to their exact workspace on refresh.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface WorkspaceStore {
  activeOrgId: string | null;
  activeProjectId: string | null;
  setActiveOrg: (id: string) => void;
  setActiveProject: (id: string) => void;
  clearWorkspace: () => void;
}

export const useWorkspaceStore = create<WorkspaceStore>()(
  persist(
    (set) => ({
      activeOrgId: null,
      activeProjectId: null,

      // Setting a new org resets the project selection
      setActiveOrg: (id) => set({ activeOrgId: id, activeProjectId: null }),

      setActiveProject: (id) => set({ activeProjectId: id }),

      clearWorkspace: () => set({ activeOrgId: null, activeProjectId: null }),
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
