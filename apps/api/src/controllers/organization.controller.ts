/**
 * Organization Controller
 * 
 * Handles HTTP requests for organization management endpoints.
 * Includes organization CRUD, member management, and team operations.
 */

import { Response } from 'express';
import { AuthRequest, asyncHandler } from '../middleware';
import * as organizationService from '../services/organization.service';
import { BadRequestError, ForbiddenError } from '../utils/errors';
import { logger } from '../utils/logger';
import {
  createOrganizationSchema,
  updateOrganizationSchema,
  updateOrganizationSettingsSchema,
  addOrganizationMemberSchema,
  updateMemberRoleSchema,
} from '@validiant/shared';
import { OrganizationRole } from '@validiant/shared';

/**
 * Success response helper
 */
const sendSuccess = <T>(
  res: Response,
  data: T,
  message?: string,
  statusCode: number = 200
): void => {
  res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

/**
 * Check if user has required role in organization
 */
const checkOrganizationRole = async (
  organizationId: string,
  userId: string,
  requiredRoles: OrganizationRole[]
): Promise<void> => {
  const userRole = await organizationService.getUserRole(organizationId, userId);
  
  if (!userRole || !requiredRoles.includes(userRole)) {
    throw new ForbiddenError(
      `Insufficient permissions. Required roles: ${requiredRoles.join(', ')}`,
      { userRole, requiredRoles }
    );
  }
};

/**
 * Create organization
 * POST /api/v1/organizations
 */
export const createOrganization = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw new BadRequestError('User not authenticated');
  }

  const validatedData = createOrganizationSchema.parse(req.body);

  const organization = await organizationService.createOrganization(req.user.id, validatedData);

  sendSuccess(res, { organization }, 'Organization created successfully', 201);
});

/**
 * Get current user's organizations
 * GET /api/v1/organizations/my
 */
export const getMyOrganizations = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw new BadRequestError('User not authenticated');
  }

  const organizations = await organizationService.getUserOrganizations(req.user.id);

  sendSuccess(res, { organizations });
});

/**
 * Get organization by ID
 * GET /api/v1/organizations/:id
 */
export const getOrganizationById = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  if (!id) {
    throw new BadRequestError('Organization ID is required');
  }

  // Check if user is a member
  if (req.user) {
    const isMember = await organizationService.isMember(id, req.user.id);
    if (!isMember && req.user.role !== 'admin' && req.user.role !== 'super_admin') {
      throw new ForbiddenError('You are not a member of this organization');
    }
  }

  const organization = await organizationService.getOrganizationById(id);

  sendSuccess(res, { organization });
});

/**
 * Get organization by slug
 * GET /api/v1/organizations/slug/:slug
 */
export const getOrganizationBySlug = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { slug } = req.params;

  if (!slug) {
    throw new BadRequestError('Organization slug is required');
  }

  const organization = await organizationService.getOrganizationBySlug(slug);

  // Check if user is a member
  if (req.user) {
    const isMember = await organizationService.isMember(organization.id, req.user.id);
    if (!isMember && req.user.role !== 'admin' && req.user.role !== 'super_admin') {
      throw new ForbiddenError('You are not a member of this organization');
    }
  }

  sendSuccess(res, { organization });
});

/**
 * Update organization
 * PUT /api/v1/organizations/:id
 */
export const updateOrganization = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw new BadRequestError('User not authenticated');
  }

  const { id } = req.params;

  if (!id) {
    throw new BadRequestError('Organization ID is required');
  }

  // Check if user is owner or admin
  await checkOrganizationRole(id, req.user.id, [
    OrganizationRole.OWNER,
    OrganizationRole.ADMIN,
  ]);

  const validatedData = updateOrganizationSchema.parse(req.body);

  const organization = await organizationService.updateOrganization(id, validatedData);

  sendSuccess(res, { organization }, 'Organization updated successfully');
});

/**
 * Update organization settings
 * PATCH /api/v1/organizations/:id/settings
 */
export const updateOrganizationSettings = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      throw new BadRequestError('User not authenticated');
    }

    const { id } = req.params;

    if (!id) {
      throw new BadRequestError('Organization ID is required');
    }

    // Check if user is owner or admin
    await checkOrganizationRole(id, req.user.id, [
      OrganizationRole.OWNER,
      OrganizationRole.ADMIN,
    ]);

    const validatedData = updateOrganizationSettingsSchema.parse(req.body);

    const organization = await organizationService.updateOrganizationSettings(
      id,
      validatedData.settings
    );

    sendSuccess(res, { organization }, 'Organization settings updated successfully');
  }
);

/**
 * Delete organization
 * DELETE /api/v1/organizations/:id
 */
export const deleteOrganization = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw new BadRequestError('User not authenticated');
  }

  const { id } = req.params;

  if (!id) {
    throw new BadRequestError('Organization ID is required');
  }

  // Only owner can delete organization
  await checkOrganizationRole(id, req.user.id, [OrganizationRole.OWNER]);

  await organizationService.deleteOrganization(id);

  sendSuccess(res, null, 'Organization deleted successfully');
});

/**
 * Get organization members
 * GET /api/v1/organizations/:id/members
 */
