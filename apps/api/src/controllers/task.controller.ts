/**
 * Task Controller
 * 
 * Handles HTTP requests for task management endpoints.
 * Includes task CRUD, assignment management, and task operations.
 */

import { Response } from 'express';
import { AuthRequest, asyncHandler } from '../middleware';
import * as taskService from '../services/task.service';
import * as projectService from '../services/project.service';
import { BadRequestError, ForbiddenError } from '../utils/errors';
import { logger } from '../utils/logger';
import {
  createTaskSchema,
  updateTaskSchema,
  assignTaskSchema,
  taskListQuerySchema,
  updateTaskPositionSchema,
} from '@validiant/shared';

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
 * Create task
 * POST /api/v1/tasks
 */
export const createTask = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw new BadRequestError('User not authenticated');
  }

  const validatedData = createTaskSchema.parse(req.body);

  // Check project access
  await checkProjectAccess(validatedData.projectId, req.user.id);

  const task = await taskService.createTask(
    validatedData.projectId,
    req.user.id,
    validatedData
  );

  sendSuccess(res, { task }, 'Task created successfully', 201);
});

/**
 * Get task by ID
 * GET /api/v1/tasks/:id
 */
export const getTaskById = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw new BadRequestError('User not authenticated');
  }

  const { id } = req.params;

  if (!id) {
    throw new BadRequestError('Task ID is required');
  }

  const task = await taskService.getTaskById(id);

  // Check project access
  await checkProjectAccess(task.projectId, req.user.id);

  sendSuccess(res, { task });
});

/**
 * Update task
 * PUT /api/v1/tasks/:id
 */
export const updateTask = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw new BadRequestError('User not authenticated');
  }

  const { id } = req.params;

  if (!id) {
    throw new BadRequestError('Task ID is required');
  }

  // Get task to check project access
  const existingTask = await taskService.getTaskById(id);
  await checkProjectAccess(existingTask.projectId, req.user.id);

  const validatedData = updateTaskSchema.parse(req.body);

  const task = await taskService.updateTask(id, validatedData);

  sendSuccess(res, { task }, 'Task updated successfully');
});

/**
 * Delete task
 * DELETE /api/v1/tasks/:id
 */
export const deleteTask = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw new BadRequestError('User not authenticated');
  }

  const { id } = req.params;

  if (!id) {
    throw new BadRequestError('Task ID is required');
  }

  // Get task to check project access
  const task = await taskService.getTaskById(id);
  await checkProjectAccess(task.projectId, req.user.id);

  await taskService.deleteTask(id);

  sendSuccess(res, null, 'Task deleted successfully');
});

/**
 * List project tasks
 * GET /api/v1/projects/:projectId/tasks
 */
export const listProjectTasks = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw new BadRequestError('User not authenticated');
  }

  const { projectId } = req.params;

  if (!projectId) {
    throw new BadRequestError('Project ID is required');
  }

  // Check project access
  await checkProjectAccess(projectId, req.user.id);

  const validatedQuery = taskListQuerySchema.parse(req.query);

  const result = await taskService.listProjectTasks(projectId, {
    status: validatedQuery.status,
    priority: validatedQuery.priority,
    assignedTo: validatedQuery.assignedTo,
    search: validatedQuery.search,
    parentTaskId: validatedQuery.parentTaskId,
    tags: validatedQuery.tags,
    page: validatedQuery.page,
    perPage: validatedQuery.perPage,
  });

  sendSuccess(res, result);
});

/**
 * Get current user's assigned tasks
 * GET /api/v1/tasks/my
 */
export const getMyTasks = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw new BadRequestError('User not authenticated');
  }

  const { status, projectId } = req.query;

  const tasks = await taskService.getUserTasks(req.user.id, {
    status: status as any,
    projectId: projectId as string,
  });

  sendSuccess(res, { tasks });
});

/**
 * Assign user to task
 * POST /api/v1/tasks/:id/assign
 */
export const assignTask = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw new BadRequestError('User not authenticated');
  }

  const { id } = req.params;

  if (!id) {
    throw new BadRequestError('Task ID is required');
  }

  // Get task to check project access
  const task = await taskService.getTaskById(id);
  await checkProjectAccess(task.projectId, req.user.id);

  const validatedData = assignTaskSchema.parse(req.body);

  // Verify the user being assigned is a project member
  const isProjectMember = await projectService.isProjectMember(
    task.projectId,
    validatedData.userId
  );

  if (!isProjectMember) {
    throw new BadRequestError('User must be a member of the project');
  }

  const assignee = await taskService.assignTask(id, validatedData.userId);

  sendSuccess(res, { assignee }, 'Task assigned successfully');
});

/**
 * Unassign user from task
 * DELETE /api/v1/tasks/:id/assign/:userId
 */
export const unassignTask = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw new BadRequestError('User not authenticated');
  }

  const { id, userId } = req.params;

  if (!id || !userId) {
    throw new BadRequestError('Task ID and User ID are required');
  }

  // Get task to check project access
  const task = await taskService.getTaskById(id);
  await checkProjectAccess(task.projectId, req.user.id);

  await taskService.unassignTask(id, userId);

  sendSuccess(res, null, 'Task unassigned successfully');
});

