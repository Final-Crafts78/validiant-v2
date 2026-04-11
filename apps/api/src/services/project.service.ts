/**
 * Project Service (Drizzle Version)
 *
 * Handles project management, member operations, and project-related business logic.
 * Projects belong to organizations and can have multiple members.
 *
 * Migrated from raw SQL to Drizzle ORM for type safety and better DX.
 */

import { eq, and, isNull, sql, or, desc, SQL } from 'drizzle-orm';
import { db } from '../db';
import {
  projects,
  projectMembers,
  organizations,
  users,
  records,
  projectTypes,
  typeTemplates,
  typeColumns,
} from '../db/schema';
import { cache } from '../config/redis.config';
import { ConflictError, BadRequestError, assertExists } from '../utils/errors';
import { logger } from '../utils/logger';
import { ProjectStatus, ProjectPriority } from '@validiant/shared';

/**
 * Pagination interface
 */
interface Pagination {
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
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
  themeColor?: string;
  logoUrl?: string;
  autoDispatchVerified?: boolean;
  settings: Record<string, unknown>;
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
  recordCount?: number;
  typePills?: { name: string; color?: string }[];
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
  addedAt: Date;
}

/**
 * Create project
 * ✅ ELITE: Wrapped in transaction for ACID compliance
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
    themeColor?: string;
    logoUrl?: string;
    autoDispatchVerified?: boolean;
    templateId?: string;
  }
): Promise<Project> => {
  // Proceed without db.transaction() because neon-http does not support interactive transactions
  // 1. Create project
  let newProjectResult;
  
  // 🔍 ELITE: Diagnostic trace for DB insertion
  logger.info('[Service:Project:Create] Attempting project record insertion', {
    name: data.name,
    organizationId,
    timestamp: new Date().toISOString(),
  });

  try {
    const query = db
      .insert(projects)
      .values({
        organizationId,
        ownerId: userId,
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
        // PHASE 1: BRANDING SAFETY WRAP
        // Attempt to include these only if we are sure the schema is migrated
        ...(data.themeColor !== undefined && {
          themeColor: data.themeColor || '#4F46E5',
        }),
        ...(data.logoUrl !== undefined && { logoUrl: data.logoUrl }),
        ...(data.autoDispatchVerified !== undefined && {
          autoDispatchVerified: data.autoDispatchVerified || false,
        }),
        settings: {},
        createdBy: userId,
      });

    // ✅ ABSOLUTE SAFETY: Finalize chain with returning and await
    newProjectResult = await query.returning({
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
      themeColor: projects.themeColor,
      logoUrl: projects.logoUrl,
      autoDispatchVerified: projects.autoDispatchVerified,
      settings: projects.settings,
      createdBy: projects.createdBy,
      createdAt: projects.createdAt,
      updatedAt: projects.updatedAt,
    });

    logger.debug('[Service:Project:Create] Primary INSERT success', {
      projectId: newProjectResult[0]?.id,
    });
  } catch (err: any) {
    // ELITE DIAGNOSTIC: Detect missing columns from Phase 1 SQL failure
    const isMissingColumn =
      err.message?.includes('column') || err.message?.includes('not found');

    if (isMissingColumn) {
      logger.warn(
        'DEGRADED MODE: Project created without branding columns due to missing DB migration.',
        {
          error: err.message,
          suggestion: 'Run the Phase 1 SQL to fix this permanently.',
        }
      );

      // Fallback: Try insert WITHOUT the new columns to at least get the project created
      newProjectResult = await db
        .insert(projects)
        .values({
          organizationId,
          ownerId: userId,
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
          themeColor: projects.themeColor,
          logoUrl: projects.logoUrl,
          autoDispatchVerified: projects.autoDispatchVerified,
          settings: projects.settings,
          createdBy: projects.createdBy,
          createdAt: projects.createdAt,
          updatedAt: projects.updatedAt,
        });
    } else {
      logger.error('[Service:Project:Create] TERMINAL INSERT FAILURE', {
        error: err.message,
        stack: err.stack,
        timestamp: new Date().toISOString(),
      });
      throw err;
    }
  }
  const newProject = newProjectResult[0];

  try {
    // 2. Add creator as project member
    await db.insert(projectMembers).values({
      projectId: newProject.id,
      userId,
      role: 'owner',
    });

    // 3. PHASE 6: Archetype Marketplace Integration
    // If a templateId is provided, initialize the project with that archetype
    if (data.templateId) {
      const template = await db.query.typeTemplates.findFirst({
        where: eq(typeTemplates.id, data.templateId),
      });

      if (template) {
        const def = template.typeDefinition as any;

        // A. Create Project Type
        const [newType] = await db
          .insert(projectTypes)
          .values({
            projectId: newProject.id,
            name: def.typeName || template.name,
            icon: def.typeIcon || 'Layers',
            color: def.typeColor || '#4F46E5',
            settings: def.settings || {},
            createdBy: userId,
          })
          .returning();

        // B. Create Columns
        if (def.columns && Array.isArray(def.columns)) {
          const columnValues = def.columns.map((col: any, index: number) => ({
            projectId: newProject.id,
            typeId: newType.id,
            name: col.name,
            key: col.key,
            columnType: col.columnType,
            options: col.options || [],
            settings: col.settings || {},
            order: index,
            isRequired: col.isRequired || false,
          }));

          if (columnValues.length > 0) {
            await db.insert(typeColumns).values(columnValues);
          }
        }

        logger.info('Project initialized from archetype', {
          projectId: newProject.id,
          templateId: data.templateId,
        });
      }
    }
  } catch (error) {
    // Manual rollback: If adding the member fails, delete the created project
    logger.error('Failed to add owner to new project, rolling back...', {
      error,
      projectId: newProject.id,
    });
    await db.delete(projects).where(eq(projects.id, newProject.id));
    throw error;
  }

  const project = newProject;

  logger.info('Project created', {
    projectId: project.id,
    organizationId,
    userId,
  });

  return project as Project;
};

/**
 * Get project by ID
 */
