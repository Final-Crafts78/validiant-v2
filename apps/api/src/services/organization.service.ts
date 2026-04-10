/**
 * Organization Service (Drizzle Version)
 *
 * Handles organization/team management, member operations,
 * invitations, and organization-related business logic.
 *
 * Migrated from raw SQL to Drizzle ORM for type safety and better DX.
 */

import { eq, and, isNull, sql, desc, asc } from 'drizzle-orm';
import { db } from '../db';
import {
  organizations,
  organizationMembers,
  users,
  projects,
  orgRoles,
} from '../db/schema';
import { cache } from '../config/redis.config';
import { ConflictError, BadRequestError, assertExists } from '../utils/errors';
import { logger } from '../utils/logger';
import {
  OrganizationRole,
  ORG_ROLE_PERMISSIONS,
  PermissionKey,
  OrgSettings,
} from '@validiant/shared';

/**
 * Organization interface
 */
interface Organization {
  id: string;
  name: string;
  slug: string;
  description?: string;
  website?: string;
  industryType?: string;
  size?: string;
  logoUrl?: string;
  ownerId: string;
  settings: OrgSettings;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Organization member interface
 */
interface OrganizationMember {
  id: string;
  userId: string;
  organizationId: string;
  role: OrganizationRole;
  user?: {
    id: string;
    email: string;
    fullName: string;
    avatarUrl?: string;
  };
  joinedAt: Date;
}

/**
 * Organization with member info
 */
interface OrganizationWithRole extends Organization {
  memberRole: OrganizationRole;
  memberCount: number;
  projectCount: number;
}

/**
 * Generate unique slug from name
 */
const generateSlug = async (name: string): Promise<string> => {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  // Check if slug exists
  let counter = 1;
  let uniqueSlug = slug;

  let isUnique = false;
  while (!isUnique) {
    const existingResult = await db
      .select({ id: organizations.id })
      .from(organizations)
      .where(
        and(eq(organizations.slug, uniqueSlug), isNull(organizations.deletedAt))
      )
      .limit(1);
    const existing = existingResult[0];

    if (!existing) {
      isUnique = true;
    } else {
      uniqueSlug = `${slug}-${counter}`;
      counter++;
    }
  }

  return uniqueSlug;
};

/**
 * Create organization
 * ✅ ELITE: Wrapped in transaction for ACID compliance
 */
export const createOrganization = async (
  userId: string,
  data: {
    name: string;
    description?: string;
    website?: string;
    industryType?: string;
    size?: string;
  }
): Promise<Organization> => {
  // Generate unique slug
  const slug = await generateSlug(data.name);

  // Procedural debugging: EXTREME VISIBILITY for organization creation
  console.debug('[Service:Org:Create] Starting DB INSERT attempt', {
    name: data.name,
    slug,
    ownerId: userId,
    industryType: data.industryType,
    timestamp: new Date().toISOString()
  });

  // Proceed without db.transaction() because neon-http does not support interactive transactions
  // 1. Create organization
  const newOrgResult = await db
    .insert(organizations)
    .values({
      name: data.name,
      slug,
      ownerId: userId,
      description: data.description,
      website: data.website,
      industryType: data.industryType,
      size: data.size,
      settings: {},
    })
    .returning({
      id: organizations.id,
      name: organizations.name,
      slug: organizations.slug,
      description: organizations.description,
      website: organizations.website,
      industryType: organizations.industryType,
      size: organizations.size,
      logoUrl: organizations.logoUrl,
      settings: organizations.settings,
      createdAt: organizations.createdAt,
      updatedAt: organizations.updatedAt,
    });

  const newOrg = newOrgResult[0];
  if (!newOrg) {
    console.error('[Service:Org:Create] DB INSERT returned empty result');
    throw new Error('FAILED_TO_CREATE_ORGANIZATION_DB');
  }

  console.info('[Service:Org:Create] DB INSERT success', {
    id: newOrg.id,
    slug: newOrg.slug,
    timestamp: new Date().toISOString()
  });

  try {
    // 2. Add creator as owner
    await db.insert(organizationMembers).values({
      organizationId: newOrg.id,
      userId,
      role: OrganizationRole.OWNER,
    });
  } catch (error) {
    // Manual rollback: If adding the member fails, delete the created organization
    logger.error('Failed to add owner to new organization, rolling back...', {
      error,
      organizationId: newOrg.id,
    });
    await db.delete(organizations).where(eq(organizations.id, newOrg.id));
    throw error;
  }

  const organization = newOrg;

  logger.info('Organization created', {
    organizationId: organization.id,
    userId,
    slug: organization.slug,
  });

  return organization as Organization;
};

/**
 * Get organization by ID
 */
export const getOrganizationById = async (
  organizationId: string
): Promise<Organization> => {
  // Try cache first
  const cacheKey = `organization:${organizationId}`;
  const cached = await cache.get<Organization>(cacheKey);

  if (cached) {
    return cached;
  }

  const organizationResult = await db
    .select({
      id: organizations.id,
      name: organizations.name,
      slug: organizations.slug,
      description: organizations.description,
      website: organizations.website,
      industryType: organizations.industryType,
      size: organizations.size,
      logoUrl: organizations.logoUrl,
      ownerId: organizations.ownerId,
      settings: organizations.settings,
      createdAt: organizations.createdAt,
      updatedAt: organizations.updatedAt,
    })
    .from(organizations)
    .where(
      and(eq(organizations.id, organizationId), isNull(organizations.deletedAt))
    )
    .limit(1);
  const organization = organizationResult[0];

  assertExists(organization, 'Organization');

  // Cache for 5 minutes
  await cache.set(cacheKey, organization, 300);

  return organization as Organization;
};

/**
 * Get organization by slug
 */
export const getOrganizationBySlug = async (
  slug: string
): Promise<Organization> => {
  const organizationResult = await db
    .select({
      id: organizations.id,
      name: organizations.name,
      slug: organizations.slug,
      description: organizations.description,
      website: organizations.website,
      industryType: organizations.industryType,
      size: organizations.size,
      logoUrl: organizations.logoUrl,
      ownerId: organizations.ownerId,
      settings: organizations.settings,
      createdAt: organizations.createdAt,
      updatedAt: organizations.updatedAt,
    })
    .from(organizations)
    .where(and(eq(organizations.slug, slug), isNull(organizations.deletedAt)))
    .limit(1);
  const organization = organizationResult[0];

  assertExists(organization, 'Organization');

  return organization as Organization;
};

/**
 * Update organization
 */
export const updateOrganization = async (
  organizationId: string,
  data: {
    name?: string;
    description?: string;
    website?: string;
    industryType?: string;
    size?: string;
    logoUrl?: string;
  }
): Promise<Organization> => {
  // Build update object
  const updateData: Partial<
    Omit<Organization, 'id' | 'createdAt' | 'updatedAt' | 'settings'>
  > & {
    updatedAt: Date;
    slug?: string;
  } = {
    updatedAt: new Date(),
  };

  if (data.name !== undefined) {
    updateData.name = data.name;
    // Generate new slug if name changed
    updateData.slug = await generateSlug(data.name);
  }

  if (data.description !== undefined) {
    updateData.description = data.description;
  }

  if (data.website !== undefined) {
    updateData.website = data.website;
  }

  if (data.industryType !== undefined) {
    updateData.industryType = data.industryType;
  }

  if (data.size !== undefined) {
    updateData.size = data.size;
  }
  if (data.logoUrl !== undefined) {
    updateData.logoUrl = data.logoUrl;
  }

  if (Object.keys(updateData).length === 1) {
    // Only updatedAt was added
    throw new BadRequestError('No fields to update');
  }

  const organizationResult = await db
    .update(organizations)
    .set(updateData)
    .where(
      and(eq(organizations.id, organizationId), isNull(organizations.deletedAt))
    )
    .returning({
      id: organizations.id,
      name: organizations.name,
      slug: organizations.slug,
      description: organizations.description,
      website: organizations.website,
      industryType: organizations.industryType,
      size: organizations.size,
      logoUrl: organizations.logoUrl,
      settings: organizations.settings,
      createdAt: organizations.createdAt,
      updatedAt: organizations.updatedAt,
    });
  const organization = organizationResult[0];

  // Clear cache
  await cache.del(`organization:${organizationId}`);

  logger.info('Organization updated', { organizationId });

  return organization as Organization;
};

/**
 * Update organization settings
 */
export const updateOrganizationSettings = async (
  organizationId: string,
  settings: Partial<OrgSettings>
): Promise<Organization> => {
  const organizationResult = await db
    .update(organizations)
    .set({
      settings,
      updatedAt: new Date(),
    })
    .where(
      and(eq(organizations.id, organizationId), isNull(organizations.deletedAt))
    )
    .returning({
      id: organizations.id,
      name: organizations.name,
      slug: organizations.slug,
      description: organizations.description,
      website: organizations.website,
      industryType: organizations.industryType,
      size: organizations.size,
      logoUrl: organizations.logoUrl,
      settings: organizations.settings,
      createdAt: organizations.createdAt,
      updatedAt: organizations.updatedAt,
    });
  const organization = organizationResult[0];

  // Clear cache
  await cache.del(`organization:${organizationId}`);

  logger.info('Organization settings updated', { organizationId });

  return organization as Organization;
};

/**
 * Delete organization (soft delete)
 */
export const deleteOrganization = async (
  organizationId: string
): Promise<void> => {
  await db
    .update(organizations)
    .set({ deletedAt: new Date() })
    .where(
      and(eq(organizations.id, organizationId), isNull(organizations.deletedAt))
    );

  // Clear cache
  await cache.del(`organization:${organizationId}`);

  logger.info('Organization deleted', { organizationId });
};

/**
 * Get user's organizations
 */
export const getUserOrganizations = async (
  userId: string
): Promise<OrganizationWithRole[]> => {
  // ✅ CATEGORY 5 FIX: Subquery for member count
  const results = await db
    .select({
      id: organizations.id,
      name: organizations.name,
      slug: organizations.slug,
      description: organizations.description,
      website: organizations.website,
      industryType: organizations.industryType,
      size: organizations.size,
      logoUrl: organizations.logoUrl,
      settings: organizations.settings,
      createdAt: organizations.createdAt,
      updatedAt: organizations.updatedAt,
      memberRole: organizationMembers.role,
      memberCount: sql<number>`(
        SELECT COUNT(*)
        FROM ${organizationMembers}
        WHERE ${organizationMembers.organizationId} = ${organizations.id}
        AND ${organizationMembers.deletedAt} IS NULL
      )`,
      projectCount: sql<number>`(
        SELECT COUNT(*)
        FROM ${projects}
        WHERE ${projects.organizationId} = ${organizations.id}
        AND ${projects.deletedAt} IS NULL
      )`,
    })
    .from(organizationMembers)
    .innerJoin(
      organizations,
      eq(organizationMembers.organizationId, organizations.id)
    )
    .where(
      and(
        eq(organizationMembers.userId, userId),
        isNull(organizationMembers.deletedAt),
        isNull(organizations.deletedAt)
      )
    )
    .orderBy(desc(organizations.createdAt));

  return (results as unknown[]).map((result) => {
    const r = result as Record<string, unknown>;
    return {
      ...r,
      memberCount: Number(r.memberCount),
      projectCount: Number(r.projectCount),
    };
  }) as unknown as OrganizationWithRole[];
};

/**
 * Get organization members
 */
export const getOrganizationMembers = async (
  organizationId: string
): Promise<OrganizationMember[]> => {
  const members = await db
    .select({
      id: organizationMembers.id,
      userId: organizationMembers.userId,
      organizationId: organizationMembers.organizationId,
      role: organizationMembers.role,
      joinedAt: organizationMembers.joinedAt,
      user: {
        id: users.id,
        email: users.email,
        fullName: users.fullName,
        avatarUrl: users.avatarUrl,
      },
    })
    .from(organizationMembers)
    .innerJoin(users, eq(organizationMembers.userId, users.id))
    .where(
      and(
        eq(organizationMembers.organizationId, organizationId),
        isNull(organizationMembers.deletedAt),
        isNull(users.deletedAt)
      )
    )
    .orderBy(asc(organizationMembers.joinedAt));

  return members as OrganizationMember[];
};

/**
 * Add member to organization
 */
export const addOrganizationMember = async (
  organizationId: string,
  userId: string,
  role: OrganizationRole
): Promise<OrganizationMember> => {
  // Check if user is already a member
  const existingMember = await db
    .select({ id: organizationMembers.id })
    .from(organizationMembers)
    .where(
      and(
        eq(organizationMembers.organizationId, organizationId),
        eq(organizationMembers.userId, userId),
        isNull(organizationMembers.deletedAt)
      )
    )
    .limit(1);

  if (existingMember.length > 0) {
    throw new ConflictError('User is already a member of this organization');
  }

  const memberResult = await db
    .insert(organizationMembers)
    .values({
      organizationId,
      userId,
      role,
    })
    .returning({
      id: organizationMembers.id,
      userId: organizationMembers.userId,
      organizationId: organizationMembers.organizationId,
      role: organizationMembers.role,
      joinedAt: organizationMembers.joinedAt,
    });
  const member = memberResult[0];

  logger.info('Organization member added', { organizationId, userId, role });

  return member as OrganizationMember;
};

/**
 * Update member role
 */
export const updateMemberRole = async (
  organizationId: string,
  userId: string,
  role: OrganizationRole
): Promise<OrganizationMember> => {
  const memberResult = await db
    .update(organizationMembers)
    .set({
      role,
    })
    .where(
      and(
        eq(organizationMembers.organizationId, organizationId),
        eq(organizationMembers.userId, userId),
        isNull(organizationMembers.deletedAt)
      )
    )
    .returning({
      id: organizationMembers.id,
      userId: organizationMembers.userId,
      organizationId: organizationMembers.organizationId,
      role: organizationMembers.role,
      joinedAt: organizationMembers.joinedAt,
    });
  const member = memberResult[0];

  logger.info('Member role updated', { organizationId, userId, role });

  return member as OrganizationMember;
};

/**
 * Remove member from organization (soft delete)
 */
export const removeMember = async (
  organizationId: string,
  userId: string
): Promise<void> => {
  await db
    .update(organizationMembers)
    .set({ deletedAt: new Date() })
    .where(
      and(
        eq(organizationMembers.organizationId, organizationId),
        eq(organizationMembers.userId, userId),
        isNull(organizationMembers.deletedAt)
      )
    );

  logger.info('Member removed from organization', { organizationId, userId });
};

/**
 * Leave organization (user removing themselves)
 */
export const leaveOrganization = async (
  organizationId: string,
  userId: string
): Promise<void> => {
  // Check if user is the owner
  const member = await db
    .select({ role: organizationMembers.role })
    .from(organizationMembers)
    .where(
      and(
        eq(organizationMembers.organizationId, organizationId),
        eq(organizationMembers.userId, userId),
        isNull(organizationMembers.deletedAt)
      )
    )
    .limit(1);

  if (member.length > 0 && member[0].role === OrganizationRole.OWNER) {
    throw new BadRequestError(
      'Owner cannot leave organization. Transfer ownership or delete the organization.'
    );
  }

  await removeMember(organizationId, userId);

  logger.info('User left organization', { organizationId, userId });
};

/**
 * Get user's role in organization
 */
export const getUserRole = async (
  organizationId: string,
  userId: string
): Promise<OrganizationRole | null> => {
  const memberResult = await db
    .select({ role: organizationMembers.role })
    .from(organizationMembers)
    .where(
      and(
        eq(organizationMembers.organizationId, organizationId),
        eq(organizationMembers.userId, userId),
        isNull(organizationMembers.deletedAt)
      )
    )
    .limit(1);
  const member = memberResult[0];

  return member ? (member.role as OrganizationRole) : null;
};

/**
 * Check if user is member
 */
export const isMember = async (
  organizationId: string,
  userId: string
): Promise<boolean> => {
  const memberResult = await db
    .select({ id: organizationMembers.id })
    .from(organizationMembers)
    .where(
      and(
        eq(organizationMembers.organizationId, organizationId),
        eq(organizationMembers.userId, userId),
        isNull(organizationMembers.deletedAt)
      )
    )
    .limit(1);
  const member = memberResult[0];

  return !!member;
};

/**
 * List custom roles for organization
 */
export const getOrganizationRoles = async (organizationId: string) => {
  return await db
    .select()
    .from(orgRoles)
    .where(
      and(
        eq(orgRoles.organizationId, organizationId),
        isNull(orgRoles.deletedAt)
      )
    );
};

/**
 * Create a custom role
 */
export const createCustomRole = async (
  organizationId: string,
  data: {
    name: string;
    description?: string;
    permissions: string[];
  }
) => {
  // 🚩 CRITICAL FIX: Role table requires a unique 'key' (identifier)
  // We generate it from the name (e.g. "Support Lead" -> "support_lead")
  const key = data.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

  // eslint-disable-next-line no-console
  console.info('[Service:Org:Role] Creating custom role', {
    organizationId,
    name: data.name,
    generatedKey: key,
    permissionCount: data.permissions?.length || 0,
    timestamp: new Date().toISOString(),
  });

  const [role] = await db
    .insert(orgRoles)
    .values({
      id: crypto.randomUUID(),
      organizationId,
      name: data.name,
      key, // 👈 KEY ADDED
      description: data.description,
      permissions: data.permissions,
      isSystem: false,
    })
    .returning();

  // eslint-disable-next-line no-console
  console.info('[Service:Org:Role] SUCCESS', {
    roleId: role.id,
    name: role.name,
    key: role.key,
    timestamp: new Date().toISOString(),
  });

  return role;
};

/**
 * Update a custom role
 */
export const updateCustomRole = async (
  roleId: string,
  data: {
    name?: string;
    description?: string;
    permissions?: string[];
  }
) => {
  // 🔍 EXTREME VISIBILITY LOGGING
  // eslint-disable-next-line no-console
  console.info('[Service:Org:Role] Updating custom role', {
    roleId,
    updates: Object.keys(data),
    permissionCount: data.permissions?.length,
    timestamp: new Date().toISOString(),
  });

  const [role] = await db
    .update(orgRoles)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(orgRoles.id, roleId))
    .returning();

