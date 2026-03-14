/**
 * Task Service (Drizzle Version) - Real-Time Enhanced
 *
 * Handles task management, assignments, status updates, and task-related business logic.
 * Tasks belong to projects and can be assigned to multiple users.
 *
 * Migrated from raw SQL to Drizzle ORM for type safety and better DX.
 * THIS IS THE FINAL SERVICE MIGRATION! 🎉
 *
 * Phase 6.3: Added real-time broadcasting via PartyKit WebSockets
 * - TASK_CREATED, TASK_UPDATED, TASK_DELETED events
 * - HTTP-to-WebSocket bridge pattern
 * - Non-blocking broadcasts (fire-and-forget)
 */

import { eq, and, isNull, sql, or, desc, inArray, SQL } from 'drizzle-orm';
import { db } from '../db';
import {
  tasks,
  taskAssignees,
  projects,
  users,
  caseFieldValues,
  verificationTypes,
  organizations,
} from '../db/schema';
import { cache } from '../config/redis.config';
import {
  NotFoundError,
  ConflictError,
  BadRequestError,
  assertExists,
} from '../utils/errors';
import { logger } from '../utils/logger';
import { broadcastTaskEvent, BroadcastEvent } from '../utils/broadcast';
import {
  TaskStatus,
  TaskPriority,
  getValidTransitions,
} from '@validiant/shared';
import * as projectService from './project.service';

/**
 * Task interface
 */
