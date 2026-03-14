'use client';

import { PermissionKey } from '@validiant/shared';
import { usePermissions } from '@/hooks/usePermissions';

interface PermissionGateProps {
  /** The permission to check or the high-level capability flag */
  permission: PermissionKey | string;
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
  const { can, has, isLoading } = usePermissions();

  // Don't flash content while role is loading
  if (isLoading) return null;

  // Check if it's a high-level flag (can.xxx) or a direct ABAC key
  const isAllowed =
    (can as Record<string, boolean>)[permission] === true ||
    has(permission as PermissionKey);

  return isAllowed ? <>{children}</> : <>{fallback}</>;
}
