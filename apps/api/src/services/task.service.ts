/**
 * Task Service
 * 
 * Handles task management, assignments, status updates, and task-related business logic.
 * Tasks belong to projects and can be assigned to multiple users.
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
 * Task status enum
 */
export enum TaskStatus {
  TODO = 'todo',
  IN_PROGRESS = 'in_progress',
  IN_REVIEW = 'in_review',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

/**
 * Task priority enum
 */
export enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

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
  // Get next position
  const positionResult = await db.one<{ maxPosition: number }>(
    `
      SELECT COALESCE(MAX(position), 0) as "maxPosition"
      FROM tasks
      WHERE project_id = $1 AND deleted_at IS NULL
    `,
    [projectId]
  );

  const position = (positionResult?.maxPosition || 0) + 1;

  // Create task
  const task = await db.one<Task>(
    `
      INSERT INTO tasks (
        id, project_id, title, description, status, priority,
        due_date, estimated_hours, parent_task_id, position,
        tags, custom_fields, created_by
      ) VALUES (
        gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12
      )
      RETURNING 
        id, project_id as "projectId", title, description,
        status, priority, due_date as "dueDate",
        estimated_hours as "estimatedHours", actual_hours as "actualHours",
        parent_task_id as "parentTaskId", position, tags, custom_fields as "customFields",
        created_by as "createdBy", created_at as "createdAt",
        updated_at as "updatedAt", completed_at as "completedAt"
    `,
    [
      projectId,
      data.title,
      data.description,
      data.status || TaskStatus.TODO,
      data.priority || TaskPriority.MEDIUM,
      data.dueDate,
      data.estimatedHours,
      data.parentTaskId,
      position,
      JSON.stringify(data.tags || []),
      JSON.stringify(data.customFields || {}),
      userId,
    ]
  );

  // Assign users if provided
  if (data.assigneeIds && data.assigneeIds.length > 0) {
    for (const assigneeId of data.assigneeIds) {
      await db.raw(
        `
          INSERT INTO task_assignees (id, task_id, user_id)
          VALUES (gen_random_uuid(), $1, $2)
        `,
        [task.id, assigneeId]
      );
    }
  }

  logger.info('Task created', { taskId: task.id, projectId, userId });

  return task;
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

  const task = await db.one<TaskWithDetails>(
    `
      SELECT 
        t.id, t.project_id as "projectId", t.title, t.description,
        t.status, t.priority, t.due_date as "dueDate",
        t.estimated_hours as "estimatedHours", t.actual_hours as "actualHours",
        t.parent_task_id as "parentTaskId", t.position, t.tags, t.custom_fields as "customFields",
        t.created_by as "createdBy", t.created_at as "createdAt",
        t.updated_at as "updatedAt", t.completed_at as "completedAt",
        json_build_object(
          'id', p.id,
          'name', p.name,
          'organizationId', p.organization_id
        ) as project,
        json_build_object(
          'id', u.id,
          'fullName', u.full_name,
          'avatarUrl', u.avatar_url
        ) as "createdByUser",
        (SELECT COUNT(*) FROM tasks WHERE parent_task_id = t.id AND deleted_at IS NULL) as "subtaskCount",
        (SELECT COUNT(*) FROM tasks WHERE parent_task_id = t.id AND status = 'completed' AND deleted_at IS NULL) as "completedSubtaskCount",
        (SELECT json_agg(json_build_object(
          'id', u2.id,
          'email', u2.email,
          'fullName', u2.full_name,
          'avatarUrl', u2.avatar_url
        ))
        FROM task_assignees ta
        INNER JOIN users u2 ON ta.user_id = u2.id
        WHERE ta.task_id = t.id AND ta.deleted_at IS NULL AND u2.deleted_at IS NULL) as assignees
      FROM tasks t
      INNER JOIN projects p ON t.project_id = p.id
      INNER JOIN users u ON t.created_by = u.id
      WHERE t.id = $1 AND t.deleted_at IS NULL AND p.deleted_at IS NULL
    `,
    [taskId]
  );

  assertExists(task, 'Task');

  // Cache for 5 minutes
  await cache.set(cacheKey, task, 300);

  return task;
};

