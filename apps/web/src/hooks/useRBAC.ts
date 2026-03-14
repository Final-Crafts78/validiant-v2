'use client';
/**
 * useRBAC Hook (Role-Based Access Control)
 *
 * Refactored for Phase 24 Centralized Keys.
 */

import { useQuery } from '@tanstack/react-query';
import { get } from '@/lib/api';
import { useAuth } from './useAuth';
import { queryKeys } from '@/lib/query-keys';

interface OrgMembership {
  id: string;
  role: 'owner' | 'admin' | 'member' | 'manager' | 'executive' | 'viewer';
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
  const { user } = useAuth();
  const isSuperAdmin = (user as any)?.role === 'superadmin';

  // Fetch org membership
  const orgQuery = useQuery<OrgMembership>({
    queryKey: queryKeys.memberships.org(orgId ?? ''),
    queryFn: async () => {
      const { data } = await get<any>(`/organizations/${orgId}/my-membership`);
      return data.data;
    },
    enabled: !!orgId && !!user,
    staleTime: 5 * 60 * 1000,
  });

  // Fetch project membership
  const projectQuery = useQuery<ProjectMembership>({
    queryKey: queryKeys.memberships.project(projectId ?? ''),
    queryFn: async () => {
      const { data } = await get<any>(`/projects/${projectId}/my-membership`);
      return data.data;
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
