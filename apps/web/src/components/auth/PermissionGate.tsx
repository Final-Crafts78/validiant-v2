'use client';

import { usePermissions, type PermissionKey } from '@/hooks/usePermissions';

interface PermissionGateProps {
  /** The permission to check */
  permission: PermissionKey;
  /** Optional fallback if no permission — defaults to null */
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Wrap any UI element with <PermissionGate permission="createProjects">
 * to hide it from users who don't have that permission.
 *
 * @example
 * <PermissionGate permission="manageMembers">
 *   <button>Add Member</button>
 * </PermissionGate>
 *
 * <PermissionGate permission="viewBilling" fallback={<p>Upgrade to view billing</p>}>
 *   <BillingPanel />
 * </PermissionGate>
 */
export function PermissionGate({
  permission,
  fallback = null,
  children,
}: PermissionGateProps) {
  const { can, isLoading } = usePermissions();

  // Don't flash content while role is loading
  if (isLoading) return null;

  return can[permission] ? <>{children}</> : <>{fallback}</>;
}
