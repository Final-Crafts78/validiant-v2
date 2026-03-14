/**
 * Platform Permission System
 *
 * Defines the strict PermissionKey type and permission mapping for Validiant v2.
 * This is based on the Mini-Phase 3 specification.
 */

/**
 * All available permission actions in the system.
 * Total: 32+ keys as required by the Principal Architect.
 */
export const PermissionKey = [
  // Organization Management
  'org:create',
  'org:read',
  'org:update',
  'org:delete',
  'org:admin',
  'org:settings',
  'org:branding',

  // User & Identity
  'user:read',
  'user:create',
  'user:update',
  'user:delete',
  'user:admin',
  'user:roles',
  'user:invite',

  // Task & BGV Operations
  'task:read',
  'task:create',
  'task:update',
  'task:delete',
  'task:verify',
  'task:reject',
  'task:assign',
  'task:bulk_ops',

  // KYC & Verification Specifics
  'kyc:read',
  'kyc:approve',
  'kyc:reject',
  'kyc:review',

  // Audit & Compliance
  'audit:read',
  'audit:export',

  // Infrastructure & Feature Management
  'feature:read',
  'feature:toggle',
  'billing:read',
  'billing:manage',
  'api:read',
  'api:write',

  // Projects
  'project:read',
  'project:create',
  'project:update',
  'project:delete',
] as const;

export type PermissionKey = (typeof PermissionKey)[number];

/**
 * System-Level Permission Mapping
 * Defines which Platform Roles have which base permissions.
 */
export const PLATFORM_ROLE_PERMISSIONS: Record<string, PermissionKey[]> = {
  superadmin: [...PermissionKey], // Everything
  admin: [
    'org:read',
    'org:update',
    'org:settings',
    'user:read',
    'user:create',
    'user:update',
    'user:invite',
    'task:read',
    'task:create',
    'task:update',
    'task:verify',
    'task:reject',
    'task:assign',
    'task:bulk_ops',
    'audit:read',
    'project:read',
    'project:create',
    'project:update',
  ],
  user: ['org:read', 'user:read', 'task:read', 'task:update', 'project:read'],
};

/**
 * Organization-Level Permission Mapping (Immutable Base Roles)
 * Defines the default permissions for standard organization roles.
 */
export const ORG_ROLE_PERMISSIONS: Record<string, PermissionKey[]> = {
  owner: [...PermissionKey], // Owners have full control within their organization
  admin: [
    'org:read',
    'org:update',
    'org:settings',
    'org:branding',
    'user:read',
    'user:create',
    'user:update',
    'user:invite',
    'user:roles',
    'task:read',
    'task:create',
    'task:update',
    'task:delete',
    'task:verify',
    'task:assign',
    'task:bulk_ops',
    'kyc:read',
    'kyc:review',
    'audit:read',
    'project:read',
    'project:create',
    'project:update',
    'project:delete',
  ],
  manager: [
    'org:read',
    'user:read',
    'user:invite',
    'task:read',
    'task:create',
    'task:update',
    'task:verify',
    'task:assign',
    'kyc:read',
    'audit:read',
    'project:read',
    'project:create',
    'project:update',
  ],
  executive: [
    'org:read',
    'user:read',
    'task:read',
    'kyc:read',
    'audit:read',
    'audit:export',
    'project:read',
    'billing:read',
  ],
  viewer: ['org:read', 'user:read', 'task:read', 'project:read'],
};
