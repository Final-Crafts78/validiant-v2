'use client';

import { useAuthStore } from '@/store/auth';
import { PermissionKey } from '@validiant/shared';

/**
 * usePermissions Hook (ABAC Permission Engine)
 *
 * Primary hook for conditional UI rendering and access control.
 * Uses reactive permissions from the JWT (provided via useAuthStore).
 *
 * ELITE PATTERN: Zero network requests for permission checks.
 */
export function usePermissions() {
  const { user, isLoading } = useAuthStore((s) => ({
    user: s.user,
    isLoading: s.isLoading,
  }));
  const permissions = (user?.permissions as string[]) || [];

  /**
   * Check if user has a specific permission
   */
  const has = (permission: PermissionKey): boolean =>
    permissions.includes(permission);

  /**
   * Check if user has any of the given permissions
   */
  const hasAny = (perms: PermissionKey[]): boolean =>
    perms.some((p) => permissions.includes(p));

  /**
   * Check if user has all of the given permissions
   */
  const hasAll = (perms: PermissionKey[]): boolean =>
    perms.every((p) => permissions.includes(p));

  return {
    permissions,
    has,
    hasAny,
    hasAll,
    isLoading,
    isGuest: user?.role === 'guest',

    // Auth context
    userId: user?.id,
    activeOrgId: user?.activeOrganizationId,
    role: user?.role,

    // Granular can flags (derived from ABAC keys)
    can: {
      // Organization Management
      manageOrg: has('org:update') || has('org:admin'),
      manageMembers: has('user:admin') || has('user:roles'),
      inviteMembers: has('user:invite'),
      viewSettings: has('org:read'),
      editSettings: has('org:settings') || has('org:update'),
      deleteOrg: has('org:delete'),

      // Billing
      viewBilling: has('billing:read'),
      manageBilling: has('billing:manage'),

      // Projects
      viewProjects: has('project:read'),
      createProjects: has('project:create'),
      editProjects: has('project:update'),
      deleteProjects: has('project:delete'),

      // Tasks & KYC
      viewTasks: has('task:read'),
      createTasks: has('task:create'),
      editTasks: has('task:update'),
      deleteTasks: has('task:delete'),
      verifyTasks: has('task:verify'),
      assignTasks: has('task:assign'),

      // Compliance
      viewAudit: has('audit:read'),
      exportAudit: has('audit:export'),

      // Infrastructure
      toggleFeatures: has('feature:toggle'),
    },
  };
}

export type Permissions = ReturnType<typeof usePermissions>;
