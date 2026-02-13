/**
 * Project Service
 * 
 * Handles project management, member operations, and project-related business logic.
 * Projects belong to organizations and can have multiple members.
 */

import { db } from '../config/database.config';
import { cache } from '../config/redis.config';
import {
  NotFoundError,
  ConflictError,
  BadRequestError,
  assertExists,
} from '../utils/errors';
import { logger } from '../utils/logger';

/**
 * Project status enum
 */
export enum ProjectStatus {
  PLANNING = 'planning',
  ACTIVE = 'active',
  ON_HOLD = 'on_hold',
  COMPLETED = 'completed',
  ARCHIVED = 'archived',
}

/**
 * Project priority enum
 */
export enum ProjectPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

/**
 * Project interface
 */
interface Project {
  id: string;
  organizationId: string;
  name: string;
  description?: string;
  status: ProjectStatus;
  priority: ProjectPriority;
  startDate?: Date;
  endDate?: Date;
  estimatedHours?: number;
  actualHours?: number;
  budget?: number;
  color?: string;
  icon?: string;
  settings: any;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Project with additional info
 */
interface ProjectWithStats extends Project {
  memberCount: number;
  taskCount?: number;
  completedTaskCount?: number;
  organization?: {
    id: string;
    name: string;
    slug: string;
  };
}

/**
 * Project member interface
 */
interface ProjectMember {
  id: string;
  projectId: string;
  userId: string;
  role: string;
  user?: {
    id: string;
    email: string;
    fullName: string;
    avatarUrl?: string;
  };
  joinedAt: Date;
}

/**
 * Create project
 */
export const createProject = async (
  organizationId: string,
  userId: string,
  data: {
    name: string;
    description?: string;
    status?: ProjectStatus;
    priority?: ProjectPriority;
    startDate?: Date;
    endDate?: Date;
    estimatedHours?: number;
    budget?: number;
    color?: string;
    icon?: string;
  }
): Promise<Project> => {
  const project = await db.one<Project>(
    `
      INSERT INTO projects (
        id, organization_id, name, description, status, priority,
        start_date, end_date, estimated_hours, budget, color, icon,
        settings, created_by
      ) VALUES (
        gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, '{}', $12
      )
      RETURNING 
        id, organization_id as "organizationId", name, description,
        status, priority, start_date as "startDate", end_date as "endDate",
        estimated_hours as "estimatedHours", actual_hours as "actualHours",
        budget, color, icon, settings, created_by as "createdBy",
        created_at as "createdAt", updated_at as "updatedAt"
    `,
    [
      organizationId,
      data.name,
      data.description,
      data.status || ProjectStatus.PLANNING,
      data.priority || ProjectPriority.MEDIUM,
      data.startDate,
      data.endDate,
      data.estimatedHours,
      data.budget,
      data.color,
      data.icon,
      userId,
    ]
  );

  // Add creator as project member
  await db.raw(
    `
      INSERT INTO project_members (
        id, project_id, user_id, role
      ) VALUES (
        gen_random_uuid(), $1, $2, 'owner'
      )
    `,
    [project.id, userId]
  );

  logger.info('Project created', { projectId: project.id, organizationId, userId });

  return project;
};

/**
 * Get project by ID
 */
export const getProjectById = async (projectId: string): Promise<ProjectWithStats> => {
  // Try cache first
  const cacheKey = `project:${projectId}`;
  const cached = await cache.get<ProjectWithStats>(cacheKey);
  
  if (cached) {
    return cached;
  }

  const project = await db.one<ProjectWithStats>(
    `
      SELECT 
        p.id, p.organization_id as "organizationId", p.name, p.description,
        p.status, p.priority, p.start_date as "startDate", p.end_date as "endDate",
        p.estimated_hours as "estimatedHours", p.actual_hours as "actualHours",
        p.budget, p.color, p.icon, p.settings, p.created_by as "createdBy",
        p.created_at as "createdAt", p.updated_at as "updatedAt",
        (SELECT COUNT(*) FROM project_members WHERE project_id = p.id AND deleted_at IS NULL) as "memberCount",
        json_build_object(
          'id', o.id,
          'name', o.name,
          'slug', o.slug
        ) as organization
      FROM projects p
      INNER JOIN organizations o ON p.organization_id = o.id
      WHERE p.id = $1 AND p.deleted_at IS NULL AND o.deleted_at IS NULL
    `,
    [projectId]
  );

  assertExists(project, 'Project');

  // Cache for 5 minutes
  await cache.set(cacheKey, project, 300);

  return project;
};

/**
 * Update project
 */
export const updateProject = async (
  projectId: string,
  data: {
    name?: string;
    description?: string;
    status?: ProjectStatus;
    priority?: ProjectPriority;
    startDate?: Date;
    endDate?: Date;
    estimatedHours?: number;
    budget?: number;
    color?: string;
    icon?: string;
  }
): Promise<Project> => {
  // Build update query
  const updates: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  if (data.name !== undefined) {
    updates.push(`name = $${paramIndex++}`);
    values.push(data.name);
  }

  if (data.description !== undefined) {
    updates.push(`description = $${paramIndex++}`);
    values.push(data.description);
  }

  if (data.status !== undefined) {
    updates.push(`status = $${paramIndex++}`);
    values.push(data.status);
  }

  if (data.priority !== undefined) {
    updates.push(`priority = $${paramIndex++}`);
    values.push(data.priority);
  }

  if (data.startDate !== undefined) {
    updates.push(`start_date = $${paramIndex++}`);
    values.push(data.startDate);
  }

  if (data.endDate !== undefined) {
    updates.push(`end_date = $${paramIndex++}`);
    values.push(data.endDate);
  }

  if (data.estimatedHours !== undefined) {
    updates.push(`estimated_hours = $${paramIndex++}`);
    values.push(data.estimatedHours);
  }

  if (data.budget !== undefined) {
    updates.push(`budget = $${paramIndex++}`);
    values.push(data.budget);
  }

  if (data.color !== undefined) {
    updates.push(`color = $${paramIndex++}`);
    values.push(data.color);
  }

  if (data.icon !== undefined) {
    updates.push(`icon = $${paramIndex++}`);
    values.push(data.icon);
  }

  if (updates.length === 0) {
    throw new BadRequestError('No fields to update');
  }

  values.push(projectId);

  const project = await db.one<Project>(
    `
      UPDATE projects
      SET ${updates.join(', ')}, updated_at = NOW()
      WHERE id = $${paramIndex} AND deleted_at IS NULL
      RETURNING 
        id, organization_id as "organizationId", name, description,
        status, priority, start_date as "startDate", end_date as "endDate",
        estimated_hours as "estimatedHours", actual_hours as "actualHours",
        budget, color, icon, settings, created_by as "createdBy",
        created_at as "createdAt", updated_at as "updatedAt"
    `,
    values
  );

  // Clear cache
  await cache.del(`project:${projectId}`);

  logger.info('Project updated', { projectId });

  return project;
};

/**
 * Update project settings
 */
export const updateProjectSettings = async (
  projectId: string,
  settings: any
): Promise<Project> => {
  const project = await db.one<Project>(
    `
      UPDATE projects
      SET settings = $1, updated_at = NOW()
      WHERE id = $2 AND deleted_at IS NULL
      RETURNING 
        id, organization_id as "organizationId", name, description,
        status, priority, start_date as "startDate", end_date as "endDate",
        estimated_hours as "estimatedHours", actual_hours as "actualHours",
        budget, color, icon, settings, created_by as "createdBy",
        created_at as "createdAt", updated_at as "updatedAt"
    `,
    [JSON.stringify(settings), projectId]
  );

  assertExists(project, 'Project');

  // Clear cache
  await cache.del(`project:${projectId}`);

  return project;
};

/**
 * Delete project (soft delete)
 */
export const deleteProject = async (projectId: string): Promise<void> => {
  await db.raw(
    'UPDATE projects SET deleted_at = NOW() WHERE id = $1',
    [projectId]
  );

  // Clear cache
  await cache.del(`project:${projectId}`);

  logger.info('Project deleted', { projectId });
};

/**
 * List organization projects
 */
export const listOrganizationProjects = async (
  organizationId: string,
  params?: {
    status?: ProjectStatus;
    priority?: ProjectPriority;
    search?: string;
    page?: number;
    perPage?: number;
  }
): Promise<{ projects: ProjectWithStats[]; pagination: any }> => {
  const page = params?.page || 1;
  const perPage = Math.min(params?.perPage || 20, 100);
  const offset = (page - 1) * perPage;

  // Build WHERE clause
  const conditions: string[] = ['p.organization_id = $1', 'p.deleted_at IS NULL'];
  const values: any[] = [organizationId];
  let paramIndex = 2;

  if (params?.status) {
    conditions.push(`p.status = $${paramIndex++}`);
    values.push(params.status);
  }

  if (params?.priority) {
    conditions.push(`p.priority = $${paramIndex++}`);
    values.push(params.priority);
  }

  if (params?.search) {
    conditions.push(`(LOWER(p.name) LIKE LOWER($${paramIndex}) OR LOWER(p.description) LIKE LOWER($${paramIndex}))`);
    values.push(`%${params.search}%`);
    paramIndex++;
  }

  const whereClause = conditions.join(' AND ');

  // Get total count
  const countResult = await db.one<{ count: number }>(
    `SELECT COUNT(*) as count FROM projects p WHERE ${whereClause}`,
    values
  );

  const total = countResult?.count || 0;

  // Get projects
  const projects = await db.any<ProjectWithStats>(
    `
      SELECT 
        p.id, p.name, p.description, p.status, p.priority,
        p.start_date as "startDate", p.end_date as "endDate",
        p.estimated_hours as "estimatedHours", p.actual_hours as "actualHours",
        p.color, p.icon, p.created_at as "createdAt", p.updated_at as "updatedAt",
        (SELECT COUNT(*) FROM project_members WHERE project_id = p.id AND deleted_at IS NULL) as "memberCount"
      FROM projects p
      WHERE ${whereClause}
      ORDER BY p.updated_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `,
    [...values, perPage, offset]
  );

  return {
    projects,
    pagination: {
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage),
    },
  };
};

