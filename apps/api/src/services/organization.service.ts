/**
 * Organization Service
 * 
 * Handles organization/team management, member operations,
 * invitations, and organization-related business logic.
 */

import { db } from '../config/database.config';
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
    const exists = await db.exists(
      'SELECT 1 FROM organizations WHERE slug = $1 AND deleted_at IS NULL',
      [uniqueSlug]
    );
    
    if (!exists) break;
    
    uniqueSlug = `${slug}-${counter}`;
    counter++;
  }
  
  return uniqueSlug;
};

/**
 * Create organization
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

  // Create organization
  const organization = await db.one<Organization>(
    `
      INSERT INTO organizations (
        id, name, slug, description, website, industry, size, settings
      ) VALUES (
        gen_random_uuid(), $1, $2, $3, $4, $5, $6, '{}'
      )
      RETURNING 
        id, name, slug, description, website, industry, size,
        logo_url as "logoUrl", settings,
        created_at as "createdAt", updated_at as "updatedAt"
    `,
    [data.name, slug, data.description, data.website, data.industry, data.size]
  );

  // Add creator as owner
  await db.raw(
    `
      INSERT INTO organization_members (
        id, organization_id, user_id, role
      ) VALUES (
        gen_random_uuid(), $1, $2, 'owner'
      )
    `,
    [organization.id, userId]
  );

  logger.info('Organization created', {
    organizationId: organization.id,
    userId,
    slug: organization.slug,
  });

  return organization;
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

  const organization = await db.one<Organization>(
    `
      SELECT 
        id, name, slug, description, website, industry, size,
        logo_url as "logoUrl", settings,
        created_at as "createdAt", updated_at as "updatedAt"
      FROM organizations
      WHERE id = $1 AND deleted_at IS NULL
    `,
    [organizationId]
  );

  assertExists(organization, 'Organization');

  // Cache for 5 minutes
  await cache.set(cacheKey, organization, 300);

  return organization;
};

/**
 * Get organization by slug
 */
export const getOrganizationBySlug = async (slug: string): Promise<Organization> => {
  const organization = await db.one<Organization>(
    `
      SELECT 
        id, name, slug, description, website, industry, size,
        logo_url as "logoUrl", settings,
        created_at as "createdAt", updated_at as "updatedAt"
      FROM organizations
      WHERE slug = $1 AND deleted_at IS NULL
    `,
    [slug]
  );

  assertExists(organization, 'Organization');

  return organization;
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
  // Build update query
  const updates: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  if (data.name !== undefined) {
    updates.push(`name = $${paramIndex++}`);
    values.push(data.name);
    
    // Generate new slug if name changed
    const newSlug = await generateSlug(data.name);
    updates.push(`slug = $${paramIndex++}`);
    values.push(newSlug);
  }

  if (data.description !== undefined) {
    updates.push(`description = $${paramIndex++}`);
    values.push(data.description);
  }

  if (data.website !== undefined) {
    updates.push(`website = $${paramIndex++}`);
    values.push(data.website);
  }

  if (data.industry !== undefined) {
    updates.push(`industry = $${paramIndex++}`);
    values.push(data.industry);
  }

  if (data.size !== undefined) {
    updates.push(`size = $${paramIndex++}`);
    values.push(data.size);
  }

  if (data.logoUrl !== undefined) {
    updates.push(`logo_url = $${paramIndex++}`);
    values.push(data.logoUrl);
  }

  if (updates.length === 0) {
    throw new BadRequestError('No fields to update');
  }

  values.push(organizationId);

  const organization = await db.one<Organization>(
    `
      UPDATE organizations
      SET ${updates.join(', ')}, updated_at = NOW()
      WHERE id = $${paramIndex} AND deleted_at IS NULL
      RETURNING 
        id, name, slug, description, website, industry, size,
        logo_url as "logoUrl", settings,
        created_at as "createdAt", updated_at as "updatedAt"
    `,
    values
  );

  // Clear cache
  await cache.del(`organization:${organizationId}`);

  logger.info('Organization updated', { organizationId });

  return organization;
};

/**
 * Update organization settings
 */
export const updateOrganizationSettings = async (
  organizationId: string,
  settings: any
): Promise<Organization> => {
  const organization = await db.one<Organization>(
    `
      UPDATE organizations
      SET settings = $1, updated_at = NOW()
      WHERE id = $2 AND deleted_at IS NULL
      RETURNING 
        id, name, slug, description, website, industry, size,
        logo_url as "logoUrl", settings,
        created_at as "createdAt", updated_at as "updatedAt"
    `,
    [JSON.stringify(settings), organizationId]
  );

  assertExists(organization, 'Organization');

  // Clear cache
  await cache.del(`organization:${organizationId}`);

  return organization;
};

/**
 * Delete organization (soft delete)
 */
export const deleteOrganization = async (organizationId: string): Promise<void> => {
  await db.raw(
    'UPDATE organizations SET deleted_at = NOW() WHERE id = $1',
    [organizationId]
  );

  // Clear cache
  await cache.del(`organization:${organizationId}`);

  logger.info('Organization deleted', { organizationId });
};

/**
 * Get user's organizations
 */
