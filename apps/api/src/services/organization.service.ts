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
import { organizations, organizationMembers, users } from '../db/schema';
import { cache } from '../config/redis.config';
import {
  NotFoundError,
  ConflictError,
  BadRequestError,
  ForbiddenError,
  assertExists,
} from '../utils/errors';
import { logger } from '../utils/logger';
import { OrganizationRole } from '@validiant/shared';

/**
 * Organization interface
 */
interface Organization {
  id: string;
  name: string;
  slug: string;
  description?: string;
  website?: string;
  industry?: string;
  size?: string;
  logoUrl?: string;
  settings: any;
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
}

/**
 * Generate unique slug from name
 */
const generateSlug = async (name: string): Promise<string> => {
  let slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  // Check if slug exists
  let counter = 1;
  let uniqueSlug = slug;

  while (true) {
    const [existing] = await db
      .select({ id: organizations.id })
      .from(organizations)
      .where(and(eq(organizations.slug, uniqueSlug), isNull(organizations.deletedAt)))
      .limit(1);

    if (!existing) break;

    uniqueSlug = `${slug}-${counter}`;
    counter++;
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
    industry?: string;
    size?: string;
  }
): Promise<Organization> => {
  // Generate unique slug
  const slug = await generateSlug(data.name);

  // ✅ ELITE: Use transaction with 'tx' object for all operations
  const organization = await db.transaction(async (tx) => {
    // Create organization using 'tx'
    const [newOrg] = await tx
      .insert(organizations)
      .values({
        name: data.name,
        slug,
        ownerId: userId,
        description: data.description,
        website: data.website,
        industry: data.industry,
        size: data.size,
        settings: {},
      })
      .returning({
        id: organizations.id,
        name: organizations.name,
        slug: organizations.slug,
        description: organizations.description,
        website: organizations.website,
        industry: organizations.industry,
        size: organizations.size,
        logoUrl: organizations.logoUrl,
        settings: organizations.settings,
        createdAt: organizations.createdAt,
        updatedAt: organizations.updatedAt,
      });

    // Add creator as owner using 'tx'
    await tx.insert(organizationMembers).values({
      organizationId: newOrg.id,
      userId,
      role: OrganizationRole.OWNER,
    });

    return newOrg;
  });

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
export const getOrganizationById = async (organizationId: string): Promise<Organization> => {
  // Try cache first
  const cacheKey = `organization:${organizationId}`;
  const cached = await cache.get<Organization>(cacheKey);

  if (cached) {
    return cached;
  }

  const [organization] = await db
    .select({
      id: organizations.id,
      name: organizations.name,
      slug: organizations.slug,
      description: organizations.description,
      website: organizations.website,
      industry: organizations.industry,
      size: organizations.size,
      logoUrl: organizations.logoUrl,
      settings: organizations.settings,
      createdAt: organizations.createdAt,
      updatedAt: organizations.updatedAt,
    })
    .from(organizations)
    .where(and(eq(organizations.id, organizationId), isNull(organizations.deletedAt)))
    .limit(1);

  assertExists(organization, 'Organization');

  // Cache for 5 minutes
  await cache.set(cacheKey, organization, 300);

  return organization as Organization;
};

/**
 * Get organization by slug
 */
export const getOrganizationBySlug = async (slug: string): Promise<Organization> => {
  const [organization] = await db
    .select({
      id: organizations.id,
      name: organizations.name,
      slug: organizations.slug,
      description: organizations.description,
      website: organizations.website,
      industry: organizations.industry,
      size: organizations.size,
      logoUrl: organizations.logoUrl,
      settings: organizations.settings,
      createdAt: organizations.createdAt,
      updatedAt: organizations.updatedAt,
    })
    .from(organizations)
    .where(and(eq(organizations.slug, slug), isNull(organizations.deletedAt)))
    .limit(1);

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
    industry?: string;
    size?: string;
    logoUrl?: string;
  }
): Promise<Organization> => {
  // Build update object
  const updateData: any = {
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

  if (data.industry !== undefined) {
    updateData.industry = data.industry;
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

  const [organization] = await db
    .update(organizations)
    .set(updateData)
    .where(and(eq(organizations.id, organizationId), isNull(organizations.deletedAt)))
    .returning({
      id: organizations.id,
      name: organizations.name,
      slug: organizations.slug,
      description: organizations.description,
      website: organizations.website,
      industry: organizations.industry,
      size: organizations.size,
      logoUrl: organizations.logoUrl,
      settings: organizations.settings,
      createdAt: organizations.createdAt,
      updatedAt: organizations.updatedAt,
    });

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
  settings: any
): Promise<Organization> => {
  const [organization] = await db
    .update(organizations)
    .set({
      settings,
      updatedAt: new Date(),
    })
    .where(and(eq(organizations.id, organizationId), isNull(organizations.deletedAt)))
    .returning({
      id: organizations.id,
      name: organizations.name,
      slug: organizations.slug,
      description: organizations.description,
      website: organizations.website,
      industry: organizations.industry,
      size: organizations.size,
      logoUrl: organizations.logoUrl,
      settings: organizations.settings,
      createdAt: organizations.createdAt,
      updatedAt: organizations.updatedAt,
    });

  assertExists(organization, 'Organization');

  // Clear cache
  await cache.del(`organization:${organizationId}`);

  return organization as Organization;
};

/**
 * Delete organization (soft delete)
 */
export const deleteOrganization = async (organizationId: string): Promise<void> => {
  await db
    .update(organizations)
    .set({ deletedAt: new Date() })
    .where(eq(organizations.id, organizationId));

  // Clear cache
  await cache.del(`organization:${organizationId}`);

  logger.info('Organization deleted', { organizationId });
};

/**
 * Get user's organizations
 */
export const getUserOrganizations = async (userId: string): Promise<OrganizationWithRole[]> => {
  const results = await db
    .select({
      id: organizations.id,
      name: organizations.name,
      slug: organizations.slug,
      description: organizations.description,
      website: organizations.website,
      logoUrl: organizations.logoUrl,
      memberRole: organizationMembers.role,
      createdAt: organizations.createdAt,
      // Subquery for member count
      memberCount: sql<number>`(
        SELECT COUNT(*)
        FROM ${organizationMembers}
        WHERE ${organizationMembers.organizationId} = ${organizations.id}
        AND ${organizationMembers.deletedAt} IS NULL
      )`,
    })
    .from(organizations)
    .innerJoin(
      organizationMembers,
      eq(organizations.id, organizationMembers.organizationId)
    )
    .where(
      and(
        eq(organizationMembers.userId, userId),
        isNull(organizations.deletedAt),
        isNull(organizationMembers.deletedAt)
      )
    )
    .orderBy(desc(organizationMembers.joinedAt));

  return results.map((r) => ({
    ...r,
    memberCount: Number(r.memberCount),
  })) as OrganizationWithRole[];
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
      // User data as nested object
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
    .orderBy(
      // Custom role ordering: owner > admin > member > viewer
      sql`CASE ${organizationMembers.role}
        WHEN 'owner' THEN 1
        WHEN 'admin' THEN 2
        WHEN 'member' THEN 3
        WHEN 'viewer' THEN 4
      END`,
      asc(organizationMembers.joinedAt)
    );

  return members as OrganizationMember[];
};

/**
 * Add member to organization
 */
export const addOrganizationMember = async (
  organizationId: string,
  userId: string,
  role: OrganizationRole = OrganizationRole.MEMBER
): Promise<OrganizationMember> => {
  // Check if already a member
  const [existingMember] = await db
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

  if (existingMember) {
    throw new ConflictError('User is already a member of this organization');
  }

  // Add member
  const [member] = await db
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
  // Prevent removing last owner
  if (role !== OrganizationRole.OWNER) {
    // Count current owners
    const [{ count: ownerCount }] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(organizationMembers)
      .where(
        and(
          eq(organizationMembers.organizationId, organizationId),
          eq(organizationMembers.role, OrganizationRole.OWNER),
          isNull(organizationMembers.deletedAt)
        )
      );

    // Check if current member is owner
    const [currentMember] = await db
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

    if (currentMember?.role === OrganizationRole.OWNER && Number(ownerCount) <= 1) {
      throw new BadRequestError('Cannot remove the last owner from organization');
    }
  }

  const [member] = await db
    .update(organizationMembers)
    .set({
      role,
      updatedAt: new Date(),
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

  assertExists(member, 'Organization member');

  logger.info('Member role updated', { organizationId, userId, role });

  return member as OrganizationMember;
};

/**
 * Remove member from organization
 */
export const removeMember = async (organizationId: string, userId: string): Promise<void> => {
  // Check if user is the last owner
  const [member] = await db
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

  if (member?.role === OrganizationRole.OWNER) {
    const [{ count: ownerCount }] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(organizationMembers)
      .where(
        and(
          eq(organizationMembers.organizationId, organizationId),
          eq(organizationMembers.role, OrganizationRole.OWNER),
          isNull(organizationMembers.deletedAt)
        )
      );

    if (Number(ownerCount) <= 1) {
      throw new BadRequestError('Cannot remove the last owner from organization');
    }
  }

  await db
    .update(organizationMembers)
    .set({ deletedAt: new Date() })
    .where(
      and(
        eq(organizationMembers.organizationId, organizationId),
        eq(organizationMembers.userId, userId)
      )
    );

  logger.info('Member removed from organization', { organizationId, userId });
};

/**
 * Get user's role in organization
 */
export const getUserRole = async (
  organizationId: string,
  userId: string
): Promise<OrganizationRole | null> => {
  const [member] = await db
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

  return member?.role || null;
};

/**
 * Check if user is member of organization
 */
export const isMember = async (organizationId: string, userId: string): Promise<boolean> => {
  const [member] = await db
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

  return !!member;
};

/**
 * Leave organization
 */
export const leaveOrganization = async (
  organizationId: string,
  userId: string
): Promise<void> => {
  await removeMember(organizationId, userId);
};