/**
 * Update task
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
  // Build update query
  const updates: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  if (data.title !== undefined) {
    updates.push(`title = $${paramIndex++}`);
    values.push(data.title);
  }

  if (data.description !== undefined) {
    updates.push(`description = $${paramIndex++}`);
    values.push(data.description);
  }

  if (data.status !== undefined) {
    updates.push(`status = $${paramIndex++}`);
    values.push(data.status);
    
    // Set completed_at if status is completed
    if (data.status === TaskStatus.COMPLETED) {
      updates.push(`completed_at = NOW()`);
    } else {
      updates.push(`completed_at = NULL`);
    }
  }

  if (data.priority !== undefined) {
    updates.push(`priority = $${paramIndex++}`);
    values.push(data.priority);
  }

  if (data.dueDate !== undefined) {
    updates.push(`due_date = $${paramIndex++}`);
    values.push(data.dueDate);
  }

  if (data.estimatedHours !== undefined) {
    updates.push(`estimated_hours = $${paramIndex++}`);
    values.push(data.estimatedHours);
  }

  if (data.actualHours !== undefined) {
    updates.push(`actual_hours = $${paramIndex++}`);
    values.push(data.actualHours);
  }

  if (data.tags !== undefined) {
    updates.push(`tags = $${paramIndex++}`);
    values.push(JSON.stringify(data.tags));
  }

  if (data.customFields !== undefined) {
    updates.push(`custom_fields = $${paramIndex++}`);
    values.push(JSON.stringify(data.customFields));
  }

  if (updates.length === 0) {
    throw new BadRequestError('No fields to update');
  }

  values.push(taskId);

  const task = await db.one<Task>(
    `
      UPDATE tasks
      SET ${updates.join(', ')}, updated_at = NOW()
      WHERE id = $${paramIndex} AND deleted_at IS NULL
      RETURNING 
        id, project_id as "projectId", title, description,
        status, priority, due_date as "dueDate",
        estimated_hours as "estimatedHours", actual_hours as "actualHours",
        parent_task_id as "parentTaskId", position, tags, custom_fields as "customFields",
        created_by as "createdBy", created_at as "createdAt",
        updated_at as "updatedAt", completed_at as "completedAt"
    `,
    values
  );

  // Clear cache
  await cache.del(`task:${taskId}`);

  logger.info('Task updated', { taskId });

  return task;
};

/**
 * Delete task (soft delete)
 */
export const deleteTask = async (taskId: string): Promise<void> => {
  await db.raw(
    'UPDATE tasks SET deleted_at = NOW() WHERE id = $1',
    [taskId]
  );

  // Clear cache
  await cache.del(`task:${taskId}`);

  logger.info('Task deleted', { taskId });
};

/**
 * List project tasks
 */