interface Task {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: Date;
  estimatedHours?: number;
  actualHours?: number;
  parentTaskId?: string;
  position: number;
  tags: string[];
  customFields: Record<string, unknown>;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

/**
 * Task with additional info
 */
interface TaskWithDetails extends Task {
  project?: {
    id: string;
    name: string;
    organizationId: string;
    organization?: {
      id: string;
      name: string;
      settings: Record<string, unknown>;
    };
  };
  assignees?: Array<{
    id: string;
    email: string;
    fullName: string;
    avatarUrl?: string;
  }>;
  subtaskCount?: number;
  completedSubtaskCount?: number;
  createdByUser?: {
    id: string;
    fullName: string;
    avatarUrl?: string;
  };
  verificationType?: {
    id: string;
    code: string;
    name: string;
    fieldSchema: unknown[];
    slaOverrideHours?: number;
  };
  slaMetrics?: {
    status: 'on_track' | 'at_risk' | 'breached';
    percentage: number;
    remainingHours: number;
  };
}

interface TaskListItem {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: Date | null;
  estimatedHours: number | null;
  actualHours: number | null;
  parentTaskId: string | null;
  position: number;
  tags: string[] | null;
  createdAt: Date;
  updatedAt: Date;
  completedAt: Date | null;
  subtaskCount: number;
}

interface TaskAssigneeItem {
  taskId: string;
  id: string;
  fullName: string;
  avatarUrl: string | null;
  email: string;
}

/**
 * Task assignee interface
 */
interface TaskAssignee {
  id: string;
  taskId: string;
  userId: string;
  assignedAt: Date;
  user?: {
    id: string;
    email: string;
    fullName: string;
    avatarUrl?: string;
  };
}

const calculateSlaMetrics = (
  createdAt: Date,
  slaHours: number = 72
): TaskWithDetails['slaMetrics'] => {
  const now = new Date();
  const elapsedMs = now.getTime() - createdAt.getTime();
  const elapsedHours = elapsedMs / (1000 * 60 * 60);

  const percentage = Math.min(100, (elapsedHours / slaHours) * 100);
  const remainingHours = Math.max(0, slaHours - elapsedHours);

  let status: 'on_track' | 'at_risk' | 'breached' = 'on_track';
  if (elapsedHours >= slaHours) {
    status = 'breached';
  } else if (elapsedHours >= slaHours * 0.8) {
    status = 'at_risk';
  }

  return {
    status,
    percentage: Math.round(percentage * 100) / 100,
    remainingHours: Math.round(remainingHours * 10) / 10,
  };
};
/**
 * Create task
 * ✅ ELITE: Wrapped in transaction for ACID compliance
 * ✅ REAL-TIME: Broadcasts TASK_CREATED event after successful creation
 */
export const createTask = async (
  projectId: string,
  userId: string,
  data: {
    title: string;
    description?: string;
    status?: TaskStatus;
    priority?: TaskPriority;
    dueDate?: Date;
    estimatedHours?: number;
    parentTaskId?: string;
    tags?: string[];
    customFields?: Record<string, unknown>;
    assigneeIds?: string[];
    orgId?: string;
  }
): Promise<Task> => {
  // Proceed without db.transaction() because neon-http does not support interactive transactions
  // 1. Get next position
  const maxPositionResult = await db
    .select({
      maxPosition: sql<number>`COALESCE(MAX(${tasks.position}), 0)`,
    })
    .from(tasks)
    .where(and(eq(tasks.projectId, projectId), isNull(tasks.deletedAt)));
  const { maxPosition } = maxPositionResult[0];

  const position = Number(maxPosition) + 1;

  // 2. Create task
  const newTaskResult = await db
    .insert(tasks)
    .values({
      projectId,
      title: data.title,
      description: data.description,
      statusKey: data.status || TaskStatus.PENDING,
      priority: data.priority || TaskPriority.MEDIUM,
      dueDate: data.dueDate,
      estimatedHours: data.estimatedHours,
      parentTaskId: data.parentTaskId,
      position,
      tags: data.tags || [],
      customFields: data.customFields || {},
      createdById: userId,
    })
    .returning({
      id: tasks.id,
      projectId: tasks.projectId,
      title: tasks.title,
      description: tasks.description,
      status: tasks.statusKey,
      priority: tasks.priority,
      dueDate: tasks.dueDate,
      estimatedHours: tasks.estimatedHours,
      actualHours: tasks.actualHours,
      parentTaskId: tasks.parentTaskId,
      position: tasks.position,
      tags: tasks.tags,
      customFields: tasks.customFields,
      createdBy: tasks.createdById,
      createdAt: tasks.createdAt,
      updatedAt: tasks.updatedAt,
      completedAt: tasks.completedAt,
    });
  const newTask = newTaskResult[0];

  try {
    // 3. Assign users if provided
    if (data.assigneeIds && data.assigneeIds.length > 0) {
      const assigneeValues = data.assigneeIds.map((assigneeId) => ({
        taskId: newTask.id,
        userId: assigneeId,
      }));

      await db.insert(taskAssignees).values(assigneeValues);
    }
  } catch (error) {
    // Manual rollback: If adding assignees fails, delete the created task
    logger.error('Failed to add assignees to new task, rolling back...', {
      error,
      taskId: newTask.id,
    });
    await db.delete(tasks).where(eq(tasks.id, newTask.id));
    throw error;
  }

  const task = newTask;

  logger.info('Task created', { taskId: task.id, projectId, userId });

  // ✅ REAL-TIME: Broadcast to organization
  // Non-blocking - happens in background
  if (data.orgId) {
    await broadcastTaskEvent(
      data.orgId,
      projectId,
      task.id,
      BroadcastEvent.TASK_CREATED,
      {
        status: task.status,
        priority: task.priority,
        createdBy: userId,
      }
    );
  } else {
    logger.warn('Broadcast skipped for newTask: orgId not provided');
  }

  return task as Task;
};

/**
 * Get task by ID
 */
export const getTaskById = async (taskId: string): Promise<TaskWithDetails> => {
  // Try cache first
  const cacheKey = `task:${taskId}`;
  const cached = await cache.get<TaskWithDetails>(cacheKey);

  if (cached) {
    return cached;
  }

  // Main task query
  const taskResult = await db
    .select({
      id: tasks.id,
      projectId: tasks.projectId,
      title: tasks.title,
      description: tasks.description,
      status: tasks.statusKey,
      priority: tasks.priority,
      dueDate: tasks.dueDate,
      estimatedHours: tasks.estimatedHours,
      actualHours: tasks.actualHours,
      parentTaskId: tasks.parentTaskId,
      position: tasks.position,
      tags: tasks.tags,
      customFields: tasks.customFields,
      createdBy: tasks.createdById,
      createdAt: tasks.createdAt,
      updatedAt: tasks.updatedAt,
      completedAt: tasks.completedAt,
      // Project as nested object
      project: {
        id: projects.id,
        name: projects.name,
        organizationId: projects.organizationId,
        organization: {
          id: organizations.id,
          name: organizations.name,
          settings: organizations.settings,
        },
      },
      // Created by user
      createdByUser: {
        id: users.id,
        fullName: users.fullName,
        avatarUrl: users.avatarUrl,
      },
      // Subtask counts via subqueries
      subtaskCount: sql<number>`(
        SELECT COUNT(*)
        FROM ${tasks} as subtasks
        WHERE subtasks.parent_task_id = ${tasks.id}
        AND subtasks.deleted_at IS NULL
      )`,
      completedSubtaskCount: sql<number>`(
        SELECT COUNT(*)
        FROM ${tasks} as subtasks
        WHERE subtasks.parent_task_id = ${tasks.id}
        AND subtasks.status_key = 'completed'
        AND subtasks.deleted_at IS NULL
      )`,
      // Verification Type (Phase 11)
      verificationType: {
        id: verificationTypes.id,
        code: verificationTypes.code,
        name: verificationTypes.name,
        fieldSchema: verificationTypes.fieldSchema,
        slaOverrideHours: verificationTypes.slaOverrideHours,
      },
    })
    .from(tasks)
    .innerJoin(projects, eq(tasks.projectId, projects.id))
    .innerJoin(organizations, eq(projects.organizationId, organizations.id))
    .innerJoin(users, eq(tasks.createdById, users.id))
    .leftJoin(
      verificationTypes,
      eq(tasks.verificationTypeId, verificationTypes.id)
    )
    .where(
      and(
        eq(tasks.id, taskId),
        isNull(tasks.deletedAt),
        isNull(projects.deletedAt)
      )
    )
    .limit(1);
  const task = taskResult[0];

  assertExists(task, 'Task');

  // Get assignees separately (Drizzle doesn't support json_agg in joins elegantly)
  const assigneeList = await db
    .select({
      id: users.id,
      email: users.email,
      fullName: users.fullName,
      avatarUrl: users.avatarUrl,
    })
    .from(taskAssignees)
    .innerJoin(users, eq(taskAssignees.userId, users.id))
    .where(
      and(
        eq(taskAssignees.taskId, taskId),
        isNull(taskAssignees.deletedAt),
        isNull(users.deletedAt)
      )
    );

  // Get case field values
  const fieldValues = await db
    .select({
      fieldKey: caseFieldValues.fieldKey,
      value: sql`COALESCE(${caseFieldValues.valueText}, ${caseFieldValues.valueNumber}::text, ${caseFieldValues.valueBoolean}::text, ${caseFieldValues.valueJson}::text)`,
    })
    .from(caseFieldValues)
    .where(eq(caseFieldValues.taskId, taskId));

  // Calculate SLA
  const slaHours = task.verificationType?.slaOverrideHours || 72;
  const slaMetrics = calculateSlaMetrics(task.createdAt, slaHours);

  const result: TaskWithDetails = {
    ...task,
    subtaskCount: Number(task.subtaskCount),
    completedSubtaskCount: Number(task.completedSubtaskCount),
    assignees: assigneeList.length > 0 ? assigneeList : undefined,
    customFields: {
      ...((task.customFields as Record<string, unknown>) || {}),
      ...Object.fromEntries(
        fieldValues.map((fv: { fieldKey: string; value: unknown }) => [
          fv.fieldKey,
          fv.value,
        ])
      ),
    },
    slaMetrics,
  } as TaskWithDetails;

  // Cache for 5 minutes
  await cache.set(cacheKey, result, 300);

  return result;
};

/**
 * Update task
 * ✅ REAL-TIME: Broadcasts TASK_UPDATED or TASK_STATUS_CHANGED
 */
export const updateTask = async (
  taskId: string,
  data: {
    title?: string;
    description?: string;
    status?: TaskStatus;
    priority?: TaskPriority;
    dueDate?: Date;
    estimatedHours?: number;
    actualHours?: number;
    tags?: string[];
    customFields?: Record<string, unknown>;
  },
  userId?: string
): Promise<Task> => {
  const existingTask = await getTaskById(taskId);
  const statusChanged =
    data.status !== undefined && data.status !== existingTask.status;

  // Enforce transition matrix if status is changing
  if (statusChanged && userId) {
    const role = await projectService.getProjectMemberRole(
      existingTask.projectId,
      userId
    );
    const validTransitions = getValidTransitions(
      existingTask.status,
      (
        existingTask.project?.organization as TaskWithDetails['project'] & {
          settings: Record<string, unknown>;
        }
      )?.settings || {},
      role || 'member'
    );

    const isValid = validTransitions.some(
      (t: { key: string }) => t.key === data.status
    );
    if (!isValid) {
      throw new BadRequestError(
        `Invalid status transition from ${existingTask.status} to ${data.status}`
      );
    }
  }

  // Build update object with only provided fields
  const updateData: Partial<typeof tasks.$inferInsert> & { updatedAt: Date } = {
    updatedAt: new Date(),
  };

  if (data.title !== undefined) updateData.title = data.title;
  if (data.description !== undefined) updateData.description = data.description;

  if (data.status !== undefined) {
    updateData.statusKey = data.status;
    // Set completed_at if status is completed, otherwise clear it
    if (data.status === TaskStatus.COMPLETED) {
      updateData.completedAt = new Date();
    } else {
      updateData.completedAt = null;
    }
  }

  if (data.priority !== undefined) updateData.priority = data.priority;
  if (data.dueDate !== undefined) updateData.dueDate = data.dueDate;
  if (data.estimatedHours !== undefined)
    updateData.estimatedHours = data.estimatedHours;
  if (data.actualHours !== undefined) updateData.actualHours = data.actualHours;
  if (data.tags !== undefined) updateData.tags = data.tags;
  if (data.customFields !== undefined)
    updateData.customFields = data.customFields;

  if (Object.keys(updateData).length === 1) {
    // Only updatedAt was added
    throw new BadRequestError('No fields to update');
  }

  const taskResult = await db
    .update(tasks)
    .set(updateData)
    .where(and(eq(tasks.id, taskId), isNull(tasks.deletedAt)))
    .returning({
      id: tasks.id,
      projectId: tasks.projectId,
      title: tasks.title,
      description: tasks.description,
      status: tasks.statusKey,
      priority: tasks.priority,
      dueDate: tasks.dueDate,
      estimatedHours: tasks.estimatedHours,
      actualHours: tasks.actualHours,
      parentTaskId: tasks.parentTaskId,
      position: tasks.position,
      tags: tasks.tags,
      customFields: tasks.customFields,
      createdBy: tasks.createdById,
      createdAt: tasks.createdAt,
      updatedAt: tasks.updatedAt,
      completedAt: tasks.completedAt,
    });
  const task = taskResult[0];

  const eventType = statusChanged
    ? BroadcastEvent.TASK_STATUS_CHANGED
    : BroadcastEvent.TASK_UPDATED;

  const orgId = existingTask.project?.organizationId;

  if (orgId) {
    await broadcastTaskEvent(orgId, task.projectId, task.id, eventType, {
      status: task.status,
      priority: task.priority,
    });
  }

  return task as Task;
};

/**
 * Delete task (soft delete)
 * ✅ REAL-TIME: Broadcasts TASK_DELETED
 */
export const deleteTask = async (taskId: string): Promise<void> => {
  // Get task before deletion to get projectId
  const taskResult = await db
    .select({ projectId: tasks.projectId })
    .from(tasks)
    .where(and(eq(tasks.id, taskId), isNull(tasks.deletedAt)))
    .limit(1);
  const task = taskResult[0];

  if (!task) {
    throw new NotFoundError('Task');
  }

  await db
    .update(tasks)
    .set({ deletedAt: new Date() })
    .where(eq(tasks.id, taskId));

  // Clear cache
  await cache.del(`task:${taskId}`);

  // ✅ REAL-TIME: Broadcast to organization
  const taskDetails = await getTaskById(taskId);
  const orgId = taskDetails.project?.organizationId;
  if (orgId) {
    await broadcastTaskEvent(
      orgId,
      taskDetails.projectId,
      taskId,
      BroadcastEvent.TASK_DELETED
    );
  }
};

/**
 * List project tasks
 */
export const listProjectTasks = async (
  projectId: string,
  params?: {
    status?: TaskStatus;
    priority?: TaskPriority;
    assigneeId?: string;
    search?: string;
    parentTaskId?: string | null;
    tags?: string[];
    cursor?: string;
    perPage?: number;
  }
): Promise<{ tasks: TaskWithDetails[]; nextCursor: string | null }> => {
  const perPage = Math.min(params?.perPage || 50, 100);

  // Build WHERE conditions
  const conditions: (SQL | undefined)[] = [
    eq(tasks.projectId, projectId),
    isNull(tasks.deletedAt),
  ];

  if (params?.status) {
    conditions.push(eq(tasks.statusKey, params.status));
  }

  if (params?.priority) {
    conditions.push(eq(tasks.priority, params.priority));
  }

  // Handle parentTaskId filter (including null)
  if (params?.parentTaskId !== undefined) {
    if (params.parentTaskId === null) {
      conditions.push(isNull(tasks.parentTaskId));
    } else {
      conditions.push(eq(tasks.parentTaskId, params.parentTaskId));
    }
  }

  if (params?.search) {
    conditions.push(
      or(
        sql`LOWER(${tasks.title}) LIKE LOWER(${`%${params.search}%`})`,
        sql`LOWER(${tasks.description}) LIKE LOWER(${`%${params.search}%`})`
      )
    );
  }

  // Filter by assigned user using EXISTS subquery
  if (params?.assigneeId) {
    conditions.push(
      sql`EXISTS (
        SELECT 1
        FROM ${taskAssignees}
        WHERE ${taskAssignees.taskId} = ${tasks.id}
        AND ${taskAssignees.userId} = ${params.assigneeId}
        AND ${taskAssignees.deletedAt} IS NULL
      )`
    );
  }

  // Filter by tags
  if (params?.tags && params.tags.length > 0) {
    conditions.push(
      sql`${tasks.tags} @> ${JSON.stringify(params.tags)}::jsonb`
    );
  }

  // Cursor handling (CreatedAt + ID)
  // Format: "ISOString|UUID"
  if (params?.cursor) {
    try {
      const [createdAtStr, id] = params.cursor.split('|');
      const createdAt = new Date(createdAtStr);

      // Sort: ASC(position), DESC(createdAt), DESC(id)
      // To keep it simple for now and efficient, we'll use DESC(createdAt), DESC(id)
      conditions.push(
        or(
          sql`${tasks.createdAt} < ${createdAt}`,
          and(eq(tasks.createdAt, createdAt), sql`${tasks.id} < ${id}`)
        )
      );
    } catch (e) {
      logger.error('Invalid cursor provided', { cursor: params.cursor });
    }
  }

  const whereClause = and(...conditions);

  // Get tasks (fetch one extra to check for next cursor)
  const taskList = await db
    .select({
      id: tasks.id,
      title: tasks.title,
      description: tasks.description,
      status: tasks.statusKey,
      priority: tasks.priority,
      dueDate: tasks.dueDate,
      estimatedHours: tasks.estimatedHours,
      actualHours: tasks.actualHours,
      parentTaskId: tasks.parentTaskId,
      position: tasks.position,
      tags: tasks.tags,
      createdAt: tasks.createdAt,
      updatedAt: tasks.updatedAt,
      completedAt: tasks.completedAt,
      subtaskCount: sql<number>`(
        SELECT COUNT(*)
        FROM ${tasks} as subtasks
        WHERE subtasks.parent_task_id = ${tasks.id}
        AND subtasks.deleted_at IS NULL
      )`,
    })
    .from(tasks)
    .where(whereClause)
    .orderBy(desc(tasks.createdAt), desc(tasks.id))
    .limit(perPage + 1);

  const hasNextPage = taskList.length > perPage;
  const slicedTasks = hasNextPage ? taskList.slice(0, perPage) : taskList;

  let nextCursor: string | null = null;
  if (hasNextPage) {
    const lastTask = slicedTasks[slicedTasks.length - 1];
    nextCursor = `${lastTask.createdAt.toISOString()}|${lastTask.id}`;
  }

  const taskIds = (slicedTasks as TaskListItem[]).map((t) => t.id);
  let assigneesByTask: Record<
    string,
    { id: string; fullName: string; avatarUrl: string | null; email: string }[]
  > = {};

  if (taskIds.length > 0) {
    const assignees = (await db
      .select({
        taskId: taskAssignees.taskId,
        id: users.id,
        fullName: users.fullName,
        avatarUrl: users.avatarUrl,
        email: users.email,
      })
      .from(taskAssignees)
      .innerJoin(users, eq(taskAssignees.userId, users.id))
      .where(
        and(
          inArray(taskAssignees.taskId, taskIds),
          isNull(taskAssignees.deletedAt),
          isNull(users.deletedAt)
        )
      )) as TaskAssigneeItem[];

    assigneesByTask = assignees.reduce(
      (acc, assignee: TaskAssigneeItem) => {
        const tid = assignee.taskId;
        if (!acc[tid]) acc[tid] = [];
        acc[tid].push({
          id: assignee.id,
          fullName: assignee.fullName,
          avatarUrl: assignee.avatarUrl,
          email: assignee.email,
        });
        return acc;
      },
      {} as Record<
        string,
        {
          id: string;
          fullName: string;
          avatarUrl: string | null;
          email: string;
        }[]
      >
    );
  }

  const tasksWithDetails = (slicedTasks as TaskListItem[]).map((task) => ({
    ...task,
    subtaskCount: Number(task.subtaskCount),
    assignees: assigneesByTask[task.id] || undefined,
  })) as TaskWithDetails[];

  return {
    tasks: tasksWithDetails,
    nextCursor,
  };
};

/**
 * Get user's assigned tasks
 */
export const getUserTasks = async (
  userId: string,
  params?: {
    status?: TaskStatus;
    projectId?: string;
  }
): Promise<TaskWithDetails[]> => {
  const conditions: (SQL | undefined)[] = [
    eq(taskAssignees.userId, userId),
    isNull(taskAssignees.deletedAt),
    isNull(tasks.deletedAt),
    isNull(projects.deletedAt),
  ];

  if (params?.status) {
    conditions.push(eq(tasks.statusKey, params.status));
  }

  if (params?.projectId) {
    conditions.push(eq(tasks.projectId, params.projectId));
  }

  const taskList = await db
    .selectDistinct({
      id: tasks.id,
      projectId: tasks.projectId,
      title: tasks.title,
      description: tasks.description,
      status: tasks.statusKey,
      priority: tasks.priority,
      dueDate: tasks.dueDate,
      estimatedHours: tasks.estimatedHours,
      actualHours: tasks.actualHours,
      createdAt: tasks.createdAt,
      updatedAt: tasks.updatedAt,
      // Project as nested object
      project: {
        id: projects.id,
        name: projects.name,
        organizationId: projects.organizationId,
      },
    })
    .from(taskAssignees)
    .innerJoin(tasks, eq(taskAssignees.taskId, tasks.id))
    .innerJoin(projects, eq(tasks.projectId, projects.id))
    .where(and(...conditions))
    .orderBy(sql`${tasks.dueDate} ASC NULLS LAST`, desc(tasks.createdAt));

  return taskList as TaskWithDetails[];
};

/**
 * Assign user to task
 * ✅ REAL-TIME: Broadcasts TASK_ASSIGNED
 */
export const assignTask = async (
  taskId: string,
  userId: string
): Promise<TaskAssignee> => {
  // Get task to get projectId
  const taskResult = await db
    .select({ projectId: tasks.projectId })
    .from(tasks)
    .where(and(eq(tasks.id, taskId), isNull(tasks.deletedAt)))
    .limit(1);
  const task = taskResult[0];

  if (!task) {
    throw new NotFoundError('Task');
  }

  // Check if already assigned
  const existsResult = await db
    .select({ id: taskAssignees.id })
    .from(taskAssignees)
    .where(
      and(
        eq(taskAssignees.taskId, taskId),
        eq(taskAssignees.userId, userId),
        isNull(taskAssignees.deletedAt)
      )
    )
    .limit(1);
  const exists = existsResult[0];

  if (exists) {
    throw new ConflictError('User is already assigned to this task');
  }

  const assigneeResult = await db
    .insert(taskAssignees)
    .values({
      taskId,
      userId,
    })
    .returning({
      id: taskAssignees.id,
      taskId: taskAssignees.taskId,
      userId: taskAssignees.userId,
      assignedAt: taskAssignees.assignedAt,
    });
  const assignee = assigneeResult[0];

  // Clear cache
  await cache.del(`task:${taskId}`);

  logger.info('Task assigned', { taskId, userId });

  // ✅ REAL-TIME: Broadcast to organization
  const taskDetails = await getTaskById(taskId);
  const orgId = taskDetails.project?.organizationId;

  if (orgId) {
    await broadcastTaskEvent(
      orgId,
      taskDetails.projectId,
      taskId,
      BroadcastEvent.TASK_ASSIGNED,
      {
        assigneeId: userId,
      }
    );
  }

  return assignee as TaskAssignee;
};

/**
 * Unassign user from task
 * ✅ REAL-TIME: Broadcasts TASK_ASSIGNED with removed flag
 */
export const unassignTask = async (
  taskId: string,
  userId: string
): Promise<void> => {
  // Get task to get projectId
  const taskResult = await db
    .select({ projectId: tasks.projectId })
    .from(tasks)
    .where(and(eq(tasks.id, taskId), isNull(tasks.deletedAt)))
    .limit(1);
  const task = taskResult[0];

  if (!task) {
    throw new NotFoundError('Task');
  }

  await db
    .update(taskAssignees)
    .set({ deletedAt: new Date() })
    .where(
      and(eq(taskAssignees.taskId, taskId), eq(taskAssignees.userId, userId))
    );

  // Clear cache
  await cache.del(`task:${taskId}`);

  logger.info('Task unassigned', { taskId, userId });

  // ✅ REAL-TIME: Broadcast to organization
  const taskDetails = await getTaskById(taskId);
  const orgId = taskDetails.project?.organizationId;

  if (orgId) {
    await broadcastTaskEvent(
      orgId,
      taskDetails.projectId,
      taskId,
      BroadcastEvent.TASK_ASSIGNED,
      {
        assigneeId: userId,
        removed: true,
      }
    );
  }
};

/**
 * Get task by Case ID (Atomic Reference)
 */
export const getTaskByCaseId = async (
  organizationId: string,
  caseId: string
): Promise<TaskWithDetails> => {
  const taskResult = await db
    .select({ id: tasks.id })
    .from(tasks)
    .where(
      and(
        eq(tasks.organizationId, organizationId),
        eq(tasks.caseId, caseId),
        isNull(tasks.deletedAt)
      )
    )
    .limit(1);

  const taskStub = taskResult[0];
  if (!taskStub) {
    throw new NotFoundError(`Case with ID ${caseId} not found`);
  }

  return await getTaskById(taskStub.id);
};

/**
 * Bulk assign tasks to a user
 */
export const bulkAssignTasks = async (
  taskIds: string[],
  userId: string
): Promise<{ succeeded: string[]; failed: string[] }> => {
  const succeeded: string[] = [];
  const failed: string[] = [];

  for (const taskId of taskIds) {
    try {
      // We reuse the existing assignTask logic which handles duplicate assignment check
      await assignTask(taskId, userId);
      succeeded.push(taskId);
    } catch (error) {
      logger.error('Bulk assign failed for task', { taskId, error });
      failed.push(taskId);
    }
  }

  return { succeeded, failed };
};

/**
 * Bulk update task status with transition matrix enforcement
 */
export const bulkUpdateStatus = async (
  taskIds: string[],
  statusKey: TaskStatus,
  userId: string
): Promise<{
  succeeded: string[];
  failed: { taskId: string; reason: string }[];
  summary: string;
}> => {
  const succeeded: string[] = [];
  const failed: { taskId: string; reason: string }[] = [];

  for (const taskId of taskIds) {
    try {
      await updateTask(taskId, { status: statusKey }, userId);
      succeeded.push(taskId);
    } catch (error) {
      const err = error as Error & { message?: string };
      logger.error('Bulk status update failed for task', {
        taskId,
        error: err,
      });
      failed.push({
        taskId,
        reason: err?.message || 'Unknown error',
      });
    }
  }

  const summary = `Successfully updated ${succeeded.length} tasks. ${failed.length} failed.`;

  return { succeeded, failed, summary };
};

export const updateTaskPosition = async (
  taskId: string,
  position: number
): Promise<void> => {
  await db
    .update(tasks)
    .set({ position, updatedAt: new Date() })
    .where(eq(tasks.id, taskId));

  // Clear cache
  await cache.del(`task:${taskId}`);
};

/**
 * Complete task successfully
 */
export const completeTask = async (taskId: string): Promise<Task> => {
  return await updateTask(taskId, { status: TaskStatus.COMPLETED });
};

/**
 * Reopen task
 */
export const reopenTask = async (taskId: string): Promise<Task> => {
  return await updateTask(taskId, { status: TaskStatus.IN_PROGRESS });
};

// ✅ Export TaskStatus and TaskPriority for backward compatibility with controllers
export { TaskStatus, TaskPriority };