export const getOrganizationMembers = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw new BadRequestError('User not authenticated');
  }

  const { id } = req.params;

  if (!id) {
    throw new BadRequestError('Organization ID is required');
  }

  // Check if user is a member
  const isMember = await organizationService.isMember(id, req.user.id);
  if (!isMember && req.user.role !== 'admin' && req.user.role !== 'super_admin') {
    throw new ForbiddenError('You are not a member of this organization');
  }

  const members = await organizationService.getOrganizationMembers(id);

  sendSuccess(res, { members });
});

/**
 * Add member to organization
 * POST /api/v1/organizations/:id/members
 */
export const addOrganizationMember = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw new BadRequestError('User not authenticated');
  }

  const { id } = req.params;

  if (!id) {
    throw new BadRequestError('Organization ID is required');
  }

  // Check if user is owner or admin
  await checkOrganizationRole(id, req.user.id, [
    OrganizationRole.OWNER,
    OrganizationRole.ADMIN,
  ]);

  const validatedData = addOrganizationMemberSchema.parse(req.body);

  const member = await organizationService.addOrganizationMember(
    id,
    validatedData.userId,
    validatedData.role
  );

  sendSuccess(res, { member }, 'Member added successfully', 201);
});

/**
 * Update member role
 * PATCH /api/v1/organizations/:id/members/:userId/role
 */
export const updateMemberRole = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw new BadRequestError('User not authenticated');
  }

  const { id, userId } = req.params;

  if (!id || !userId) {
    throw new BadRequestError('Organization ID and User ID are required');
  }

  // Prevent self-role modification
  if (req.user.id === userId) {
    throw new ForbiddenError('Cannot modify your own role');
  }

  // Check if user is owner or admin
  await checkOrganizationRole(id, req.user.id, [
    OrganizationRole.OWNER,
    OrganizationRole.ADMIN,
  ]);

  const validatedData = updateMemberRoleSchema.parse(req.body);

  // Only owners can assign owner role
  if (validatedData.role === OrganizationRole.OWNER) {
    await checkOrganizationRole(id, req.user.id, [OrganizationRole.OWNER]);
  }

  const member = await organizationService.updateMemberRole(id, userId, validatedData.role);

  sendSuccess(res, { member }, 'Member role updated successfully');
});

/**
 * Remove member from organization
 * DELETE /api/v1/organizations/:id/members/:userId
 */
export const removeMember = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw new BadRequestError('User not authenticated');
  }

  const { id, userId } = req.params;

  if (!id || !userId) {
    throw new BadRequestError('Organization ID and User ID are required');
  }

  // Users can remove themselves (leave), or owner/admin can remove others
  if (req.user.id !== userId) {
    await checkOrganizationRole(id, req.user.id, [
      OrganizationRole.OWNER,
      OrganizationRole.ADMIN,
    ]);
  }

  await organizationService.removeMember(id, userId);

  sendSuccess(res, null, 'Member removed successfully');
});

/**
 * Leave organization
 * POST /api/v1/organizations/:id/leave
 */
export const leaveOrganization = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw new BadRequestError('User not authenticated');
  }

  const { id } = req.params;

  if (!id) {
    throw new BadRequestError('Organization ID is required');
  }

  await organizationService.leaveOrganization(id, req.user.id);

  sendSuccess(res, null, 'Left organization successfully');
});

/**
 * Get user's role in organization
 * GET /api/v1/organizations/:id/my-role
 */
export const getMyRole = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw new BadRequestError('User not authenticated');
  }

  const { id } = req.params;

  if (!id) {
    throw new BadRequestError('Organization ID is required');
  }

  const role = await organizationService.getUserRole(id, req.user.id);

  if (!role) {
    throw new ForbiddenError('You are not a member of this organization');
  }

  sendSuccess(res, { role });
});

/**
 * Check if user is member
 * GET /api/v1/organizations/:id/is-member
 */
export const checkMembership = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw new BadRequestError('User not authenticated');
  }

  const { id } = req.params;

  if (!id) {
    throw new BadRequestError('Organization ID is required');
  }

  const isMember = await organizationService.isMember(id, req.user.id);

  sendSuccess(res, { isMember });
});

/**
 * Transfer ownership
 * POST /api/v1/organizations/:id/transfer-ownership
 */
export const transferOwnership = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw new BadRequestError('User not authenticated');
  }

  const { id } = req.params;
  const { newOwnerId } = req.body;

  if (!id) {
    throw new BadRequestError('Organization ID is required');
  }

  if (!newOwnerId) {
    throw new BadRequestError('New owner ID is required');
  }

  // Only current owner can transfer ownership
  await checkOrganizationRole(id, req.user.id, [OrganizationRole.OWNER]);

  // Check if new owner is a member
  const isMember = await organizationService.isMember(id, newOwnerId);
  if (!isMember) {
    throw new BadRequestError('New owner must be a member of the organization');
  }

  // Update new owner's role
  await organizationService.updateMemberRole(id, newOwnerId, OrganizationRole.OWNER);

  // Downgrade current owner to admin
  await organizationService.updateMemberRole(id, req.user.id, OrganizationRole.ADMIN);

  sendSuccess(res, null, 'Ownership transferred successfully');
});
