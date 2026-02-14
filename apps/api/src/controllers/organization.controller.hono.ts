/**
 * Organization Controller (Hono Version)
 * 
 * Handles HTTP requests for organization management endpoints.
 * Includes organization CRUD, member management, and team operations.
 * 
 * Migrated from Express to Hono for edge compatibility.
 * Functions: 17 total (CRUD, members, roles, permissions)
 * 
 * ELITE PATTERN: Controllers NEVER parse/validate - they blindly trust c.req.valid()
 * All validation happens at route level via @hono/zod-validator
 */

import { Context } from 'hono';
import * as organizationService from '../services/organization.service';
import { OrganizationRole } from '@validiant/shared';

/**
 * Check if user has required role in organization
 * Returns error response if insufficient permissions
 */
const checkOrganizationRole = async (
  organizationId: string,
  userId: string,
  requiredRoles: OrganizationRole[]
): Promise<{ hasPermission: boolean; userRole?: OrganizationRole }> => {
  const userRole = await organizationService.getUserRole(organizationId, userId);

  if (!userRole || !requiredRoles.includes(userRole)) {
    return { hasPermission: false, userRole };
  }

  return { hasPermission: true, userRole };
};

/**
 * Create organization
 * POST /api/v1/organizations
 * 
 * Payload validated by zValidator(createOrganizationSchema) at route level
 */
