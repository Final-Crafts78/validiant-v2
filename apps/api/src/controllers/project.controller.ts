/**
 * Project Controller
 * 
 * Handles HTTP requests for project management endpoints.
 * Includes project CRUD, member management, and project operations.
 */

import { Response } from 'express';
import { AuthRequest, asyncHandler } from '../middleware';
import * as projectService from '../services/project.service';
import * as organizationService from '../services/organization.service';
import { BadRequestError, ForbiddenError } from '../utils/errors';
import { logger } from '../utils/logger';
import {
  createProjectSchema,
  updateProjectSchema,
  updateProjectSettingsSchema,
  addProjectMemberSchema,
  projectListQuerySchema,
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
 * Check organization access
 */
const checkOrganizationAccess = async (
  organizationId: string,
  userId: string
): Promise<void> => {
  const isMember = await organizationService.isMember(organizationId, userId);
  if (!isMember) {
    throw new ForbiddenError('You are not a member of this organization');
  }
};

/**
 * Check project access
 */
const checkProjectAccess = async (
  projectId: string,
  userId: string
): Promise<void> => {
  const isMember = await projectService.isProjectMember(projectId, userId);
  if (!isMember) {
    throw new ForbiddenError('You are not a member of this project');
  }
};

/**
 * Create project
 * POST /api/v1/projects
 */
export const createProject = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw new BadRequestError('User not authenticated');
  }

  const validatedData = createProjectSchema.parse(req.body);

  // Check organization access
  await checkOrganizationAccess(validatedData.organizationId, req.user.id);

  const project = await projectService.createProject(
    validatedData.organizationId,
    req.user.id,
    validatedData
  );

  sendSuccess(res, { project }, 'Project created successfully', 201);
});

/**
 * Get current user's projects
 * GET /api/v1/projects/my
 */
export const getMyProjects = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw new BadRequestError('User not authenticated');
  }

  const projects = await projectService.getUserProjects(req.user.id);

  sendSuccess(res, { projects });
});

/**
 * Get project by ID
 * GET /api/v1/projects/:id
 */
export const getProjectById = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw new BadRequestError('User not authenticated');
  }

  const { id } = req.params;

  if (!id) {
    throw new BadRequestError('Project ID is required');
  }

  // Check project access
  await checkProjectAccess(id, req.user.id);

  const project = await projectService.getProjectById(id);

  sendSuccess(res, { project });
});

/**
 * Update project
 * PUT /api/v1/projects/:id
 */
export const updateProject = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw new BadRequestError('User not authenticated');
  }

  const { id } = req.params;

  if (!id) {
    throw new BadRequestError('Project ID is required');
  }

  // Check project access
  await checkProjectAccess(id, req.user.id);

  const validatedData = updateProjectSchema.parse(req.body);

  const project = await projectService.updateProject(id, validatedData);

  sendSuccess(res, { project }, 'Project updated successfully');
});

/**
 * Update project settings
 * PATCH /api/v1/projects/:id/settings
 */
export const updateProjectSettings = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      throw new BadRequestError('User not authenticated');
    }

    const { id } = req.params;

    if (!id) {
      throw new BadRequestError('Project ID is required');
    }

    // Check project access
    await checkProjectAccess(id, req.user.id);

    const validatedData = updateProjectSettingsSchema.parse(req.body);

    const project = await projectService.updateProjectSettings(id, validatedData.settings);

    sendSuccess(res, { project }, 'Project settings updated successfully');
  }
);

/**
 * Delete project
 * DELETE /api/v1/projects/:id
 */
export const deleteProject = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw new BadRequestError('User not authenticated');
  }

  const { id } = req.params;

  if (!id) {
    throw new BadRequestError('Project ID is required');
  }

  // Check project access
  await checkProjectAccess(id, req.user.id);

  // Get project to check organization
  const project = await projectService.getProjectById(id);

  // Check if user is org admin/owner
  const userRole = await organizationService.getUserRole(project.organizationId, req.user.id);
  if (userRole !== OrganizationRole.OWNER && userRole !== OrganizationRole.ADMIN) {
    throw new ForbiddenError('Only organization owners and admins can delete projects');
  }

  await projectService.deleteProject(id);

  sendSuccess(res, null, 'Project deleted successfully');
});

/**
 * List organization projects
 * GET /api/v1/organizations/:organizationId/projects
 */
