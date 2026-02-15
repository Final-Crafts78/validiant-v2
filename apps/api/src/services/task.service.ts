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

import { eq, and, isNull, sql, or, desc, asc, inArray, exists } from 'drizzle-orm';
import { db } from '../db';
import { tasks, taskAssignees, projects, organizations, users } from '../db/schema';
import { cache } from '../config/redis.config';
import {
  NotFoundError,
  ConflictError,
  BadRequestError,
  assertExists,
} from '../utils/errors';
import { logger } from '../utils/logger';
import { broadcastTaskEvent, BroadcastEvent } from '../utils/broadcast';
import { TaskStatus, TaskPriority } from '@validiant/shared';

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
  customFields: any;
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
    customFields?: any;
    assigneeIds?: string[];
  }
): Promise<Task> => {
  // ✅ ELITE: Use transaction with 'tx' object for all operations
  const task = await db.transaction(async (tx) => {
    // Get next position using 'tx'
    const [{ maxPosition }] = await tx
      .select({
        maxPosition: sql<number>`COALESCE(MAX(${tasks.position}), 0)`::int,
      })
      .from(tasks)
      .where(and(eq(tasks.projectId, projectId), isNull(tasks.deletedAt)));

    const position = Number(maxPosition) + 1;

    // Create task using 'tx'
    const [newTask] = await tx
      .insert(tasks)
      .values({
        projectId,
        title: data.title,
        description: data.description,
        status: data.status || TaskStatus.TODO,
        priority: data.priority || TaskPriority.MEDIUM,
        dueDate: data.dueDate,
        estimatedHours: data.estimatedHours,
        parentTaskId: data.parentTaskId,
        position,
        tags: data.tags || [],
        customFields: data.customFields || {},
        createdBy: userId,
      })
      .returning({
        id: tasks.id,
        projectId: tasks.projectId,
        title: tasks.title,
        description: tasks.description,
        status: tasks.status,
        priority: tasks.priority,
        dueDate: tasks.dueDate,
        estimatedHours: tasks.estimatedHours,
        actualHours: tasks.actualHours,
        parentTaskId: tasks.parentTaskId,
        position: tasks.position,
        tags: tasks.tags,
        customFields: tasks.customFields,
        createdBy: tasks.createdBy,
        createdAt: tasks.createdAt,
        updatedAt: tasks.updatedAt,
        completedAt: tasks.completedAt,
      });

    // Assign users if provided using 'tx'
    if (data.assigneeIds && data.assigneeIds.length > 0) {
      const assigneeValues = data.assigneeIds.map((assigneeId) => ({
        taskId: newTask.id,
        userId: assigneeId,
      }));

      await tx.insert(taskAssignees).values(assigneeValues);
    }

    return newTask;
  });

  logger.info('Task created', { taskId: task.id, projectId, userId });

  // ✅ REAL-TIME: Broadcast to project room
  // Non-blocking - happens in background
  await broadcastTaskEvent(projectId, task.id, BroadcastEvent.TASK_CREATED, {
    status: task.status,
    priority: task.priority,
    createdBy: userId,
  });

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
  const [task] = await db
    .select({
      id: tasks.id,
      projectId: tasks.projectId,
      title: tasks.title,
      description: tasks.description,
      status: tasks.status,
      priority: tasks.priority,
      dueDate: tasks.dueDate,
      estimatedHours: tasks.estimatedHours,
      actualHours: tasks.actualHours,
      parentTaskId: tasks.parentTaskId,
      position: tasks.position,
      tags: tasks.tags,
      customFields: tasks.customFields,
      createdBy: tasks.createdBy,
      createdAt: tasks.createdAt,
      updatedAt: tasks.updatedAt,
      completedAt: tasks.completedAt,
      // Project as nested object
      project: {
        id: projects.id,
        name: projects.name,
        organizationId: projects.organizationId,
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
      )`::int,
      completedSubtaskCount: sql<number>`(
        SELECT COUNT(*)
        FROM ${tasks} as subtasks
        WHERE subtasks.parent_task_id = ${tasks.id}
        AND subtasks.status = 'completed'
        AND subtasks.deleted_at IS NULL
      )`::int,
    })
    .from(tasks)
    .innerJoin(projects, eq(tasks.projectId, projects.id))
    .innerJoin(users, eq(tasks.createdBy, users.id))
    .where(and(eq(tasks.id, taskId), isNull(tasks.deletedAt), isNull(projects.deletedAt)))
    .limit(1);

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

  const result: TaskWithDetails = {
    ...task,
    subtaskCount: Number(task.subtaskCount),
    completedSubtaskCount: Number(task.completedSubtaskCount),
    assignees: assigneeList.length > 0 ? assigneeList : undefined,
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
    customFields?: any;
  }
): Promise<Task> => {
  // Track if status changed for optimized broadcast
  const statusChanged = data.status !== undefined;

  // Build update object with only provided fields
  const updateData: any = {
    updatedAt: new Date(),
  };

  if (data.title !== undefined) updateData.title = data.title;
  if (data.description !== undefined) updateData.description = data.description;

  if (data.status !== undefined) {
    updateData.status = data.status;
    // Set completed_at if status is completed, otherwise clear it
    if (data.status === TaskStatus.COMPLETED) {
      updateData.completedAt = new Date();
    } else {
      updateData.completedAt = null;
    }
  }

  if (data.priority !== undefined) updateData.priority = data.priority;
  if (data.dueDate !== undefined) updateData.dueDate = data.dueDate;
  if (data.estimatedHours !== undefined) updateData.estimatedHours = data.estimatedHours;
  if (data.actualHours !== undefined) updateData.actualHours = data.actualHours;
  if (data.tags !== undefined) updateData.tags = data.tags;
  if (data.customFields !== undefined) updateData.customFields = data.customFields;

  if (Object.keys(updateData).length === 1) {
    // Only updatedAt was added
    throw new BadRequestError('No fields to update');
  }

  const [task] = await db
    .update(tasks)
    .set(updateData)
    .where(and(eq(tasks.id, taskId), isNull(tasks.deletedAt)))
    .returning({
      id: tasks.id,
      projectId: tasks.projectId,
      title: tasks.title,
      description: tasks.description,
      status: tasks.status,
      priority: tasks.priority,
      dueDate: tasks.dueDate,
      estimatedHours: tasks.estimatedHours,
      actualHours: tasks.actualHours,
      parentTaskId: tasks.parentTaskId,
      position: tasks.position,
      tags: tasks.tags,
      customFields: tasks.customFields,
      createdBy: tasks.createdBy,
      createdAt: tasks.createdAt,
      updatedAt: tasks.updatedAt,
      completedAt: tasks.completedAt,
    });

  // Clear cache
  await cache.del(`task:${taskId}`);

  logger.info('Task updated', { taskId });

  // ✅ REAL-TIME: Broadcast to project room
  // Use TASK_STATUS_CHANGED for status updates (optimized for frontend)
  // Use TASK_UPDATED for general updates
  const eventType = statusChanged
    ? BroadcastEvent.TASK_STATUS_CHANGED
    : BroadcastEvent.TASK_UPDATED;

  await broadcastTaskEvent(task.projectId, task.id, eventType, {
    status: task.status,
    priority: task.priority,
  });

  return task as Task;
};

/**
 * Delete task (soft delete)
 * ✅ REAL-TIME: Broadcasts TASK_DELETED
 */
export const deleteTask = async (taskId: string): Promise<void> => {
  // Get task before deletion to get projectId
  const [task] = await db
    .select({ projectId: tasks.projectId })
    .from(tasks)
    .where(and(eq(tasks.id, taskId), isNull(tasks.deletedAt)))
    .limit(1);

  if (!task) {
    throw new NotFoundError('Task');
  }

  await db.update(tasks).set({ deletedAt: new Date() }).where(eq(tasks.id, taskId));

  // Clear cache
  await cache.del(`task:${taskId}`);

  logger.info('Task deleted', { taskId });

  // ✅ REAL-TIME: Broadcast to project room
  await broadcastTaskEvent(task.projectId, taskId, BroadcastEvent.TASK_DELETED);
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
    page?: number;
    perPage?: number;
  }
): Promise<{ tasks: TaskWithDetails[]; pagination: any }> => {
  const page = params?.page || 1;
  const perPage = Math.min(params?.perPage || 50, 100);
  const offset = (page - 1) * perPage;

  // Build WHERE conditions
  const conditions: any[] = [eq(tasks.projectId, projectId), isNull(tasks.deletedAt)];

  if (params?.status) {
    conditions.push(eq(tasks.status, params.status));
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

  // ✅ ELITE: Filter by tags with explicit ::jsonb cast for GIN index optimization
  if (params?.tags && params.tags.length > 0) {
    conditions.push(sql`${tasks.tags} @> ${JSON.stringify(params.tags)}::jsonb`);
  }

  const whereClause = and(...conditions);

  // Get total count
  const [{ count }] = await db
    .select({ count: sql<number>`COUNT(*)`::int })
    .from(tasks)
    .where(whereClause);

  const total = Number(count);

  // Get tasks
  const taskList = await db
    .select({
      id: tasks.id,
      title: tasks.title,
      description: tasks.description,
      status: tasks.status,
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
      // Subtask count subquery
      subtaskCount: sql<number>`(
        SELECT COUNT(*)
        FROM ${tasks} as subtasks
        WHERE subtasks.parent_task_id = ${tasks.id}
        AND subtasks.deleted_at IS NULL
      )`::int,
    })
    .from(tasks)
    .where(whereClause)
    .orderBy(asc(tasks.position), desc(tasks.createdAt))
    .limit(perPage)
    .offset(offset);

  // Get assignees for each task
  const taskIds = taskList.map((t) => t.id);
  let assigneesByTask: Record<string, any[]> = {};

  if (taskIds.length > 0) {
    const assignees = await db
      .select({
        taskId: taskAssignees.taskId,
        id: users.id,
        fullName: users.fullName,
        avatarUrl: users.avatarUrl,
      })
      .from(taskAssignees)
      .innerJoin(users, eq(taskAssignees.userId, users.id))
      .where(
        and(
          inArray(taskAssignees.taskId, taskIds),
          isNull(taskAssignees.deletedAt),
          isNull(users.deletedAt)
        )
      );

    // Group assignees by task ID
    assigneesByTask = assignees.reduce((acc, assignee) => {
      if (!acc[assignee.taskId]) {
        acc[assignee.taskId] = [];
      }
      acc[assignee.taskId].push({
        id: assignee.id,
        fullName: assignee.fullName,
        avatarUrl: assignee.avatarUrl,
      });
      return acc;
    }, {} as Record<string, any[]>);
  }

  const tasksWithDetails = taskList.map((task) => ({
    ...task,
    subtaskCount: Number(task.subtaskCount),
    assignees: assigneesByTask[task.id] || undefined,
  })) as TaskWithDetails[];

  return {
    tasks: tasksWithDetails,
    pagination: {
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage),
    },
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
  const conditions: any[] = [
    eq(taskAssignees.userId, userId),
    isNull(taskAssignees.deletedAt),
    isNull(tasks.deletedAt),
    isNull(projects.deletedAt),
  ];

  if (params?.status) {
    conditions.push(eq(tasks.status, params.status));
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
      status: tasks.status,
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
export const assignTask = async (taskId: string, userId: string): Promise<TaskAssignee> => {
  // Get task to get projectId
  const [task] = await db
    .select({ projectId: tasks.projectId })
    .from(tasks)
    .where(and(eq(tasks.id, taskId), isNull(tasks.deletedAt)))
    .limit(1);

  if (!task) {
    throw new NotFoundError('Task');
  }

  // Check if already assigned
  const [exists] = await db
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

  if (exists) {
    throw new ConflictError('User is already assigned to this task');
  }

  const [assignee] = await db
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

  // Clear cache
  await cache.del(`task:${taskId}`);

  logger.info('Task assigned', { taskId, userId });

  // ✅ REAL-TIME: Broadcast to project room
  await broadcastTaskEvent(task.projectId, taskId, BroadcastEvent.TASK_ASSIGNED, {
    assigneeId: userId,
  });

  return assignee as TaskAssignee;
};

/**
 * Unassign user from task
 * ✅ REAL-TIME: Broadcasts TASK_ASSIGNED with removed flag
 */
export const unassignTask = async (taskId: string, userId: string): Promise<void> => {
  // Get task to get projectId
  const [task] = await db
    .select({ projectId: tasks.projectId })
    .from(tasks)
    .where(and(eq(tasks.id, taskId), isNull(tasks.deletedAt)))
    .limit(1);

  if (!task) {
    throw new NotFoundError('Task');
  }

  await db
    .update(taskAssignees)
    .set({ deletedAt: new Date() })
    .where(and(eq(taskAssignees.taskId, taskId), eq(taskAssignees.userId, userId)));

  // Clear cache
  await cache.del(`task:${taskId}`);

  logger.info('Task unassigned', { taskId, userId });

  // ✅ REAL-TIME: Broadcast to project room
  await broadcastTaskEvent(task.projectId, taskId, BroadcastEvent.TASK_ASSIGNED, {
    assigneeId: userId,
    removed: true,
  });
};

/**
 * Update task position (for drag and drop)
 */
export const updateTaskPosition = async (taskId: string, newPosition: number): Promise<void> => {
  await db
    .update(tasks)
    .set({
      position: newPosition,
      updatedAt: new Date(),
    })
    .where(and(eq(tasks.id, taskId), isNull(tasks.deletedAt)));

  // Clear cache
  await cache.del(`task:${taskId}`);
};

// ✅ Export TaskStatus and TaskPriority for backward compatibility with controllers
export { TaskStatus, TaskPriority };
