/**
 * Project Service (Drizzle Version)
 * 
 * Handles project management, member operations, and project-related business logic.
 * Projects belong to organizations and can have multiple members.
 * 
 * Migrated from raw SQL to Drizzle ORM for type safety and better DX.
 */

import { eq, and, isNull, sql, or, desc } from 'drizzle-orm';
import { db } from '../db';
import { projects, projectMembers, organizations, users } from '../db/schema';
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
  const [project] = await db
    .insert(projects)
    .values({
      organizationId,
      name: data.name,
      description: data.description,
      status: data.status || ProjectStatus.PLANNING,
      priority: data.priority || ProjectPriority.MEDIUM,
      startDate: data.startDate,
      endDate: data.endDate,
      estimatedHours: data.estimatedHours,
      budget: data.budget,
      color: data.color,
      icon: data.icon,
      settings: {},
      createdBy: userId,
    })
    .returning({
      id: projects.id,
      organizationId: projects.organizationId,
      name: projects.name,
      description: projects.description,
      status: projects.status,
      priority: projects.priority,
      startDate: projects.startDate,
      endDate: projects.endDate,
      estimatedHours: projects.estimatedHours,
      actualHours: projects.actualHours,
      budget: projects.budget,
      color: projects.color,
      icon: projects.icon,
      settings: projects.settings,
      createdBy: projects.createdBy,
      createdAt: projects.createdAt,
      updatedAt: projects.updatedAt,
    });

  // Add creator as project member
  await db.insert(projectMembers).values({
    projectId: project.id,
    userId,
    role: 'owner',
  });

  logger.info('Project created', { projectId: project.id, organizationId, userId });

  return project as Project;
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

  const [project] = await db
    .select({
      id: projects.id,
      organizationId: projects.organizationId,
      name: projects.name,
      description: projects.description,
      status: projects.status,
      priority: projects.priority,
      startDate: projects.startDate,
      endDate: projects.endDate,
      estimatedHours: projects.estimatedHours,
      actualHours: projects.actualHours,
      budget: projects.budget,
      color: projects.color,
      icon: projects.icon,
      settings: projects.settings,
      createdBy: projects.createdBy,
      createdAt: projects.createdAt,
      updatedAt: projects.updatedAt,
      // Subquery for member count
      memberCount: sql<number>`(
        SELECT COUNT(*)
        FROM ${projectMembers}
        WHERE ${projectMembers.projectId} = ${projects.id}
        AND ${projectMembers.deletedAt} IS NULL
      )`::int,
      // Organization as nested object
      organization: {
        id: organizations.id,
        name: organizations.name,
        slug: organizations.slug,
      },
    })
    .from(projects)
    .innerJoin(organizations, eq(projects.organizationId, organizations.id))
    .where(
      and(
        eq(projects.id, projectId),
        isNull(projects.deletedAt),
        isNull(organizations.deletedAt)
      )
    )
    .limit(1);

  assertExists(project, 'Project');

  const result = {
    ...project,
    memberCount: Number(project.memberCount),
  } as ProjectWithStats;

  // Cache for 5 minutes
  await cache.set(cacheKey, result, 300);

  return result;
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
  // Build update object with only provided fields
  const updateData: any = {
    updatedAt: new Date(),
  };

  if (data.name !== undefined) updateData.name = data.name;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.status !== undefined) updateData.status = data.status;
  if (data.priority !== undefined) updateData.priority = data.priority;
  if (data.startDate !== undefined) updateData.startDate = data.startDate;
  if (data.endDate !== undefined) updateData.endDate = data.endDate;
  if (data.estimatedHours !== undefined) updateData.estimatedHours = data.estimatedHours;
  if (data.budget !== undefined) updateData.budget = data.budget;
  if (data.color !== undefined) updateData.color = data.color;
  if (data.icon !== undefined) updateData.icon = data.icon;

  if (Object.keys(updateData).length === 1) {
    // Only updatedAt was added
    throw new BadRequestError('No fields to update');
  }

  const [project] = await db
    .update(projects)
    .set(updateData)
    .where(and(eq(projects.id, projectId), isNull(projects.deletedAt)))
    .returning({
      id: projects.id,
      organizationId: projects.organizationId,
      name: projects.name,
      description: projects.description,
      status: projects.status,
      priority: projects.priority,
      startDate: projects.startDate,
      endDate: projects.endDate,
      estimatedHours: projects.estimatedHours,
      actualHours: projects.actualHours,
      budget: projects.budget,
      color: projects.color,
      icon: projects.icon,
      settings: projects.settings,
      createdBy: projects.createdBy,
      createdAt: projects.createdAt,
      updatedAt: projects.updatedAt,
    });

  // Clear cache
  await cache.del(`project:${projectId}`);

  logger.info('Project updated', { projectId });

  return project as Project;
};