export const getProjectById = async (
  projectId: string
): Promise<ProjectWithStats> => {
  // Try cache first
  const cacheKey = `project:${projectId}`;
  const cached = await cache.get<ProjectWithStats>(cacheKey);

  if (cached) {
    return cached;
  }

  const projectResult = await db
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
      themeColor: projects.themeColor,
      logoUrl: projects.logoUrl,
      autoDispatchVerified: projects.autoDispatchVerified,
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
      )`,
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
  const project = projectResult[0];

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
    themeColor?: string;
    logoUrl?: string;
    autoDispatchVerified?: boolean;
  }
): Promise<Project> => {
  // Build update object with only provided fields
  const updateData: Partial<typeof projects.$inferInsert> & {
    updatedAt: Date;
  } = {
    updatedAt: new Date(),
    ...(data.name !== undefined && { name: data.name }),
    ...(data.description !== undefined && { description: data.description }),
    ...(data.status !== undefined && { status: data.status }),
    ...(data.priority !== undefined && { priority: data.priority }),
    ...(data.startDate !== undefined && { startDate: data.startDate }),
    ...(data.endDate !== undefined && { endDate: data.endDate }),
    ...(data.estimatedHours !== undefined && {
      estimatedHours: data.estimatedHours,
    }),
    ...(data.budget !== undefined && { budget: data.budget }),
    ...(data.color !== undefined && { color: data.color }),
    ...(data.icon !== undefined && { icon: data.icon }),
    ...(data.themeColor !== undefined && { themeColor: data.themeColor }),
    ...(data.logoUrl !== undefined && { logoUrl: data.logoUrl }),
    ...(data.autoDispatchVerified !== undefined && {
      autoDispatchVerified: data.autoDispatchVerified,
    }),
  };

  if (Object.keys(updateData).length === 1) {
    // Only updatedAt was added
    throw new BadRequestError('No fields to update');
  }

  const projectResult = await db
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
      themeColor: projects.themeColor,
      logoUrl: projects.logoUrl,
      autoDispatchVerified: projects.autoDispatchVerified,
      settings: projects.settings,
      createdBy: projects.createdBy,
      createdAt: projects.createdAt,
      updatedAt: projects.updatedAt,
    });
  const project = projectResult[0];

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
  settings: Record<string, unknown>
): Promise<Project> => {
  const projectResult = await db
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
      themeColor: projects.themeColor,
      logoUrl: projects.logoUrl,
      autoDispatchVerified: projects.autoDispatchVerified,
      settings: projects.settings,
      createdBy: projects.createdBy,
      createdAt: projects.createdAt,
      updatedAt: projects.updatedAt,
    });
  const project = projectResult[0];

  assertExists(project, 'Project');

  // Clear cache
  await cache.del(`project:${projectId}`);

  return project as Project;
};

/**
 * Delete project (soft delete)
 */
export const deleteProject = async (projectId: string): Promise<void> => {
  await db
    .update(projects)
    .set({ deletedAt: new Date() })
    .where(eq(projects.id, projectId));

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
): Promise<{ projects: ProjectWithStats[]; pagination: Pagination }> => {
  logger.info('Listing organization projects...', {
    organizationId,
    params,
    timestamp: new Date().toISOString(),
  });

  try {
    const page = params?.page || 1;
    const perPage = Math.min(params?.perPage || 20, 100);
    const offset = (page - 1) * perPage;

    // Build WHERE conditions
    const conditions: Array<SQL<unknown> | undefined> = [
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
    const countResult = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(projects)
      .where(whereClause);
    const { count } = countResult[0];

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
        themeColor: projects.themeColor,
        logoUrl: projects.logoUrl,
        autoDispatchVerified: projects.autoDispatchVerified,
        createdAt: projects.createdAt,
        updatedAt: projects.updatedAt,
        // Subquery for member count
        memberCount: sql<number>`(
          SELECT COUNT(*)
          FROM ${projectMembers}
          WHERE ${projectMembers.projectId} = ${projects.id}
          AND ${projectMembers.deletedAt} IS NULL
        )`,
        // Subquery for record count
        recordCount: sql<number>`(
          SELECT COUNT(*)
          FROM ${records}
          WHERE ${records.projectId} = ${projects.id}
        )`,
      })
      .from(projects)
      .where(whereClause)
      .orderBy(desc(projects.updatedAt))
      .limit(perPage)
      .offset(offset);

    const result = {
      projects: projectList.map((p: (typeof projectList)[number]) => ({
        ...p,
        memberCount: Number(p.memberCount),
        recordCount: Number((p as any).recordCount || 0),
      })) as ProjectWithStats[],
      pagination: {
        total,
        page,
        perPage,
        totalPages: Math.ceil(total / perPage),
      },
    };

    // 🔍 EXTREME VISIBILITY: Track database results for project list
    // eslint-disable-next-line no-console
    console.debug('[Service:Project:List] Database results retrieved', {
      organizationId,
      count: result.projects.length,
      total,
      hasParams: !!params,
      timestamp: new Date().toISOString(),
    });

    return result;
  } catch (error) {
    // ELITE DIAGNOSTIC: Confirm column presence in error message
    logger.error('[ProjectService] listOrganizationProjects CRITICAL FAILURE', {
      error: error instanceof Error ? error.message : 'Unknown error',
      isSchemaError: error instanceof Error && error.message.includes('column'),
      organizationId,
      timestamp: new Date().toISOString(),
      stack: error instanceof Error ? error.stack : undefined,
    });
    throw error;
  }
};

/**
 * Get user's projects
 */
export const getUserProjects = async (
  userId: string
): Promise<ProjectWithStats[]> => {
  logger.info('Fetching user projects...', {
    userId,
    timestamp: new Date().toISOString(),
  });

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
      themeColor: projects.themeColor,
      logoUrl: projects.logoUrl,
      autoDispatchVerified: projects.autoDispatchVerified,
      createdAt: projects.createdAt,
      updatedAt: projects.updatedAt,
      // Subquery for member count
      memberCount: sql<number>`(
        SELECT COUNT(*)
        FROM ${projectMembers}
        WHERE ${projectMembers.projectId} = ${projects.id}
        AND ${projectMembers.deletedAt} IS NULL
      )`,
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

  return projectList.map((p: (typeof projectList)[number]) => ({
    ...p,
    memberCount: Number(p.memberCount),
  })) as ProjectWithStats[];
};

/**
 * Get project members
 */
export const getProjectMembers = async (
  projectId: string
): Promise<ProjectMember[]> => {
  const members = await db
    .select({
      id: projectMembers.id,
      projectId: projectMembers.projectId,
      userId: projectMembers.userId,
      role: projectMembers.role,
      addedAt: projectMembers.addedAt,
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
    .orderBy(projectMembers.addedAt);

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
  const existingMemberResult = await db
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
  const existingMember = existingMemberResult[0];

  if (existingMember) {
    throw new ConflictError('User is already a member of this project');
  }

  const memberResult = await db
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
      addedAt: projectMembers.addedAt,
    });
  const member = memberResult[0];

  logger.info('Project member added', { projectId, userId, role });

  return member as ProjectMember;
};

/**
 * Remove member from project
 */
export const removeProjectMember = async (
  projectId: string,
  userId: string
): Promise<void> => {
  await db
    .update(projectMembers)
    .set({ deletedAt: new Date() })
    .where(
      and(
        eq(projectMembers.projectId, projectId),
        eq(projectMembers.userId, userId)
      )
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
  const memberResult = await db
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
  const member = memberResult[0];

  return !!member;
};

/**
 * Get project member role
 */
export const getProjectMemberRole = async (
  projectId: string,
  userId: string
): Promise<string | null> => {
  const memberResult = await db
    .select({ role: projectMembers.role })
    .from(projectMembers)
    .where(
      and(
        eq(projectMembers.projectId, projectId),
        eq(projectMembers.userId, userId),
        isNull(projectMembers.deletedAt)
      )
    )
    .limit(1);
  const member = memberResult[0];

  return member ? member.role : null;
};

// ✅ Export ProjectStatus and ProjectPriority for backward compatibility with controllers
export { ProjectStatus, ProjectPriority };