export const listOrganizationProjects = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      throw new BadRequestError('User not authenticated');
    }

    const { organizationId } = req.params;

    if (!organizationId) {
      throw new BadRequestError('Organization ID is required');
    }

    // Check organization access
    await checkOrganizationAccess(organizationId, req.user.id);

    const validatedQuery = projectListQuerySchema.parse(req.query);

    const result = await projectService.listOrganizationProjects(organizationId, {
      status: validatedQuery.status,
      priority: validatedQuery.priority,
      search: validatedQuery.search,
      page: validatedQuery.page,
      perPage: validatedQuery.perPage,
    });

    sendSuccess(res, result);
  }
);

/**
 * Get project members
 * GET /api/v1/projects/:id/members
 */
export const getProjectMembers = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw new BadRequestError('User not authenticated');
  }

  const { id } = req.params;

  if (!id) {
    throw new BadRequestError('Project ID is required');
  }

  // Check project access
  await checkProjectAccess(id, req.user.id);

  const members = await projectService.getProjectMembers(id);

  sendSuccess(res, { members });
});

/**
 * Add member to project
 * POST /api/v1/projects/:id/members
 */
export const addProjectMember = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw new BadRequestError('User not authenticated');
  }

  const { id } = req.params;

  if (!id) {
    throw new BadRequestError('Project ID is required');
  }

  // Check project access
  await checkProjectAccess(id, req.user.id);

  const validatedData = addProjectMemberSchema.parse(req.body);

  // Verify user is in the same organization
  const project = await projectService.getProjectById(id);
  const isOrgMember = await organizationService.isMember(
    project.organizationId,
    validatedData.userId
  );

  if (!isOrgMember) {
    throw new BadRequestError('User must be a member of the organization');
  }

  const member = await projectService.addProjectMember(
    id,
    validatedData.userId,
    validatedData.role
  );

  sendSuccess(res, { member }, 'Member added successfully', 201);
});

/**
 * Remove member from project
 * DELETE /api/v1/projects/:id/members/:userId
 */
export const removeProjectMember = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw new BadRequestError('User not authenticated');
  }

  const { id, userId } = req.params;

  if (!id || !userId) {
    throw new BadRequestError('Project ID and User ID are required');
  }

  // Check project access
  await checkProjectAccess(id, req.user.id);

  // Users can remove themselves, or org admin/owner can remove others
  if (req.user.id !== userId) {
    const project = await projectService.getProjectById(id);
    const userRole = await organizationService.getUserRole(project.organizationId, req.user.id);
    
    if (userRole !== OrganizationRole.OWNER && userRole !== OrganizationRole.ADMIN) {
      throw new ForbiddenError('Only organization owners and admins can remove other members');
    }
  }

  await projectService.removeProjectMember(id, userId);

  sendSuccess(res, null, 'Member removed successfully');
});

/**
 * Leave project
 * POST /api/v1/projects/:id/leave
 */
export const leaveProject = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw new BadRequestError('User not authenticated');
  }

  const { id } = req.params;

  if (!id) {
    throw new BadRequestError('Project ID is required');
  }

  await projectService.removeProjectMember(id, req.user.id);

  sendSuccess(res, null, 'Left project successfully');
});

/**
 * Archive project
 * POST /api/v1/projects/:id/archive
 */
export const archiveProject = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw new BadRequestError('User not authenticated');
  }

  const { id } = req.params;

  if (!id) {
    throw new BadRequestError('Project ID is required');
  }

  // Check project access
  await checkProjectAccess(id, req.user.id);

  const project = await projectService.updateProject(id, {
    status: projectService.ProjectStatus.ARCHIVED,
  });

  sendSuccess(res, { project }, 'Project archived successfully');
});

/**
 * Unarchive project
 * POST /api/v1/projects/:id/unarchive
 */
export const unarchiveProject = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw new BadRequestError('User not authenticated');
  }

  const { id } = req.params;

  if (!id) {
    throw new BadRequestError('Project ID is required');
  }

  // Check project access
  await checkProjectAccess(id, req.user.id);

  const project = await projectService.updateProject(id, {
    status: projectService.ProjectStatus.ACTIVE,
  });

  sendSuccess(res, { project }, 'Project unarchived successfully');
});

/**
 * Complete project
 * POST /api/v1/projects/:id/complete
 */
export const completeProject = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw new BadRequestError('User not authenticated');
  }

  const { id } = req.params;

  if (!id) {
    throw new BadRequestError('Project ID is required');
  }

  // Check project access
  await checkProjectAccess(id, req.user.id);

  const project = await projectService.updateProject(id, {
    status: projectService.ProjectStatus.COMPLETED,
  });

  sendSuccess(res, { project }, 'Project marked as completed');
});
