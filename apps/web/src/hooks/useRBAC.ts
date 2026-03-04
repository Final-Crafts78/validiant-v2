'use client';
/**
 * useRBAC Hook (Role-Based Access Control)
 *
 * TanStack Query hook that fetches the logged-in user's org/project roles
 * and returns computed permissions for conditional UI rendering.
 *
 * Usage:
 *   const { isOrgOwner, canEditTask } = useRBAC(orgId, projectId);
 */

import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api';
import { useAuthStore } from '@/store/auth';

interface OrgMembership {
  id: string;
  role: 'owner' | 'admin' | 'member';
  organizationId: string;
}

interface ProjectMembership {
  id: string;
  role: 'manager' | 'contributor' | 'viewer';
  projectId: string;
}

/**
 * Hook to check RBAC permissions for a given organization and/or project.
 */
export function useRBAC(orgId?: string, projectId?: string) {
  const user = useAuthStore((s) => s.user);
  const isSuperAdmin = user?.role === 'superadmin';

  // Fetch org membership
  const orgQuery = useQuery<OrgMembership>({
    queryKey: ['orgMembership', orgId],
    queryFn: async () => {
      const { data } = await apiClient.get(
        `/organizations/${orgId}/my-membership`
      );
      return data?.data;
    },
    enabled: !!orgId && !!user,
    staleTime: 5 * 60 * 1000,
  });

  // Fetch project membership
  const projectQuery = useQuery<ProjectMembership>({
    queryKey: ['projectMembership', projectId],
    queryFn: async () => {
      const { data } = await apiClient.get(
        `/projects/${projectId}/my-membership`
      );
      return data?.data;
    },
    enabled: !!projectId && !!user,
    staleTime: 5 * 60 * 1000,
  });

  const orgRole = orgQuery.data?.role;
  const projectRole = projectQuery.data?.role;

  return {
    // Loading state
    isLoading: orgQuery.isLoading || projectQuery.isLoading,

    // Raw roles
    orgRole,
    projectRole,

    // Org-level permissions
    isSuperAdmin,
    isOrgOwner: isSuperAdmin || orgRole === 'owner',
    isOrgAdmin: isSuperAdmin || orgRole === 'owner' || orgRole === 'admin',

    // Project-level permissions
    isProjectManager: isSuperAdmin || projectRole === 'manager',
    canEditTask:
      isSuperAdmin ||
      orgRole === 'owner' ||
      orgRole === 'admin' ||
      projectRole === 'manager' ||
      projectRole === 'contributor',
    canViewTask:
      isSuperAdmin ||
      orgRole === 'owner' ||
      orgRole === 'admin' ||
      !!projectRole,
  };
}