export const getUserOrganizations = async (userId: string): Promise<OrganizationWithRole[]> => {
  const organizations = await db.any<OrganizationWithRole>(
    `
      SELECT 
        o.id, o.name, o.slug, o.description, o.website,
        o.logo_url as "logoUrl",
        om.role as "memberRole",
        o.created_at as "createdAt",
        (SELECT COUNT(*) FROM organization_members WHERE organization_id = o.id AND deleted_at IS NULL) as "memberCount"
      FROM organizations o
      INNER JOIN organization_members om ON o.id = om.organization_id
      WHERE om.user_id = $1 AND o.deleted_at IS NULL AND om.deleted_at IS NULL
      ORDER BY om.joined_at DESC
    `,
    [userId]
  );

  return organizations;
};

/**
 * Get organization members
 */
export const getOrganizationMembers = async (
  organizationId: string
): Promise<OrganizationMember[]> => {
  const members = await db.any<OrganizationMember>(
    `
      SELECT 
        om.id, om.user_id as "userId", om.organization_id as "organizationId",
        om.role, om.joined_at as "joinedAt",
        json_build_object(
          'id', u.id,
          'email', u.email,
          'fullName', u.full_name,
          'avatarUrl', u.avatar_url
        ) as user
      FROM organization_members om
      INNER JOIN users u ON om.user_id = u.id
      WHERE om.organization_id = $1 AND om.deleted_at IS NULL AND u.deleted_at IS NULL
      ORDER BY 
        CASE om.role
          WHEN 'owner' THEN 1
          WHEN 'admin' THEN 2
          WHEN 'member' THEN 3
          WHEN 'viewer' THEN 4
        END,
        om.joined_at ASC
    `,
    [organizationId]
  );

  return members;
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
  const existingMember = await db.one<{ id: string }>(
    `
      SELECT id FROM organization_members
      WHERE organization_id = $1 AND user_id = $2 AND deleted_at IS NULL
    `,
    [organizationId, userId]
  );

  if (existingMember) {
    throw new ConflictError('User is already a member of this organization');
  }

  // Add member
  const member = await db.one<OrganizationMember>(
    `
      INSERT INTO organization_members (
        id, organization_id, user_id, role
      ) VALUES (
        gen_random_uuid(), $1, $2, $3
      )
      RETURNING 
        id, user_id as "userId", organization_id as "organizationId",
        role, joined_at as "joinedAt"
    `,
    [organizationId, userId, role]
  );

  logger.info('Organization member added', { organizationId, userId, role });

  return member;
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
    const ownerCount = await db.one<{ count: number }>(
      `
        SELECT COUNT(*) as count
        FROM organization_members
        WHERE organization_id = $1 AND role = 'owner' AND deleted_at IS NULL
      `,
      [organizationId]
    );

    const currentMember = await db.one<{ role: string }>(
      `
        SELECT role FROM organization_members
        WHERE organization_id = $1 AND user_id = $2 AND deleted_at IS NULL
      `,
      [organizationId, userId]
    );

    if (currentMember?.role === 'owner' && (ownerCount?.count || 0) <= 1) {
      throw new BadRequestError('Cannot remove the last owner from organization');
    }
  }

  const member = await db.one<OrganizationMember>(
    `
      UPDATE organization_members
      SET role = $1, updated_at = NOW()
      WHERE organization_id = $2 AND user_id = $3 AND deleted_at IS NULL
      RETURNING 
        id, user_id as "userId", organization_id as "organizationId",
        role, joined_at as "joinedAt"
    `,
    [role, organizationId, userId]
  );

  assertExists(member, 'Organization member');

  logger.info('Member role updated', { organizationId, userId, role });

  return member;
};

/**
 * Remove member from organization
 */
export const removeMember = async (
  organizationId: string,
  userId: string
): Promise<void> => {
  // Check if user is the last owner
  const member = await db.one<{ role: string }>(
    `
      SELECT role FROM organization_members
      WHERE organization_id = $1 AND user_id = $2 AND deleted_at IS NULL
    `,
    [organizationId, userId]
  );

  if (member?.role === 'owner') {
    const ownerCount = await db.one<{ count: number }>(
      `
        SELECT COUNT(*) as count
        FROM organization_members
        WHERE organization_id = $1 AND role = 'owner' AND deleted_at IS NULL
      `,
      [organizationId]
    );

    if ((ownerCount?.count || 0) <= 1) {
      throw new BadRequestError('Cannot remove the last owner from organization');
    }
  }

  await db.raw(
    `
      UPDATE organization_members
      SET deleted_at = NOW()
      WHERE organization_id = $1 AND user_id = $2
    `,
    [organizationId, userId]
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
  const member = await db.one<{ role: OrganizationRole }>(
    `
      SELECT role FROM organization_members
      WHERE organization_id = $1 AND user_id = $2 AND deleted_at IS NULL
    `,
    [organizationId, userId]
  );

  return member?.role || null;
};

/**
 * Check if user is member of organization
 */
export const isMember = async (
  organizationId: string,
  userId: string
): Promise<boolean> => {
  const exists = await db.exists(
    `
      SELECT 1 FROM organization_members
      WHERE organization_id = $1 AND user_id = $2 AND deleted_at IS NULL
    `,
    [organizationId, userId]
  );

  return exists;
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
