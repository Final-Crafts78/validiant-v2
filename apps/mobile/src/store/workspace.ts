import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { storage } from '../lib/mmkv';

interface WorkspaceState {
  activeOrgId: string | null;
  activeOrgSlug: string | null;

  setActiveOrg: (id: string, slug: string) => void;
  clearWorkspace: () => void;
}

/**
 * Mobile Workspace Store
 * Persisted via MMKV for offline context preservation.
 */
export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set) => ({
      activeOrgId: null,
      activeOrgSlug: null,

      setActiveOrg: (id, slug) => {
        set({ activeOrgId: id, activeOrgSlug: slug });
      },

      clearWorkspace: () => {
        set({ activeOrgId: null, activeOrgSlug: null });
      },
    }),
    {
      name: 'validiant-mobile-workspace',
      storage: createJSONStorage(() => ({
        setItem: (name, value) => storage.set(name, value),
        getItem: (name) => storage.getString(name) ?? null,
        removeItem: (name) => storage.delete(name),
      })),
    }
  )
);