/**
 * Update project settings
 */
export const updateProjectSettings = async (
  projectId: string,
  settings: any
): Promise<Project> => {
  const [project] = await db
    .update(projects)
    .set({
      settings,
      updatedAt: new Date(),
    })
    .where(and(eq(projects.id, projectId), isNull(projects.deletedAt)))
    .returning({
      id: projects.id,
      organizationId: projects.organizationId,
      name: projects.name,
      description: projects.description,
      status: projects.status,
      priority: projects.priority,
      startDate: projects.startDate,
      endDate: projects.endDate,
      estimatedHours: projects.estimatedHours,
      actualHours: projects.actualHours,
      budget: projects.budget,
      color: projects.color,
      icon: projects.icon,
      settings: projects.settings,
      createdBy: projects.createdBy,
      createdAt: projects.createdAt,
      updatedAt: projects.updatedAt,
    });

  assertExists(project, 'Project');

  // Clear cache
  await cache.del(`project:${projectId}`);

  return project as Project;
};

/**
 * Delete project (soft delete)
 */
export const deleteProject = async (projectId: string): Promise<void> => {
  await db.update(projects).set({ deletedAt: new Date() }).where(eq(projects.id, projectId));

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

  // Build WHERE conditions
  const conditions: any[] = [
    eq(projects.organizationId, organizationId),
    isNull(projects.deletedAt),
  ];

  if (params?.status) {
    conditions.push(eq(projects.status, params.status));
  }

  if (params?.priority) {
    conditions.push(eq(projects.priority, params.priority));
  }

  if (params?.search) {
    conditions.push(
      or(
        sql`LOWER(${projects.name}) LIKE LOWER(${`%${params.search}%`})`,
        sql`LOWER(${projects.description}) LIKE LOWER(${`%${params.search}%`})`
      )
    );
  }

  const whereClause = and(...conditions);

  // Get total count
  const [{ count }] = await db
    .select({ count: sql<number>`COUNT(*)`::int })
    .from(projects)
    .where(whereClause);

  const total = Number(count);

  // Get projects
  const projectList = await db
    .select({
      id: projects.id,
      name: projects.name,
      description: projects.description,
      status: projects.status,
      priority: projects.priority,
      startDate: projects.startDate,
      endDate: projects.endDate,
      estimatedHours: projects.estimatedHours,
      actualHours: projects.actualHours,
      color: projects.color,
      icon: projects.icon,
      createdAt: projects.createdAt,
      updatedAt: projects.updatedAt,
      // Subquery for member count
      memberCount: sql<number>`(
        SELECT COUNT(*)
        FROM ${projectMembers}
        WHERE ${projectMembers.projectId} = ${projects.id}
        AND ${projectMembers.deletedAt} IS NULL
      )`::int,
    })
    .from(projects)
    .where(whereClause)
    .orderBy(desc(projects.updatedAt))
    .limit(perPage)
    .offset(offset);

  return {
    projects: projectList.map((p) => ({
      ...p,
      memberCount: Number(p.memberCount),
    })) as ProjectWithStats[],
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
  const projectList = await db
    .select({
      id: projects.id,
      organizationId: projects.organizationId,
      name: projects.name,
      description: projects.description,
      status: projects.status,
      priority: projects.priority,
      color: projects.color,
      icon: projects.icon,
      createdAt: projects.createdAt,
      updatedAt: projects.updatedAt,
      // Subquery for member count
      memberCount: sql<number>`(
        SELECT COUNT(*)
        FROM ${projectMembers}
        WHERE ${projectMembers.projectId} = ${projects.id}
        AND ${projectMembers.deletedAt} IS NULL
      )`::int,
      // Organization as nested object
      organization: {
        id: organizations.id,
        name: organizations.name,
        slug: organizations.slug,
      },
    })
    .from(projects)
    .innerJoin(projectMembers, eq(projects.id, projectMembers.projectId))
    .innerJoin(organizations, eq(projects.organizationId, organizations.id))
    .where(
      and(
        eq(projectMembers.userId, userId),
        isNull(projects.deletedAt),
        isNull(projectMembers.deletedAt),
        isNull(organizations.deletedAt)
      )
    )
    .orderBy(desc(projects.updatedAt));

  return projectList.map((p) => ({
    ...p,
    memberCount: Number(p.memberCount),
  })) as ProjectWithStats[];
};

/**
 * Get project members
 */
export const getProjectMembers = async (projectId: string): Promise<ProjectMember[]> => {
  const members = await db
    .select({
      id: projectMembers.id,
      projectId: projectMembers.projectId,
      userId: projectMembers.userId,
      role: projectMembers.role,
      joinedAt: projectMembers.joinedAt,
      // User data as nested object
      user: {
        id: users.id,
        email: users.email,
        fullName: users.fullName,
        avatarUrl: users.avatarUrl,
      },
    })
    .from(projectMembers)
    .innerJoin(users, eq(projectMembers.userId, users.id))
    .where(
      and(
        eq(projectMembers.projectId, projectId),
        isNull(projectMembers.deletedAt),
        isNull(users.deletedAt)
      )
    )
    .orderBy(projectMembers.joinedAt);

  return members as ProjectMember[];
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
  const [existingMember] = await db
    .select({ id: projectMembers.id })
    .from(projectMembers)
    .where(
      and(
        eq(projectMembers.projectId, projectId),
        eq(projectMembers.userId, userId),
        isNull(projectMembers.deletedAt)
      )
    )
    .limit(1);

  if (existingMember) {
    throw new ConflictError('User is already a member of this project');
  }

  const [member] = await db
    .insert(projectMembers)
    .values({
      projectId,
      userId,
      role,
    })
    .returning({
      id: projectMembers.id,
      projectId: projectMembers.projectId,
      userId: projectMembers.userId,
      role: projectMembers.role,
      joinedAt: projectMembers.joinedAt,
    });

  logger.info('Project member added', { projectId, userId, role });

  return member as ProjectMember;
};

/**
 * Remove member from project
 */
export const removeProjectMember = async (projectId: string, userId: string): Promise<void> => {
  await db
    .update(projectMembers)
    .set({ deletedAt: new Date() })
    .where(
      and(eq(projectMembers.projectId, projectId), eq(projectMembers.userId, userId))
    );

  logger.info('Project member removed', { projectId, userId });
};

/**
 * Check if user is project member
 */
export const isProjectMember = async (projectId: string, userId: string): Promise<boolean> => {
  const [member] = await db
    .select({ id: projectMembers.id })
    .from(projectMembers)
    .where(
      and(
        eq(projectMembers.projectId, projectId),
        eq(projectMembers.userId, userId),
        isNull(projectMembers.deletedAt)
      )
    )
    .limit(1);

  return !!member;
};
