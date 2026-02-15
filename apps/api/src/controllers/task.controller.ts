/**
 * Task Controller
 * 
 * Handles HTTP requests for task management endpoints.
 * Includes task CRUD, assignment management, and task operations.
 * 
 * Edge-compatible Hono implementation.
 * Functions: 18 total (CRUD, assignments, status operations, bulk ops)
 * 
 * ELITE PATTERN: Controllers NEVER parse/validate - they blindly trust c.req.valid()
 * All validation happens at route level via @hono/zod-validator
 */

import { Context } from 'hono';
import { z } from 'zod';
import * as taskService from '../services/task.service';
import * as projectService from '../services/project.service';
import {
  createTaskSchema,
  updateTaskSchema,
  assignTaskSchema,
  taskListQuerySchema,
  updateTaskPositionSchema,
} from '@validiant/shared';

/**
 * Check project access
 */
const checkProjectAccess = async (projectId: string, userId: string): Promise<boolean> => {
  return await projectService.isProjectMember(projectId, userId);
};

/**
 * Create task
 * POST /api/v1/tasks
 * 
 * Payload validated by zValidator(createTaskSchema) at route level
 */
export const createTask = async (c: Context) => {
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
    const validatedData = (await c.req.json()) as z.infer<typeof createTaskSchema>;

    // Check project access
    const hasAccess = await checkProjectAccess(validatedData.projectId, user.userId);
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

    const task = await taskService.createTask(
      validatedData.projectId,
      user.userId,
      validatedData
    );

    return c.json(
      {
        success: true,
        message: 'Task created successfully',
        data: { task },
      },
      201
    );
  } catch (error) {
    console.error('Create task error:', error);
    return c.json(
      {
        success: false,
        error: 'Failed to create task',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
};

/**
 * Get task by ID
 * GET /api/v1/tasks/:id
 */
export const getTaskById = async (c: Context) => {
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
          message: 'Task ID is required',
        },
        400
      );
    }

    const task = await taskService.getTaskById(id);

    // Check project access
    const hasAccess = await checkProjectAccess(task.projectId, user.userId);
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

    return c.json({
      success: true,
      data: { task },
    });
  } catch (error) {
    console.error('Get task by ID error:', error);
    return c.json(
      {
        success: false,
        error: 'Failed to get task',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
};

/**
 * Update task
 * PUT /api/v1/tasks/:id
 * 
 * Payload validated by zValidator(updateTaskSchema) at route level
 */
export const updateTask = async (c: Context) => {
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
          message: 'Task ID is required',
        },
        400
      );
    }

    // Get task to check project access
    const existingTask = await taskService.getTaskById(id);
    const hasAccess = await checkProjectAccess(existingTask.projectId, user.userId);
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
    const validatedData = (await c.req.json()) as z.infer<typeof updateTaskSchema>;

    const task = await taskService.updateTask(id, validatedData);

    return c.json({
      success: true,
      message: 'Task updated successfully',
      data: { task },
    });
  } catch (error) {
    console.error('Update task error:', error);
    return c.json(
      {
        success: false,
        error: 'Failed to update task',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
};

/**
 * Delete task
 * DELETE /api/v1/tasks/:id
 */
export const deleteTask = async (c: Context) => {
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
          message: 'Task ID is required',
        },
        400
      );
    }

    // Get task to check project access
    const task = await taskService.getTaskById(id);
    const hasAccess = await checkProjectAccess(task.projectId, user.userId);
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

    await taskService.deleteTask(id);

    return c.json({
      success: true,
      message: 'Task deleted successfully',
      data: null,
    });
  } catch (error) {
    console.error('Delete task error:', error);
    return c.json(
      {
        success: false,
        error: 'Failed to delete task',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
};

/**
 * List project tasks
 * GET /api/v1/projects/:projectId/tasks
 * 
 * Query validated by zValidator(taskListQuerySchema) at route level
 */
export const listProjectTasks = async (c: Context) => {
  try {
    const user = c.get('user');
    const projectId = c.req.param('projectId');

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

    if (!projectId) {
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
    const hasAccess = await checkProjectAccess(projectId, user.userId);
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
    const validatedQuery = c.req.query() as unknown as z.infer<typeof taskListQuerySchema>;

    const result = await taskService.listProjectTasks(projectId, {
      status: validatedQuery.status,
      priority: validatedQuery.priority,
      assigneeId: validatedQuery.assigneeId,
      search: validatedQuery.search,
      parentTaskId: validatedQuery.parentTaskId,
      tags: validatedQuery.tags,
      page: validatedQuery.page,
      perPage: validatedQuery.perPage,
    });

    return c.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('List project tasks error:', error);
    return c.json(
      {
        success: false,
        error: 'Failed to list tasks',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
};

/**
 * Get current user's assigned tasks
 * GET /api/v1/tasks/my
 */
export const getMyTasks = async (c: Context) => {
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

    const status = c.req.query('status');
    const projectId = c.req.query('projectId');

    const tasks = await taskService.getUserTasks(user.userId, {
      status: status as any,
      projectId: projectId as string,
    });

    return c.json({
      success: true,
      data: { tasks },
    });
  } catch (error) {
    console.error('Get my tasks error:', error);
    return c.json(
      {
        success: false,
        error: 'Failed to get tasks',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
};

/**
 * Assign user to task
 * POST /api/v1/tasks/:id/assign
 * 
 * Payload validated by zValidator(assignTaskSchema) at route level
 */
export const assignTask = async (c: Context) => {
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
          message: 'Task ID is required',
        },
        400
      );
    }

    // Get task to check project access
    const task = await taskService.getTaskById(id);
    const hasAccess = await checkProjectAccess(task.projectId, user.userId);
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
    const validatedData = (await c.req.json()) as z.infer<typeof assignTaskSchema>;

    // Verify the user being assigned is a project member
    const isProjectMember = await projectService.isProjectMember(
      task.projectId,
      validatedData.userId
    );

    if (!isProjectMember) {
      return c.json(
        {
          success: false,
          error: 'Bad Request',
          message: 'User must be a member of the project',
        },
        400
      );
    }

    const assignee = await taskService.assignTask(id, validatedData.userId);

    return c.json({
      success: true,
      message: 'Task assigned successfully',
      data: { assignee },
    });
  } catch (error) {
    console.error('Assign task error:', error);
    return c.json(
      {
        success: false,
        error: 'Failed to assign task',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
};

/**
 * Unassign user from task
 * DELETE /api/v1/tasks/:id/assign/:userId
 */
export const unassignTask = async (c: Context) => {
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
          message: 'Task ID and User ID are required',
        },
        400
      );
    }

    // Get task to check project access
    const task = await taskService.getTaskById(id);
    const hasAccess = await checkProjectAccess(task.projectId, user.userId);
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

    await taskService.unassignTask(id, userId);

    return c.json({
      success: true,
      message: 'Task unassigned successfully',
      data: null,
    });
  } catch (error) {
    console.error('Unassign task error:', error);
    return c.json(
      {
        success: false,
        error: 'Failed to unassign task',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
};

/**
 * Update task position
 * PATCH /api/v1/tasks/:id/position
 * 
 * Payload validated by zValidator(updateTaskPositionSchema) at route level
 */
export const updateTaskPosition = async (c: Context) => {
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
          message: 'Task ID is required',
        },
        400
      );
    }

    // Get task to check project access
    const task = await taskService.getTaskById(id);
    const hasAccess = await checkProjectAccess(task.projectId, user.userId);
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
    const validatedData = (await c.req.json()) as z.infer<typeof updateTaskPositionSchema>;

    await taskService.updateTaskPosition(id, validatedData.position);

    return c.json({
      success: true,
      message: 'Task position updated successfully',
      data: null,
    });
  } catch (error) {
    console.error('Update task position error:', error);
    return c.json(
      {
        success: false,
        error: 'Failed to update task position',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
};

/**
 * Mark task as todo
 * POST /api/v1/tasks/:id/todo
 */
export const markAsTodo = async (c: Context) => {
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
          message: 'Task ID is required',
        },
        400
      );
    }

    // Get task to check project access
    const existingTask = await taskService.getTaskById(id);
    const hasAccess = await checkProjectAccess(existingTask.projectId, user.userId);
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

    const task = await taskService.updateTask(id, {
      status: taskService.TaskStatus.TODO,
    });

    return c.json({
      success: true,
      message: 'Task marked as todo',
      data: { task },
    });
  } catch (error) {
    console.error('Mark as todo error:', error);
    return c.json(
      {
        success: false,
        error: 'Failed to mark task as todo',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
};

/**
 * Mark task as in progress
 * POST /api/v1/tasks/:id/start
 */
export const markAsInProgress = async (c: Context) => {
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
          message: 'Task ID is required',
        },
        400
      );
    }

    // Get task to check project access
    const existingTask = await taskService.getTaskById(id);
    const hasAccess = await checkProjectAccess(existingTask.projectId, user.userId);
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

    const task = await taskService.updateTask(id, {
      status: taskService.TaskStatus.IN_PROGRESS,
    });

    return c.json({
      success: true,
      message: 'Task marked as in progress',
      data: { task },
    });
  } catch (error) {
    console.error('Mark as in progress error:', error);
    return c.json(
      {
        success: false,
        error: 'Failed to mark task as in progress',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
};

/**
 * Mark task as in review
 * POST /api/v1/tasks/:id/review
 */
export const markAsInReview = async (c: Context) => {
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
          message: 'Task ID is required',
        },
        400
      );
    }

    // Get task to check project access
    const existingTask = await taskService.getTaskById(id);
    const hasAccess = await checkProjectAccess(existingTask.projectId, user.userId);
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

    const task = await taskService.updateTask(id, {
      status: taskService.TaskStatus.IN_REVIEW,
    });

    return c.json({
      success: true,
      message: 'Task marked as in review',
      data: { task },
    });
  } catch (error) {
    console.error('Mark as in review error:', error);
    return c.json(
      {
        success: false,
        error: 'Failed to mark task as in review',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
};

/**
 * Mark task as completed
 * POST /api/v1/tasks/:id/complete
 */
export const markAsCompleted = async (c: Context) => {
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
          message: 'Task ID is required',
        },
        400
      );
    }

    // Get task to check project access
    const existingTask = await taskService.getTaskById(id);
    const hasAccess = await checkProjectAccess(existingTask.projectId, user.userId);
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

    const task = await taskService.updateTask(id, {
      status: taskService.TaskStatus.COMPLETED,
    });

    return c.json({
      success: true,
      message: 'Task marked as completed',
      data: { task },
    });
  } catch (error) {
    console.error('Mark as completed error:', error);
    return c.json(
      {
        success: false,
        error: 'Failed to mark task as completed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
};

/**
 * Cancel task
 * POST /api/v1/tasks/:id/cancel
 */
export const cancelTask = async (c: Context) => {
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
          message: 'Task ID is required',
        },
        400
      );
    }

    // Get task to check project access
    const existingTask = await taskService.getTaskById(id);
    const hasAccess = await checkProjectAccess(existingTask.projectId, user.userId);
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

    const task = await taskService.updateTask(id, {
      status: taskService.TaskStatus.CANCELLED,
    });

    return c.json({
      success: true,
      message: 'Task cancelled',
      data: { task },
    });
  } catch (error) {
    console.error('Cancel task error:', error);
    return c.json(
      {
        success: false,
        error: 'Failed to cancel task',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
};

/**
 * Get task subtasks
 * GET /api/v1/tasks/:id/subtasks
 */
export const getTaskSubtasks = async (c: Context) => {
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
          message: 'Task ID is required',
        },
        400
      );
    }

    // Get parent task to check project access
    const parentTask = await taskService.getTaskById(id);
    const hasAccess = await checkProjectAccess(parentTask.projectId, user.userId);
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

    const result = await taskService.listProjectTasks(parentTask.projectId, {
      parentTaskId: id,
    });

    return c.json({
      success: true,
      data: { tasks: result.tasks },
    });
  } catch (error) {
    console.error('Get task subtasks error:', error);
    return c.json(
      {
        success: false,
        error: 'Failed to get subtasks',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
};

/**
 * Bulk update tasks
 * PATCH /api/v1/tasks/bulk
 */
export const bulkUpdateTasks = async (c: Context) => {
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

    const body = await c.req.json();
    const { taskIds, updates } = body;

    if (!Array.isArray(taskIds) || taskIds.length === 0) {
      return c.json(
        {
          success: false,
          error: 'Bad Request',
          message: 'taskIds must be a non-empty array',
        },
        400
      );
    }

    if (!updates || typeof updates !== 'object') {
      return c.json(
        {
          success: false,
          error: 'Bad Request',
          message: 'updates object is required',
        },
        400
      );
    }

    // Verify all tasks belong to projects the user has access to
    for (const taskId of taskIds) {
      const task = await taskService.getTaskById(taskId);
      const hasAccess = await checkProjectAccess(task.projectId, user.userId);
      if (!hasAccess) {
        return c.json(
          {
            success: false,
            error: 'Forbidden',
            message: `You are not a member of the project for task ${taskId}`,
          },
          403
        );
      }
    }

    // Update all tasks
    const updatedTasks = [];
    for (const taskId of taskIds) {
      const task = await taskService.updateTask(taskId, updates);
      updatedTasks.push(task);
    }

    return c.json({
      success: true,
      message: 'Tasks updated successfully',
      data: { tasks: updatedTasks, count: updatedTasks.length },
    });
  } catch (error) {
    console.error('Bulk update tasks error:', error);
    return c.json(
      {
        success: false,
        error: 'Failed to bulk update tasks',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
};
