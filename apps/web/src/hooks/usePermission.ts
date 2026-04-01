'use client';

import { useMemo } from 'react';
import { useParams } from 'next/navigation';
import { useOrganization } from '@/hooks/useOrganizations';
import { 
  PermissionKey, 
  ORG_ROLE_PERMISSIONS 
} from '@validiant/shared';
import { logger } from '@/lib/logger';

/**
 * usePermission Hook
 * 
 * Provides granular permission checking based on the user's role 
 * in the current organization.
 * 
 * @param requiredPermission The permission(s) to check
 * @returns boolean indicating if the user has the required permission
 */
export function usePermission(requiredPermission: PermissionKey | PermissionKey[]): boolean {
  const { orgSlug } = useParams() as { orgSlug: string };
  const { data: organization } = useOrganization(orgSlug);

  const hasPermission = useMemo(() => {
    // 1. If organization or user role is missing, deny
    if (!organization || !organization.role) {
      return false;
    }

    const userRole = organization.role.toLowerCase();
    
    // 2. Get permissions for this role from shared config
    // Note: In a future phase, we should fetch these from the organization's custom roles if applicable
    const rolePermissions = ORG_ROLE_PERMISSIONS[userRole] || [];

    // 3. Check if role has the required permission(s)
    const permissionsToCheck = Array.isArray(requiredPermission) 
      ? requiredPermission 
      : [requiredPermission];

    const result = permissionsToCheck.every(p => rolePermissions.includes(p));

    logger.debug('[PermissionCheck]', {
      orgSlug,
      userRole,
      requiredPermission,
      hasPermission: result,
    });

    return result;
  }, [organization, requiredPermission, orgSlug]);

  return hasPermission;
}

/**
 * useHasAnyPermission Hook
 * 
 * Returns true if the user has ANY of the provided permissions.
 */
export function useHasAnyPermission(permissions: PermissionKey[]): boolean {
  const { orgSlug } = useParams() as { orgSlug: string };
  const { data: organization } = useOrganization(orgSlug);

  return useMemo(() => {
    if (!organization || !organization.role) return false;
    
    const userRole = organization.role.toLowerCase();
    const rolePermissions = ORG_ROLE_PERMISSIONS[userRole] || [];
    
    return permissions.some(p => rolePermissions.includes(p));
  }, [organization, permissions, orgSlug]);
}