  if (role) {
    // eslint-disable-next-line no-console
    console.info('[Service:Org:Role] UPDATE SUCCESS', {
      roleId: role.id,
      name: role.name,
      permissions: role.permissions?.length || 0,
      timestamp: new Date().toISOString(),
    });
  } else {
    // eslint-disable-next-line no-console
    console.error(
      '[Service:Org:Role] UPDATE FAILED - Role not found or no rows affected',
      {
        roleId,
      }
    );
  }

  return role;
};

/**
 * Delete a custom role
 */
export const deleteCustomRole = async (roleId: string) => {
  // Soft delete
  await db
    .update(orgRoles)
    .set({
      deletedAt: new Date(),
    })
    .where(eq(orgRoles.id, roleId));
};

/**
 * Resolve permissions for a user within an organization
 * Resolves both base roles and custom roles (Phase 5)
 */
export const resolvePermissions = async (
  organizationId: string,
  userId: string
): Promise<PermissionKey[]> => {
  // 1. Get member record (including potential customRoleId)
  const [member] = await db
    .select({
      role: organizationMembers.role,
      customRoleId: organizationMembers.customRoleId,
    })
    .from(organizationMembers)
    .where(
      and(
        eq(organizationMembers.organizationId, organizationId),
        eq(organizationMembers.userId, userId),
        isNull(organizationMembers.deletedAt)
      )
    )
    .limit(1);

  if (!member) return [];

  // 2. Resolve Custom Role Permissions (if applicable)
  if (member.customRoleId) {
    const [customRole] = await db
      .select({ permissions: orgRoles.permissions })
      .from(orgRoles)
      .where(eq(orgRoles.id, member.customRoleId))
      .limit(1);

    if (customRole && Array.isArray(customRole.permissions)) {
      return customRole.permissions as PermissionKey[];
    }
  }

  // 3. Fallback to System Org Role Permissions
  // We use current Role but can fall back to viewer safely
  const baseRole = (member.role || 'viewer').toLowerCase();

  return (
    (ORG_ROLE_PERMISSIONS[baseRole as OrganizationRole] as PermissionKey[]) ||
    (ORG_ROLE_PERMISSIONS.viewer as PermissionKey[])
  );
};
