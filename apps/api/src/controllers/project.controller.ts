/**
 * Project Controller
 * 
 * Handles HTTP requests for project management endpoints.
 * Includes project CRUD, member management, and project operations.
 * 
 * Edge-compatible Hono implementation.
 * Functions: 15 total (CRUD, members, status operations)
 * 
 * ELITE PATTERN: Controllers NEVER parse/validate - they blindly trust c.req.valid()
 * All validation happens at route level via @hono/zod-validator
 */

import { Context } from 'hono';
import { z } from 'zod';
import * as projectService from '../services/project.service';
import * as organizationService from '../services/organization.service';
import {
  createProjectSchema,
  updateProjectSchema,
  updateProjectSettingsSchema,
  addProjectMemberSchema,
  projectListQuerySchema,
  OrganizationRole,
} from '@validiant/shared';

/**
 * Check organization access
 */
const checkOrganizationAccess = async (
  organizationId: string,
  userId: string
): Promise<boolean> => {
  return await organizationService.isMember(organizationId, userId);
};

/**
 * Check project access
 */
const checkProjectAccess = async (projectId: string, userId: string): Promise<boolean> => {
  return await projectService.isProjectMember(projectId, userId);
};

/**
 * Create project
 * POST /api/v1/projects
 * 
 * Payload validated by zValidator(createProjectSchema) at route level
 */