export const createOrganization = async (c: Context) => {
  try {
    const user = c.get('user');

    if (!user || !user.userId) {
      return c.json(
        {
          success: false,
          error: 'Unauthorized',
          message: 'User not authenticated',
        },
        401
      );
    }

    // ELITE PATTERN: Blindly trust pre-validated payload
    const validatedData = c.req.valid('json');

    const organization = await organizationService.createOrganization(
      user.userId,
      validatedData
    );

    return c.json(
      {
        success: true,
        message: 'Organization created successfully',
        data: { organization },
      },
      201
    );
  } catch (error) {
    console.error('Create organization error:', error);
    return c.json(
      {
        success: false,
        error: 'Failed to create organization',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
};

/**
 * Get current user's organizations
 * GET /api/v1/organizations/my
 */
export const getMyOrganizations = async (c: Context) => {
  try {
    const user = c.get('user');

    if (!user || !user.userId) {
      return c.json(
        {
          success: false,
          error: 'Unauthorized',
          message: 'User not authenticated',
        },
        401
      );
    }

    const organizations = await organizationService.getUserOrganizations(user.userId);

    return c.json({
      success: true,
      data: { organizations },
    });
  } catch (error) {
    console.error('Get my organizations error:', error);
    return c.json(
      {
        success: false,
        error: 'Failed to get organizations',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
};

/**
 * Get organization by ID
 * GET /api/v1/organizations/:id
 */
export const getOrganizationById = async (c: Context) => {
  try {
    const id = c.req.param('id');
    const user = c.get('user');

    if (!id) {
      return c.json(
        {
          success: false,
          error: 'Bad Request',
          message: 'Organization ID is required',
        },
        400
      );
    }

    // Check if user is a member
    if (user?.userId) {
      const isMember = await organizationService.isMember(id, user.userId);
      const isAdmin = user.role === 'admin' || user.role === 'super_admin';

      if (!isMember && !isAdmin) {
        return c.json(
          {
            success: false,
            error: 'Forbidden',
            message: 'You are not a member of this organization',
          },
          403
        );
      }
    }

    const organization = await organizationService.getOrganizationById(id);

    return c.json({
      success: true,
      data: { organization },
    });
  } catch (error) {
    console.error('Get organization by ID error:', error);
    return c.json(
      {
        success: false,
        error: 'Failed to get organization',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
};

/**
 * Get organization by slug
 * GET /api/v1/organizations/slug/:slug
 */
export const getOrganizationBySlug = async (c: Context) => {
  try {
    const slug = c.req.param('slug');
    const user = c.get('user');

    if (!slug) {
      return c.json(
        {
          success: false,
          error: 'Bad Request',
          message: 'Organization slug is required',
        },
        400
      );
    }

    const organization = await organizationService.getOrganizationBySlug(slug);

    // Check if user is a member
    if (user?.userId) {
      const isMember = await organizationService.isMember(organization.id, user.userId);
      const isAdmin = user.role === 'admin' || user.role === 'super_admin';

      if (!isMember && !isAdmin) {
        return c.json(
          {
            success: false,
            error: 'Forbidden',
            message: 'You are not a member of this organization',
          },
          403
        );
      }
    }

    return c.json({
      success: true,
      data: { organization },
    });
  } catch (error) {
    console.error('Get organization by slug error:', error);
    return c.json(
      {
        success: false,
        error: 'Failed to get organization',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
};

/**
 * Update organization
 * PUT /api/v1/organizations/:id
 * 
 * Payload validated by zValidator(updateOrganizationSchema) at route level
 */
export const updateOrganization = async (c: Context) => {
  try {
    const user = c.get('user');
    const id = c.req.param('id');

    if (!user || !user.userId) {
      return c.json(
        {
          success: false,
          error: 'Unauthorized',
          message: 'User not authenticated',
        },
        401
      );
    }

    if (!id) {
      return c.json(
        {
          success: false,
          error: 'Bad Request',
          message: 'Organization ID is required',
        },
        400
      );
    }

    // Check if user is owner or admin
    const roleCheck = await checkOrganizationRole(id, user.userId, [
      OrganizationRole.OWNER,
      OrganizationRole.ADMIN,
    ]);

    if (!roleCheck.hasPermission) {
      return c.json(
        {
          success: false,
          error: 'Forbidden',
          message: 'Insufficient permissions. Required roles: owner, admin',
        },
        403
      );
    }

    // ELITE PATTERN: Blindly trust pre-validated payload
    const validatedData = c.req.valid('json');

    const organization = await organizationService.updateOrganization(id, validatedData);

    return c.json({
      success: true,
      message: 'Organization updated successfully',
      data: { organization },
    });
  } catch (error) {
    console.error('Update organization error:', error);
    return c.json(
      {
        success: false,
        error: 'Failed to update organization',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
};

/**
 * Update organization settings
 * PATCH /api/v1/organizations/:id/settings
 * 
 * Payload validated by zValidator(updateOrganizationSettingsSchema) at route level
 */
export const updateOrganizationSettings = async (c: Context) => {
  try {
    const user = c.get('user');
    const id = c.req.param('id');

    if (!user || !user.userId) {
      return c.json(
        {
          success: false,
          error: 'Unauthorized',
          message: 'User not authenticated',
        },
        401
      );
    }

    if (!id) {
      return c.json(
        {
          success: false,
          error: 'Bad Request',
          message: 'Organization ID is required',
        },
        400
      );
    }

    // Check if user is owner or admin
    const roleCheck = await checkOrganizationRole(id, user.userId, [
      OrganizationRole.OWNER,
      OrganizationRole.ADMIN,
    ]);

    if (!roleCheck.hasPermission) {
      return c.json(
        {
          success: false,
          error: 'Forbidden',
          message: 'Insufficient permissions. Required roles: owner, admin',
        },
        403
      );
    }

    // ELITE PATTERN: Blindly trust pre-validated payload
    const { settings } = c.req.valid('json');

    const organization = await organizationService.updateOrganizationSettings(
      id,
      settings
    );

    return c.json({
      success: true,
      message: 'Organization settings updated successfully',
      data: { organization },
    });
  } catch (error) {
    console.error('Update organization settings error:', error);
    return c.json(
      {
        success: false,
        error: 'Failed to update organization settings',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
};

/**
 * Delete organization
 * DELETE /api/v1/organizations/:id
 */
export const deleteOrganization = async (c: Context) => {
  try {
    const user = c.get('user');
    const id = c.req.param('id');

    if (!user || !user.userId) {
      return c.json(
        {
          success: false,
          error: 'Unauthorized',
          message: 'User not authenticated',
        },
        401
      );
    }

    if (!id) {
      return c.json(
        {
          success: false,
          error: 'Bad Request',
          message: 'Organization ID is required',
        },
        400
      );
    }

    // Only owner can delete organization
    const roleCheck = await checkOrganizationRole(id, user.userId, [OrganizationRole.OWNER]);

    if (!roleCheck.hasPermission) {
      return c.json(
        {
          success: false,
          error: 'Forbidden',
          message: 'Only organization owner can delete the organization',
        },
        403
      );
    }

    await organizationService.deleteOrganization(id);

    return c.json({
      success: true,
      message: 'Organization deleted successfully',
      data: null,
    });
  } catch (error) {
    console.error('Delete organization error:', error);
    return c.json(
      {
        success: false,
        error: 'Failed to delete organization',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
};

/**
 * Get organization members
 * GET /api/v1/organizations/:id/members
 */
export const getOrganizationMembers = async (c: Context) => {
  try {
    const user = c.get('user');
    const id = c.req.param('id');

    if (!user || !user.userId) {
      return c.json(
        {
          success: false,
          error: 'Unauthorized',
          message: 'User not authenticated',
        },
        401
      );
    }

    if (!id) {
      return c.json(
        {
          success: false,
          error: 'Bad Request',
          message: 'Organization ID is required',
        },
        400
      );
    }

    // Check if user is a member
    const isMember = await organizationService.isMember(id, user.userId);
    const isAdmin = user.role === 'admin' || user.role === 'super_admin';

    if (!isMember && !isAdmin) {
      return c.json(
        {
          success: false,
          error: 'Forbidden',
          message: 'You are not a member of this organization',
        },
        403
      );
    }

    const members = await organizationService.getOrganizationMembers(id);

    return c.json({
      success: true,
      data: { members },
    });
  } catch (error) {
    console.error('Get organization members error:', error);
    return c.json(
      {
        success: false,
        error: 'Failed to get organization members',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
};

/**
 * Add member to organization
 * POST /api/v1/organizations/:id/members
 * 
 * Payload validated by zValidator(addOrganizationMemberSchema) at route level
 */
export const addOrganizationMember = async (c: Context) => {
  try {
    const user = c.get('user');
    const id = c.req.param('id');

    if (!user || !user.userId) {
      return c.json(
        {
          success: false,
          error: 'Unauthorized',
          message: 'User not authenticated',
        },
        401
      );
    }

    if (!id) {
      return c.json(
        {
          success: false,
          error: 'Bad Request',
          message: 'Organization ID is required',
        },
        400
      );
    }

    // Check if user is owner or admin
    const roleCheck = await checkOrganizationRole(id, user.userId, [
      OrganizationRole.OWNER,
      OrganizationRole.ADMIN,
    ]);

    if (!roleCheck.hasPermission) {
      return c.json(
        {
          success: false,
          error: 'Forbidden',
          message: 'Insufficient permissions. Required roles: owner, admin',
        },
        403
      );
    }

    // ELITE PATTERN: Blindly trust pre-validated payload
    const validatedData = c.req.valid('json');

    const member = await organizationService.addOrganizationMember(
      id,
      validatedData.userId,
      validatedData.role
    );

    return c.json(
      {
        success: true,
        message: 'Member added successfully',
        data: { member },
      },
      201
    );
  } catch (error) {
    console.error('Add organization member error:', error);
    return c.json(
      {
        success: false,
        error: 'Failed to add member',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
};

/**
 * Update member role
 * PATCH /api/v1/organizations/:id/members/:userId/role
 * 
 * Payload validated by zValidator(updateMemberRoleSchema) at route level
 */
export const updateMemberRole = async (c: Context) => {
  try {
    const user = c.get('user');
    const id = c.req.param('id');
    const userId = c.req.param('userId');

    if (!user || !user.userId) {
      return c.json(
        {
          success: false,
          error: 'Unauthorized',
          message: 'User not authenticated',
        },
        401
      );
    }

    if (!id || !userId) {
      return c.json(
        {
          success: false,
          error: 'Bad Request',
          message: 'Organization ID and User ID are required',
        },
        400
      );
    }

    // Prevent self-role modification
    if (user.userId === userId) {
      return c.json(
        {
          success: false,
          error: 'Forbidden',
          message: 'Cannot modify your own role',
        },
        403
      );
    }

    // Check if user is owner or admin
    const roleCheck = await checkOrganizationRole(id, user.userId, [
      OrganizationRole.OWNER,
      OrganizationRole.ADMIN,
    ]);

    if (!roleCheck.hasPermission) {
      return c.json(
        {
          success: false,
          error: 'Forbidden',
          message: 'Insufficient permissions. Required roles: owner, admin',
        },
        403
      );
    }

    // ELITE PATTERN: Blindly trust pre-validated payload
    const { role } = c.req.valid('json');

    // Only owners can assign owner role
    if (role === OrganizationRole.OWNER) {
      const ownerCheck = await checkOrganizationRole(id, user.userId, [OrganizationRole.OWNER]);

      if (!ownerCheck.hasPermission) {
        return c.json(
          {
            success: false,
            error: 'Forbidden',
            message: 'Only organization owner can assign owner role',
          },
          403
        );
      }
    }

    const member = await organizationService.updateMemberRole(id, userId, role);

    return c.json({
      success: true,
      message: 'Member role updated successfully',
      data: { member },
    });
  } catch (error) {
    console.error('Update member role error:', error);
    return c.json(
      {
        success: false,
        error: 'Failed to update member role',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
};

/**
 * Remove member from organization
 * DELETE /api/v1/organizations/:id/members/:userId
 */
export const removeMember = async (c: Context) => {
  try {
    const user = c.get('user');
    const id = c.req.param('id');
    const userId = c.req.param('userId');

    if (!user || !user.userId) {
      return c.json(
        {
          success: false,
          error: 'Unauthorized',
          message: 'User not authenticated',
        },
        401
      );
    }

    if (!id || !userId) {
      return c.json(
        {
          success: false,
          error: 'Bad Request',
          message: 'Organization ID and User ID are required',
        },
        400
      );
    }

    // Users can remove themselves (leave), or owner/admin can remove others
    if (user.userId !== userId) {
      const roleCheck = await checkOrganizationRole(id, user.userId, [
        OrganizationRole.OWNER,
        OrganizationRole.ADMIN,
      ]);

      if (!roleCheck.hasPermission) {
        return c.json(
          {
            success: false,
            error: 'Forbidden',
            message: 'Insufficient permissions. Required roles: owner, admin',
          },
          403
        );
      }
    }

    await organizationService.removeMember(id, userId);

    return c.json({
      success: true,
      message: 'Member removed successfully',
      data: null,
    });
  } catch (error) {
    console.error('Remove member error:', error);
    return c.json(
      {
        success: false,
        error: 'Failed to remove member',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
};

/**
 * Leave organization
 * POST /api/v1/organizations/:id/leave
 */
export const leaveOrganization = async (c: Context) => {
  try {
    const user = c.get('user');
    const id = c.req.param('id');

    if (!user || !user.userId) {
      return c.json(
        {
          success: false,
          error: 'Unauthorized',
          message: 'User not authenticated',
        },
        401
      );
    }

    if (!id) {
      return c.json(
        {
          success: false,
          error: 'Bad Request',
          message: 'Organization ID is required',
        },
        400
      );
    }

    await organizationService.leaveOrganization(id, user.userId);

    return c.json({
      success: true,
      message: 'Left organization successfully',
      data: null,
    });
  } catch (error) {
    console.error('Leave organization error:', error);
    return c.json(
      {
        success: false,
        error: 'Failed to leave organization',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
};

/**
 * Get user's role in organization
 * GET /api/v1/organizations/:id/my-role
 */
export const getMyRole = async (c: Context) => {
  try {
    const user = c.get('user');
    const id = c.req.param('id');

    if (!user || !user.userId) {
      return c.json(
        {
          success: false,
          error: 'Unauthorized',
          message: 'User not authenticated',
        },
        401
      );
    }

    if (!id) {
      return c.json(
        {
          success: false,
          error: 'Bad Request',
          message: 'Organization ID is required',
        },
        400
      );
    }

    const role = await organizationService.getUserRole(id, user.userId);

    if (!role) {
      return c.json(
        {
          success: false,
          error: 'Forbidden',
          message: 'You are not a member of this organization',
        },
        403
      );
    }

    return c.json({
      success: true,
      data: { role },
    });
  } catch (error) {
    console.error('Get my role error:', error);
    return c.json(
      {
        success: false,
        error: 'Failed to get role',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
};

/**
 * Check if user is member
 * GET /api/v1/organizations/:id/is-member
 */
export const checkMembership = async (c: Context) => {
  try {
    const user = c.get('user');
    const id = c.req.param('id');

    if (!user || !user.userId) {
      return c.json(
        {
          success: false,
          error: 'Unauthorized',
          message: 'User not authenticated',
        },
        401
      );
    }

    if (!id) {
      return c.json(
        {
          success: false,
          error: 'Bad Request',
          message: 'Organization ID is required',
        },
        400
      );
    }

    const isMember = await organizationService.isMember(id, user.userId);

    return c.json({
      success: true,
      data: { isMember },
    });
  } catch (error) {
    console.error('Check membership error:', error);
    return c.json(
      {
        success: false,
        error: 'Failed to check membership',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
};

/**
 * Transfer ownership
 * POST /api/v1/organizations/:id/transfer-ownership
 * 
 * No validation schema yet - accepts raw JSON with newOwnerId
 */
export const transferOwnership = async (c: Context) => {
  try {
    const user = c.get('user');
    const id = c.req.param('id');

    if (!user || !user.userId) {
      return c.json(
        {
          success: false,
          error: 'Unauthorized',
          message: 'User not authenticated',
        },
        401
      );
    }

    if (!id) {
      return c.json(
        {
          success: false,
          error: 'Bad Request',
          message: 'Organization ID is required',
        },
        400
      );
    }

    const body = await c.req.json();
    const { newOwnerId } = body;

    if (!newOwnerId) {
      return c.json(
        {
          success: false,
          error: 'Bad Request',
          message: 'New owner ID is required',
        },
        400
      );
    }

    // Only current owner can transfer ownership
    const roleCheck = await checkOrganizationRole(id, user.userId, [OrganizationRole.OWNER]);

    if (!roleCheck.hasPermission) {
      return c.json(
        {
          success: false,
          error: 'Forbidden',
          message: 'Only organization owner can transfer ownership',
        },
        403
      );
    }

    // Check if new owner is a member
    const isMember = await organizationService.isMember(id, newOwnerId);
    if (!isMember) {
      return c.json(
        {
          success: false,
          error: 'Bad Request',
          message: 'New owner must be a member of the organization',
        },
        400
      );
    }

    // Update new owner's role
    await organizationService.updateMemberRole(id, newOwnerId, OrganizationRole.OWNER);

    // Downgrade current owner to admin
    await organizationService.updateMemberRole(id, user.userId, OrganizationRole.ADMIN);

    return c.json({
      success: true,
      message: 'Ownership transferred successfully',
      data: null,
    });
  } catch (error) {
    console.error('Transfer ownership error:', error);
    return c.json(
      {
        success: false,
        error: 'Failed to transfer ownership',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
};
