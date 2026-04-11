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

  // App & Infrastructure Access
  'app:login',
  'infra:backup',
  'csv:import',
  'field:access',

  // Records (Next-gen Tasks)
  'record:read',
  'record:create',
  'record:update',
  'record:delete',
  'record:submit',

  // Schema Engine
  'schema:read',
  'schema:create',
  'schema:update',
  'schema:delete',

  // Sub-Accounts
  'sub_account:read',
  'sub_account:create',
  'sub_account:manage',

  // Portals
  'portal:access',
  'portal:client_access',

  // Field-Level Visibility (Perfection Phase)
  'field:view_internal', // View data visible to project members
  'field:view_restricted', // View data visible to admins/leads
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
    'app:login',
    'csv:import',
    'infra:backup',
    'field:access',
    'record:read',
    'record:create',
    'record:update',
    'record:delete',
    'schema:read',
    'sub_account:read',
    'sub_account:create',
    'sub_account:manage',
  ],
  user: [
    'org:read',
    'user:read',
    'task:read',
    'task:update',
    'project:read',
    'record:read',
    'record:update',
  ],
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
    'app:login',
    'csv:import',
    'infra:backup',
    'field:access',
    'record:read',
    'record:create',
    'record:update',
    'record:delete',
    'schema:read',
    'schema:create',
    'schema:update',
    'schema:delete',
    'sub_account:manage',
    'portal:access',
    'field:view_internal',
    'field:view_restricted',
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
    'csv:import',
    'record:update',
    'sub_account:read',
    'field:view_internal',
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
    'app:login',
    'field:access',
    'record:read',
  ],
  viewer: [
    'org:read',
    'user:read',
    'task:read',
    'project:read',
    'record:read',
    'field:view_internal',
  ],
  field_agent: [
    'org:read',
    'record:read',
    'record:submit',
    'portal:access',
    'app:login',
  ],
  client_viewer: ['org:read', 'record:read', 'portal:client_access'],
};