export const createProject = async (c: Context) => {
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

    // ELITE PATTERN: Explicit type casting for decoupled validation
    const validatedData = (await c.req.json()) as z.infer<typeof createProjectSchema>;

    // Check organization access
    const hasAccess = await checkOrganizationAccess(validatedData.organizationId, user.userId);
    if (!hasAccess) {
      return c.json(
        {
          success: false,
          error: 'Forbidden',
          message: 'You are not a member of this organization',
        },
        403
      );
    }

    const project = await projectService.createProject(
      validatedData.organizationId,
      user.userId,
      {
        ...validatedData,
        startDate: validatedData.startDate ? new Date(validatedData.startDate) : undefined,
        endDate: validatedData.endDate ? new Date(validatedData.endDate) : undefined,
      }
    );

    return c.json(
      {
        success: true,
        message: 'Project created successfully',
        data: { project },
      },
      201
    );
  } catch (error) {
    console.error('Create project error:', error);
    return c.json(
      {
        success: false,
        error: 'Failed to create project',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
};

/**
 * Get current user's projects
 * GET /api/v1/projects/my
 */
export const getMyProjects = async (c: Context) => {
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

    const projects = await projectService.getUserProjects(user.userId);

    return c.json({
      success: true,
      data: { projects },
    });
  } catch (error) {
    console.error('Get my projects error:', error);
    return c.json(
      {
        success: false,
        error: 'Failed to get projects',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
};

/**
 * Get project by ID
 * GET /api/v1/projects/:id
 */
export const getProjectById = async (c: Context) => {
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
          message: 'Project ID is required',
        },
        400
      );
    }

    // Check project access
    const hasAccess = await checkProjectAccess(id, user.userId);
    if (!hasAccess) {
      return c.json(
        {
          success: false,
          error: 'Forbidden',
          message: 'You are not a member of this project',
        },
        403
      );
    }

    const project = await projectService.getProjectById(id);

    return c.json({
      success: true,
      data: { project },
    });
  } catch (error) {
    console.error('Get project by ID error:', error);
    return c.json(
      {
        success: false,
        error: 'Failed to get project',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
};

/**
 * Update project
 * PUT /api/v1/projects/:id
 * 
 * Payload validated by zValidator(updateProjectSchema) at route level
 */
export const updateProject = async (c: Context) => {
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
          message: 'Project ID is required',
        },
        400
      );
    }

    // Check project access
    const hasAccess = await checkProjectAccess(id, user.userId);
    if (!hasAccess) {
      return c.json(
        {
          success: false,
          error: 'Forbidden',
          message: 'You are not a member of this project',
        },
        403
      );
    }

    // ELITE PATTERN: Explicit type casting for decoupled validation
    const validatedData = (await c.req.json()) as z.infer<typeof updateProjectSchema>;

    const project = await projectService.updateProject(id, {
      ...validatedData,
      startDate: validatedData.startDate ? new Date(validatedData.startDate) : undefined,
      endDate: validatedData.endDate ? new Date(validatedData.endDate) : undefined,
    });

    return c.json({
      success: true,
      message: 'Project updated successfully',
      data: { project },
    });
  } catch (error) {
    console.error('Update project error:', error);
    return c.json(
      {
        success: false,
        error: 'Failed to update project',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
};

/**
 * Update project settings
 * PATCH /api/v1/projects/:id/settings
 * 
 * Payload validated by zValidator(updateProjectSettingsSchema) at route level
 */
export const updateProjectSettings = async (c: Context) => {
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
          message: 'Project ID is required',
        },
        400
      );
    }

    // Check project access
    const hasAccess = await checkProjectAccess(id, user.userId);
    if (!hasAccess) {
      return c.json(
        {
          success: false,
          error: 'Forbidden',
          message: 'You are not a member of this project',
        },
        403
      );
    }

    // ELITE PATTERN: Explicit type casting for decoupled validation
    const validatedData = (await c.req.json()) as z.infer<typeof updateProjectSettingsSchema>;

    const project = await projectService.updateProjectSettings(id, validatedData.settings);

    return c.json({
      success: true,
      message: 'Project settings updated successfully',
      data: { project },
    });
  } catch (error) {
    console.error('Update project settings error:', error);
    return c.json(
      {
        success: false,
        error: 'Failed to update project settings',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
};

/**
 * Delete project
 * DELETE /api/v1/projects/:id
 */
export const deleteProject = async (c: Context) => {
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
          message: 'Project ID is required',
        },
        400
      );
    }

    // Check project access
    const hasAccess = await checkProjectAccess(id, user.userId);
    if (!hasAccess) {
      return c.json(
        {
          success: false,
          error: 'Forbidden',
          message: 'You are not a member of this project',
        },
        403
      );
    }

    // Get project to check organization
    const project = await projectService.getProjectById(id);

    // Check if user is org admin/owner
    const userRole = await organizationService.getUserRole(project.organizationId, user.userId);
    if (userRole !== OrganizationRole.OWNER && userRole !== OrganizationRole.ADMIN) {
      return c.json(
        {
          success: false,
          error: 'Forbidden',
          message: 'Only organization owners and admins can delete projects',
        },
        403
      );
    }

    await projectService.deleteProject(id);

    return c.json({
      success: true,
      message: 'Project deleted successfully',
      data: null,
    });
  } catch (error) {
    console.error('Delete project error:', error);
    return c.json(
      {
        success: false,
        error: 'Failed to delete project',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
};

/**
 * List organization projects
 * GET /api/v1/organizations/:organizationId/projects
 * 
 * Query validated by zValidator(projectListQuerySchema) at route level
 */
export const listOrganizationProjects = async (c: Context) => {
  try {
    const user = c.get('user');
    const organizationId = c.req.param('organizationId');

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

    if (!organizationId) {
      return c.json(
        {
          success: false,
          error: 'Bad Request',
          message: 'Organization ID is required',
        },
        400
      );
    }

    // Check organization access
    const hasAccess = await checkOrganizationAccess(organizationId, user.userId);
    if (!hasAccess) {
      return c.json(
        {
          success: false,
          error: 'Forbidden',
          message: 'You are not a member of this organization',
        },
        403
      );
    }

    // ELITE PATTERN: Explicit type casting for decoupled validation
    const validatedQuery = c.req.query() as unknown as z.infer<typeof projectListQuerySchema>;

    const result = await projectService.listOrganizationProjects(organizationId, {
      status: validatedQuery.status,
      priority: validatedQuery.priority,
      search: validatedQuery.search,
      page: validatedQuery.page,
      perPage: validatedQuery.perPage,
    });

    return c.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('List organization projects error:', error);
    return c.json(
      {
        success: false,
        error: 'Failed to list projects',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
};

/**
 * Get project members
 * GET /api/v1/projects/:id/members
 */
export const getProjectMembers = async (c: Context) => {
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
          message: 'Project ID is required',
        },
        400
      );
    }

    // Check project access
    const hasAccess = await checkProjectAccess(id, user.userId);
    if (!hasAccess) {
      return c.json(
        {
          success: false,
          error: 'Forbidden',
          message: 'You are not a member of this project',
        },
        403
      );
    }

    const members = await projectService.getProjectMembers(id);

    return c.json({
      success: true,
      data: { members },
    });
  } catch (error) {
    console.error('Get project members error:', error);
    return c.json(
      {
        success: false,
        error: 'Failed to get project members',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
};

/**
 * Add member to project
 * POST /api/v1/projects/:id/members
 * 
 * Payload validated by zValidator(addProjectMemberSchema) at route level
 */
export const addProjectMember = async (c: Context) => {
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
          message: 'Project ID is required',
        },
        400
      );
    }

    // Check project access
    const hasAccess = await checkProjectAccess(id, user.userId);
    if (!hasAccess) {
      return c.json(
        {
          success: false,
          error: 'Forbidden',
          message: 'You are not a member of this project',
        },
        403
      );
    }

    // ELITE PATTERN: Explicit type casting for decoupled validation
    const validatedData = (await c.req.json()) as z.infer<typeof addProjectMemberSchema>;

    // Verify user is in the same organization
    const project = await projectService.getProjectById(id);
    const isOrgMember = await organizationService.isMember(
      project.organizationId,
      validatedData.userId
    );

    if (!isOrgMember) {
      return c.json(
        {
          success: false,
          error: 'Bad Request',
          message: 'User must be a member of the organization',
        },
        400
      );
    }

    const member = await projectService.addProjectMember(
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
    console.error('Add project member error:', error);
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
 * Remove member from project
 * DELETE /api/v1/projects/:id/members/:userId
 */
export const removeProjectMember = async (c: Context) => {
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
          message: 'Project ID and User ID are required',
        },
        400
      );
    }

    // Check project access
    const hasAccess = await checkProjectAccess(id, user.userId);
    if (!hasAccess) {
      return c.json(
        {
          success: false,
          error: 'Forbidden',
          message: 'You are not a member of this project',
        },
        403
      );
    }

    // Users can remove themselves, or org admin/owner can remove others
    if (user.userId !== userId) {
      const project = await projectService.getProjectById(id);
      const userRole = await organizationService.getUserRole(project.organizationId, user.userId);

      if (userRole !== OrganizationRole.OWNER && userRole !== OrganizationRole.ADMIN) {
        return c.json(
          {
            success: false,
            error: 'Forbidden',
            message: 'Only organization owners and admins can remove other members',
          },
          403
        );
      }
    }

    await projectService.removeProjectMember(id, userId);

    return c.json({
      success: true,
      message: 'Member removed successfully',
      data: null,
    });
  } catch (error) {
    console.error('Remove project member error:', error);
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
 * Leave project
 * POST /api/v1/projects/:id/leave
 */
export const leaveProject = async (c: Context) => {
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
          message: 'Project ID is required',
        },
        400
      );
    }

    await projectService.removeProjectMember(id, user.userId);

    return c.json({
      success: true,
      message: 'Left project successfully',
      data: null,
    });
  } catch (error) {
    console.error('Leave project error:', error);
    return c.json(
      {
        success: false,
        error: 'Failed to leave project',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
};

/**
 * Archive project
 * POST /api/v1/projects/:id/archive
 */
export const archiveProject = async (c: Context) => {
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
          message: 'Project ID is required',
        },
        400
      );
    }

    // Check project access
    const hasAccess = await checkProjectAccess(id, user.userId);
    if (!hasAccess) {
      return c.json(
        {
          success: false,
          error: 'Forbidden',
          message: 'You are not a member of this project',
        },
        403
      );
    }

    const project = await projectService.updateProject(id, {
      status: projectService.ProjectStatus.ARCHIVED,
    });

    return c.json({
      success: true,
      message: 'Project archived successfully',
      data: { project },
    });
  } catch (error) {
    console.error('Archive project error:', error);
    return c.json(
      {
        success: false,
        error: 'Failed to archive project',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
};

/**
 * Unarchive project
 * POST /api/v1/projects/:id/unarchive
 */
export const unarchiveProject = async (c: Context) => {
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
          message: 'Project ID is required',
        },
        400
      );
    }

    // Check project access
    const hasAccess = await checkProjectAccess(id, user.userId);
    if (!hasAccess) {
      return c.json(
        {
          success: false,
          error: 'Forbidden',
          message: 'You are not a member of this project',
        },
        403
      );
    }

    const project = await projectService.updateProject(id, {
      status: projectService.ProjectStatus.ACTIVE,
    });

    return c.json({
      success: true,
      message: 'Project unarchived successfully',
      data: { project },
    });
  } catch (error) {
    console.error('Unarchive project error:', error);
    return c.json(
      {
        success: false,
        error: 'Failed to unarchive project',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
};

/**
 * Complete project
 * POST /api/v1/projects/:id/complete
 */
export const completeProject = async (c: Context) => {
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
          message: 'Project ID is required',
        },
        400
      );
    }

    // Check project access
    const hasAccess = await checkProjectAccess(id, user.userId);
    if (!hasAccess) {
      return c.json(
        {
          success: false,
          error: 'Forbidden',
          message: 'You are not a member of this project',
        },
        403
      );
    }

    const project = await projectService.updateProject(id, {
      status: projectService.ProjectStatus.COMPLETED,
    });

    return c.json({
      success: true,
      message: 'Project marked as completed',
      data: { project },
    });
  } catch (error) {
    console.error('Complete project error:', error);
    return c.json(
      {
        success: false,
        error: 'Failed to complete project',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
};