export const listProjectTasks = async (
  projectId: string,
  params?: {
    status?: TaskStatus;
    priority?: TaskPriority;
    assignedTo?: string;
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

  // Build WHERE clause
  const conditions: string[] = ['t.project_id = $1', 't.deleted_at IS NULL'];
  const values: any[] = [projectId];
  let paramIndex = 2;

  if (params?.status) {
    conditions.push(`t.status = $${paramIndex++}`);
    values.push(params.status);
  }

  if (params?.priority) {
    conditions.push(`t.priority = $${paramIndex++}`);
    values.push(params.priority);
  }

  if (params?.parentTaskId !== undefined) {
    if (params.parentTaskId === null) {
      conditions.push('t.parent_task_id IS NULL');
    } else {
      conditions.push(`t.parent_task_id = $${paramIndex++}`);
      values.push(params.parentTaskId);
    }
  }

  if (params?.search) {
    conditions.push(`(LOWER(t.title) LIKE LOWER($${paramIndex}) OR LOWER(t.description) LIKE LOWER($${paramIndex}))`);
    values.push(`%${params.search}%`);
    paramIndex++;
  }

  if (params?.assignedTo) {
    conditions.push(`EXISTS (
      SELECT 1 FROM task_assignees ta
      WHERE ta.task_id = t.id AND ta.user_id = $${paramIndex} AND ta.deleted_at IS NULL
    )`);
    values.push(params.assignedTo);
    paramIndex++;
  }

  if (params?.tags && params.tags.length > 0) {
    conditions.push(`t.tags @> $${paramIndex}`);
    values.push(JSON.stringify(params.tags));
    paramIndex++;
  }

  const whereClause = conditions.join(' AND ');

  // Get total count
  const countResult = await db.one<{ count: number }>(
    `SELECT COUNT(*) as count FROM tasks t WHERE ${whereClause}`,
    values
  );

  const total = countResult?.count || 0;

  // Get tasks
  const tasks = await db.any<TaskWithDetails>(
    `
      SELECT 
        t.id, t.title, t.description, t.status, t.priority,
        t.due_date as "dueDate", t.estimated_hours as "estimatedHours",
        t.actual_hours as "actualHours", t.parent_task_id as "parentTaskId",
        t.position, t.tags, t.created_at as "createdAt",
        t.updated_at as "updatedAt", t.completed_at as "completedAt",
        (SELECT json_agg(json_build_object(
          'id', u.id,
          'fullName', u.full_name,
          'avatarUrl', u.avatar_url
        ))
        FROM task_assignees ta
        INNER JOIN users u ON ta.user_id = u.id
        WHERE ta.task_id = t.id AND ta.deleted_at IS NULL AND u.deleted_at IS NULL) as assignees,
        (SELECT COUNT(*) FROM tasks WHERE parent_task_id = t.id AND deleted_at IS NULL) as "subtaskCount"
      FROM tasks t
      WHERE ${whereClause}
      ORDER BY t.position ASC, t.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `,
    [...values, perPage, offset]
  );

  return {
    tasks,
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
  const conditions: string[] = [
    'ta.user_id = $1',
    'ta.deleted_at IS NULL',
    't.deleted_at IS NULL',
    'p.deleted_at IS NULL',
  ];
  const values: any[] = [userId];
  let paramIndex = 2;

  if (params?.status) {
    conditions.push(`t.status = $${paramIndex++}`);
    values.push(params.status);
  }

  if (params?.projectId) {
    conditions.push(`t.project_id = $${paramIndex++}`);
    values.push(params.projectId);
  }

  const whereClause = conditions.join(' AND ');

  const tasks = await db.any<TaskWithDetails>(
    `
      SELECT DISTINCT
        t.id, t.project_id as "projectId", t.title, t.description,
        t.status, t.priority, t.due_date as "dueDate",
        t.estimated_hours as "estimatedHours", t.actual_hours as "actualHours",
        t.created_at as "createdAt", t.updated_at as "updatedAt",
        json_build_object(
          'id', p.id,
          'name', p.name,
          'organizationId', p.organization_id
        ) as project
      FROM task_assignees ta
      INNER JOIN tasks t ON ta.task_id = t.id
      INNER JOIN projects p ON t.project_id = p.id
      WHERE ${whereClause}
      ORDER BY t.due_date ASC NULLS LAST, t.created_at DESC
    `,
    values
  );

  return tasks;
};

/**
 * Assign user to task
 */
export const assignTask = async (
  taskId: string,
  userId: string
): Promise<TaskAssignee> => {
  // Check if already assigned
  const exists = await db.exists(
    `
      SELECT 1 FROM task_assignees
      WHERE task_id = $1 AND user_id = $2 AND deleted_at IS NULL
    `,
    [taskId, userId]
  );

  if (exists) {
    throw new ConflictError('User is already assigned to this task');
  }

  const assignee = await db.one<TaskAssignee>(
    `
      INSERT INTO task_assignees (id, task_id, user_id)
      VALUES (gen_random_uuid(), $1, $2)
      RETURNING 
        id, task_id as "taskId", user_id as "userId",
        assigned_at as "assignedAt"
    `,
    [taskId, userId]
  );

  // Clear cache
  await cache.del(`task:${taskId}`);

  logger.info('Task assigned', { taskId, userId });

  return assignee;
};

/**
 * Unassign user from task
 */
export const unassignTask = async (
  taskId: string,
  userId: string
): Promise<void> => {
  await db.raw(
    `
      UPDATE task_assignees
      SET deleted_at = NOW()
      WHERE task_id = $1 AND user_id = $2
    `,
    [taskId, userId]
  );

  // Clear cache
  await cache.del(`task:${taskId}`);

  logger.info('Task unassigned', { taskId, userId });
};

/**
 * Update task position (for drag and drop)
 */
export const updateTaskPosition = async (
  taskId: string,
  newPosition: number
): Promise<void> => {
  await db.raw(
    `
      UPDATE tasks
      SET position = $1, updated_at = NOW()
      WHERE id = $2 AND deleted_at IS NULL
    `,
    [newPosition, taskId]
  );

  // Clear cache
  await cache.del(`task:${taskId}`);
};
