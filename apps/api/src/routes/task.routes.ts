/**
 * Task Routes
 * 
 * Defines all task management endpoints with proper middleware.
 */

import { Router } from 'express';
import * as taskController from '../controllers/task.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware';
import {
  createTaskSchema,
  updateTaskSchema,
  assignTaskSchema,
  taskListQuerySchema,
  updateTaskPositionSchema,
} from '@validiant/shared';

const router = Router();

/**
 * All task routes require authentication
 */
router.use(authenticate);

/**
 * Task CRUD endpoints
 */

/**
 * @route   POST /api/v1/tasks
 * @desc    Create a new task
 * @access  Private (project member)
 */
router.post(
  '/',
  validate(createTaskSchema, 'body'),
  taskController.createTask
);

/**
 * @route   GET /api/v1/tasks/my
 * @desc    Get current user's assigned tasks
 * @access  Private
 */
router.get('/my', taskController.getMyTasks);

/**
 * @route   PATCH /api/v1/tasks/bulk
 * @desc    Bulk update tasks
 * @access  Private (project member)
 */
router.patch('/bulk', taskController.bulkUpdateTasks);

/**
 * @route   GET /api/v1/tasks/:id
 * @desc    Get task by ID
 * @access  Private (project member)
 */
router.get('/:id', taskController.getTaskById);

/**
 * @route   PUT /api/v1/tasks/:id
 * @desc    Update task
 * @access  Private (project member)
 */
router.put(
  '/:id',
  validate(updateTaskSchema, 'body'),
  taskController.updateTask
);

/**
 * @route   DELETE /api/v1/tasks/:id
 * @desc    Delete task
 * @access  Private (project member)
 */
router.delete('/:id', taskController.deleteTask);

/**
 * Task assignment endpoints
 */

/**
 * @route   POST /api/v1/tasks/:id/assign
 * @desc    Assign user to task
 * @access  Private (project member)
 */
router.post(
  '/:id/assign',
  validate(assignTaskSchema, 'body'),
  taskController.assignTask
);

/**
 * @route   DELETE /api/v1/tasks/:id/assign/:userId
 * @desc    Unassign user from task
 * @access  Private (project member)
 */
router.delete('/:id/assign/:userId', taskController.unassignTask);

/**
 * Task status change endpoints
 */

/**
 * @route   POST /api/v1/tasks/:id/todo
 * @desc    Mark task as todo
 * @access  Private (project member)
 */
router.post('/:id/todo', taskController.markAsTodo);

/**
 * @route   POST /api/v1/tasks/:id/start
 * @desc    Mark task as in progress
 * @access  Private (project member)
 */
router.post('/:id/start', taskController.markAsInProgress);

/**
 * @route   POST /api/v1/tasks/:id/review
 * @desc    Mark task as in review
 * @access  Private (project member)
 */
router.post('/:id/review', taskController.markAsInReview);

/**
 * @route   POST /api/v1/tasks/:id/complete
 * @desc    Mark task as completed
 * @access  Private (project member)
 */
router.post('/:id/complete', taskController.markAsCompleted);

/**
 * @route   POST /api/v1/tasks/:id/cancel
 * @desc    Cancel task
 * @access  Private (project member)
 */
router.post('/:id/cancel', taskController.cancelTask);

/**
 * Task position and subtasks
 */

/**
 * @route   PATCH /api/v1/tasks/:id/position
 * @desc    Update task position
 * @access  Private (project member)
 */
router.patch(
  '/:id/position',
  validate(updateTaskPositionSchema, 'body'),
  taskController.updateTaskPosition
);

/**
 * @route   GET /api/v1/tasks/:id/subtasks
 * @desc    Get task subtasks
 * @access  Private (project member)
 */
router.get('/:id/subtasks', taskController.getTaskSubtasks);

/**
 * Export router
 */
export default router;