/**
 * Get user's projects
 */
export const getUserProjects = async (userId: string): Promise<ProjectWithStats[]> => {
  const projects = await db.any<ProjectWithStats>(
    `
      SELECT 
        p.id, p.organization_id as "organizationId", p.name, p.description,
        p.status, p.priority, p.color, p.icon,
        p.created_at as "createdAt", p.updated_at as "updatedAt",
        (SELECT COUNT(*) FROM project_members WHERE project_id = p.id AND deleted_at IS NULL) as "memberCount",
        json_build_object(
          'id', o.id,
          'name', o.name,
          'slug', o.slug
        ) as organization
      FROM projects p
      INNER JOIN project_members pm ON p.id = pm.project_id
      INNER JOIN organizations o ON p.organization_id = o.id
      WHERE pm.user_id = $1 AND p.deleted_at IS NULL AND pm.deleted_at IS NULL AND o.deleted_at IS NULL
      ORDER BY p.updated_at DESC
    `,
    [userId]
  );

  return projects;
};

/**
 * Get project members
 */
export const getProjectMembers = async (projectId: string): Promise<ProjectMember[]> => {
  const members = await db.any<ProjectMember>(
    `
      SELECT 
        pm.id, pm.project_id as "projectId", pm.user_id as "userId",
        pm.role, pm.joined_at as "joinedAt",
        json_build_object(
          'id', u.id,
          'email', u.email,
          'fullName', u.full_name,
          'avatarUrl', u.avatar_url
        ) as user
      FROM project_members pm
      INNER JOIN users u ON pm.user_id = u.id
      WHERE pm.project_id = $1 AND pm.deleted_at IS NULL AND u.deleted_at IS NULL
      ORDER BY pm.joined_at ASC
    `,
    [projectId]
  );

  return members;
};

