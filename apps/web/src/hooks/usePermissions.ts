'use client';

import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth';
import { useWorkspaceStore } from '@/store/workspace';
import { organizationsApi } from '@/lib/api';
import { OrganizationMemberRole } from '@validiant/shared';

// ── Role order for comparisons ────────────────────────────────────────────────
const ROLE_WEIGHT: Record<string, number> = {
  [OrganizationMemberRole.OWNER]: 4,
  [OrganizationMemberRole.ADMIN]: 3,
  [OrganizationMemberRole.MEMBER]: 2,
  [OrganizationMemberRole.GUEST]: 1,
};

const atLeast = (role: string, min: string) =>
  (ROLE_WEIGHT[role] ?? 0) >= (ROLE_WEIGHT[min] ?? 0);

// ── Hook ──────────────────────────────────────────────────────────────────────
export function usePermissions() {
  const user = useAuthStore((s) => s.user);
  const activeOrgId = useWorkspaceStore((s) => s.activeOrgId);

  const { data: membersRes, isLoading } = useQuery({
    queryKey: ['org-members', activeOrgId],
    queryFn: () => {
      if (!activeOrgId) throw new Error('No active organization');
      return organizationsApi.getMembers(activeOrgId);
    },
    enabled: !!activeOrgId && !!user?.id,
    staleTime: 5 * 60 * 1000,
  });

  const members = membersRes?.data?.data?.members ?? [];
  const myMembership = members.find((m) => m.userId === user?.id);

  // Default to GUEST if we can't find membership yet (while loading)
  const role = (myMembership?.role as string) ?? OrganizationMemberRole.GUEST;

  const isOwner = role === OrganizationMemberRole.OWNER;
  const isAdmin = atLeast(role, OrganizationMemberRole.ADMIN);
  const isMember = atLeast(role, OrganizationMemberRole.MEMBER);
  const isGuest = role === OrganizationMemberRole.GUEST;

  return {
    role,
    isOwner,
    isAdmin,
    isMember,
    isGuest,
    isLoading,

    // Granular permission flags — use these directly in components
    can: {
      // Org-level
      manageOrg: isAdmin,
      manageMembers: isAdmin,
      inviteMembers: isAdmin,
      viewBilling: isOwner,
      deleteOrg: isOwner,

      // Project-level
      createProjects: isMember,
      editProjects: isMember,
      deleteProjects: isAdmin,
      addProjectMember: isAdmin,

      // Task-level
      createTasks: isMember,
      editAnyTask: isAdmin,
      deleteTasks: isAdmin,
      assignTasks: isAdmin,

      // Views
      viewSettings: isAdmin,
      viewAnalytics: isMember,
    },
  };
}

export type Permissions = ReturnType<typeof usePermissions>;
export type PermissionKey = keyof Permissions['can'];