/**
 * Update task position
 * PATCH /api/v1/tasks/:id/position
 */
export const updateTaskPosition = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw new BadRequestError('User not authenticated');
  }

  const { id } = req.params;

  if (!id) {
    throw new BadRequestError('Task ID is required');
  }

  // Get task to check project access
  const task = await taskService.getTaskById(id);
  await checkProjectAccess(task.projectId, req.user.id);

  const validatedData = updateTaskPositionSchema.parse(req.body);

  await taskService.updateTaskPosition(id, validatedData.position);

  sendSuccess(res, null, 'Task position updated successfully');
});

/**
 * Mark task as todo
 * POST /api/v1/tasks/:id/todo
 */
export const markAsTodo = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw new BadRequestError('User not authenticated');
  }

  const { id } = req.params;

  if (!id) {
    throw new BadRequestError('Task ID is required');
  }

  // Get task to check project access
  const existingTask = await taskService.getTaskById(id);
  await checkProjectAccess(existingTask.projectId, req.user.id);

  const task = await taskService.updateTask(id, {
    status: taskService.TaskStatus.TODO,
  });

  sendSuccess(res, { task }, 'Task marked as todo');
});

/**
 * Mark task as in progress
 * POST /api/v1/tasks/:id/start
 */
export const markAsInProgress = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw new BadRequestError('User not authenticated');
  }

  const { id } = req.params;

  if (!id) {
    throw new BadRequestError('Task ID is required');
  }

  // Get task to check project access
  const existingTask = await taskService.getTaskById(id);
  await checkProjectAccess(existingTask.projectId, req.user.id);

  const task = await taskService.updateTask(id, {
    status: taskService.TaskStatus.IN_PROGRESS,
  });

  sendSuccess(res, { task }, 'Task marked as in progress');
});

/**
 * Mark task as in review
 * POST /api/v1/tasks/:id/review
 */
export const markAsInReview = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw new BadRequestError('User not authenticated');
  }

  const { id } = req.params;

  if (!id) {
    throw new BadRequestError('Task ID is required');
  }

  // Get task to check project access
  const existingTask = await taskService.getTaskById(id);
  await checkProjectAccess(existingTask.projectId, req.user.id);

  const task = await taskService.updateTask(id, {
    status: taskService.TaskStatus.IN_REVIEW,
  });

  sendSuccess(res, { task }, 'Task marked as in review');
});

/**
 * Mark task as completed
 * POST /api/v1/tasks/:id/complete
 */
export const markAsCompleted = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw new BadRequestError('User not authenticated');
  }

  const { id } = req.params;

  if (!id) {
    throw new BadRequestError('Task ID is required');
  }

  // Get task to check project access
  const existingTask = await taskService.getTaskById(id);
  await checkProjectAccess(existingTask.projectId, req.user.id);

  const task = await taskService.updateTask(id, {
    status: taskService.TaskStatus.COMPLETED,
  });

  sendSuccess(res, { task }, 'Task marked as completed');
});

/**
 * Cancel task
 * POST /api/v1/tasks/:id/cancel
 */
export const cancelTask = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw new BadRequestError('User not authenticated');
  }

  const { id } = req.params;

  if (!id) {
    throw new BadRequestError('Task ID is required');
  }

  // Get task to check project access
  const existingTask = await taskService.getTaskById(id);
  await checkProjectAccess(existingTask.projectId, req.user.id);

  const task = await taskService.updateTask(id, {
    status: taskService.TaskStatus.CANCELLED,
  });

  sendSuccess(res, { task }, 'Task cancelled');
});

/**
 * Get task subtasks
 * GET /api/v1/tasks/:id/subtasks
 */
export const getTaskSubtasks = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw new BadRequestError('User not authenticated');
  }

  const { id } = req.params;

  if (!id) {
    throw new BadRequestError('Task ID is required');
  }

  // Get parent task to check project access
  const parentTask = await taskService.getTaskById(id);
  await checkProjectAccess(parentTask.projectId, req.user.id);

  const result = await taskService.listProjectTasks(parentTask.projectId, {
    parentTaskId: id,
  });

  sendSuccess(res, { tasks: result.tasks });
});

/**
 * Bulk update tasks
 * PATCH /api/v1/tasks/bulk
 */
export const bulkUpdateTasks = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw new BadRequestError('User not authenticated');
  }

  const { taskIds, updates } = req.body;

  if (!Array.isArray(taskIds) || taskIds.length === 0) {
    throw new BadRequestError('taskIds must be a non-empty array');
  }

  if (!updates || typeof updates !== 'object') {
    throw new BadRequestError('updates object is required');
  }

  // Verify all tasks belong to projects the user has access to
  for (const taskId of taskIds) {
    const task = await taskService.getTaskById(taskId);
    await checkProjectAccess(task.projectId, req.user.id);
  }

  // Update all tasks
  const updatedTasks = [];
  for (const taskId of taskIds) {
    const task = await taskService.updateTask(taskId, updates);
    updatedTasks.push(task);
  }

  sendSuccess(res, { tasks: updatedTasks, count: updatedTasks.length }, 'Tasks updated successfully');
});