/**
 * Add member to project
 */
export const addProjectMember = async (
  projectId: string,
  userId: string,
  role: string = 'member'
): Promise<ProjectMember> => {
  // Check if already a member
  const existingMember = await db.one<{ id: string }>(
    `
      SELECT id FROM project_members
      WHERE project_id = $1 AND user_id = $2 AND deleted_at IS NULL
    `,
    [projectId, userId]
  );

  if (existingMember) {
    throw new ConflictError('User is already a member of this project');
  }

  const member = await db.one<ProjectMember>(
    `
      INSERT INTO project_members (
        id, project_id, user_id, role
      ) VALUES (
        gen_random_uuid(), $1, $2, $3
      )
      RETURNING 
        id, project_id as "projectId", user_id as "userId",
        role, joined_at as "joinedAt"
    `,
    [projectId, userId, role]
  );

  logger.info('Project member added', { projectId, userId, role });

  return member;
};

/**
 * Remove member from project
 */
export const removeProjectMember = async (
  projectId: string,
  userId: string
): Promise<void> => {
  await db.raw(
    `
      UPDATE project_members
      SET deleted_at = NOW()
      WHERE project_id = $1 AND user_id = $2
    `,
    [projectId, userId]
  );

  logger.info('Project member removed', { projectId, userId });
};

/**
 * Check if user is project member
 */
export const isProjectMember = async (
  projectId: string,
  userId: string
): Promise<boolean> => {
  const exists = await db.exists(
    `
      SELECT 1 FROM project_members
      WHERE project_id = $1 AND user_id = $2 AND deleted_at IS NULL
    `,
    [projectId, userId]
  );

  return exists;
};
