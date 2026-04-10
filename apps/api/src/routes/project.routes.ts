/**
 * Project Routes
 *
 * Project management endpoints with edge-native validation.
 * Edge-compatible Hono implementation for Cloudflare Workers.
 *
 * ELITE PATTERN:
 * - Routes use @hono/zod-validator for edge validation
 * - Controllers blindly trust c.req.valid('json')
 * - Middleware handles auth, routes handle validation
 */

import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { ZodError } from 'zod';
import {
  createProjectSchema,
  updateProjectSchema,
  updateProjectSettingsSchema,
  addProjectMemberSchema,
  createTaskSchema,
  bulkAssignTasksSchema,
  bulkUpdateTaskStatusSchema,
} from '@validiant/shared';
import * as projectController from '../controllers/project.controller';
import * as taskController from '../controllers/task.controller';
import { logger } from '../utils/logger';
import { enforceLimit } from '../middleware/plan';

const app = new Hono();

// CRUD operations
app.post(
  '/',
  zValidator('json', createProjectSchema, async (result, c) => {
    if (!result.success) {
      const error = (result as { error: ZodError }).error;
      const flattenedErrors = error.flatten();
      const rawBody = await c.req
        .json()
        .catch(() => ({ error: 'Could not parse body' }));

      logger.error('[Project:Routes] Validation FAILED (POST /)', {
        errors: flattenedErrors.fieldErrors,
        rawBody, // CRITICAL: See what the frontend actually sent
        path: c.req.path,
        timestamp: new Date().toISOString(),
      });
    }
  }),
  enforceLimit('projects'),
  projectController.createProject
);
app.get('/my', projectController.getMyProjects);
app.get('/:id', projectController.getProjectById);
app.put(
  '/:id',
  zValidator('json', updateProjectSchema, (result, c) => {
    if (!result.success) {
      const error = (result as { error: ZodError }).error;
      const flattenedErrors = error.flatten();
      logger.error('[Project:Routes] Validation FAILED (PUT /:id)', {
        errors: flattenedErrors.fieldErrors,
        projectId: c.req.param('id'),
        timestamp: new Date().toISOString(),
      });
    }
  }),
  projectController.updateProject
);
app.patch(
  '/:id',
  (c, next) => {
    // EXTREME VISIBILITY: Track 404 root cause
    const id = c.req.param('id');
    logger.info(`[Route:Project:PATCH] Received update request for ID: ${id}`, {
      url: c.req.url,
      method: c.req.method,
      matchedPath: c.req.routePath,
      headers: c.req.header(),
      params: c.req.param(),
      query: c.req.query(),
      contentType: c.req.header('Content-Type'),
      timestamp: new Date().toISOString(),
    });
    return next();
  },
  zValidator('json', updateProjectSchema, (result, c) => {
    if (!result.success) {
      const error = (result as { error: ZodError }).error;
      const flattenedErrors = error.flatten();
      logger.error('[Project:Routes] Validation FAILED (PATCH /:id)', {
        errors: flattenedErrors.fieldErrors,
        projectId: c.req.param('id'),
        timestamp: new Date().toISOString(),
      });
    }
  }),
  projectController.updateProject
);
app.patch(
  '/:id/settings',
  zValidator('json', updateProjectSettingsSchema, (result, c) => {
    if (!result.success) {
      const error = (result as { error: ZodError }).error;
      const flattenedErrors = error.flatten();
      logger.error('[Project:Routes] Validation FAILED (PATCH /:id/settings)', {
        errors: flattenedErrors.fieldErrors,
        projectId: c.req.param('id'),
        timestamp: new Date().toISOString(),
      });
    }
  }),
  projectController.updateProjectSettings
);
app.delete('/:id', projectController.deleteProject);

// Project actions
app.post('/:id/archive', projectController.archiveProject);
app.post('/:id/unarchive', projectController.unarchiveProject);
app.post('/:id/complete', projectController.completeProject);
app.post('/:id/leave', projectController.leaveProject);

// Member management
app.get('/:id/members', projectController.getProjectMembers);
app.get('/:id/my-membership', projectController.getMyProjectRole);
app.post(
  '/:id/members',
  zValidator('json', addProjectMemberSchema, (result, c) => {
    if (!result.success) {
      const error = (result as { error: ZodError }).error;
      const flattenedErrors = error.flatten();
      logger.error('[Project:Routes] Validation FAILED (POST /:id/members)', {
        errors: flattenedErrors.fieldErrors,
        projectId: c.req.param('id'),
        timestamp: new Date().toISOString(),
      });
    }
  }),
  projectController.addProjectMember
);
app.delete('/:id/members/:userId', projectController.removeProjectMember);

// ============================================================================
// TASK OPERATIONS (Phase 24 Refactor)
// ============================================================================

/**
 * GET /:projectId/tasks
 * List project tasks
 */
app.get('/:projectId/tasks', taskController.listProjectTasks);

/**
 * POST /:projectId/tasks
 * Create a new task in project
 */
app.post(
  '/:projectId/tasks',
  zValidator('json', createTaskSchema, (result, c) => {
    if (!result.success) {
      const error = (result as { error: ZodError }).error;
      const flattenedErrors = error.flatten();
      logger.error(
        '[Project:Routes] Validation FAILED (POST /:projectId/tasks)',
        {
          errors: flattenedErrors.fieldErrors,
          projectId: c.req.param('projectId'),
          timestamp: new Date().toISOString(),
        }
      );
    }
  }),
  taskController.createTask
);

/**
 * POST /:projectId/tasks/bulk-assign
 * Bulk assign multiple tasks to a user
 */
app.post(
  '/:projectId/tasks/bulk-assign',
  zValidator('json', bulkAssignTasksSchema, (result, c) => {
    if (!result.success) {
      const error = (result as { error: ZodError }).error;
      const flattenedErrors = error.flatten();
      logger.error(
        '[Project:Routes] Validation FAILED (POST /:projectId/tasks/bulk-assign)',
        {
          errors: flattenedErrors.fieldErrors,
          projectId: c.req.param('projectId'),
          timestamp: new Date().toISOString(),
        }
      );
    }
  }),
  taskController.bulkAssignTasks
);

/**
 * POST /:projectId/tasks/bulk-status
 * Bulk update status for multiple tasks
 */
app.post(
  '/:projectId/tasks/bulk-status',
  zValidator('json', bulkUpdateTaskStatusSchema, (result, c) => {
    if (!result.success) {
      const error = (result as { error: ZodError }).error;
      const flattenedErrors = error.flatten();
      logger.error(
        '[Project:Routes] Validation FAILED (POST /:projectId/tasks/bulk-status)',
        {
          errors: flattenedErrors.fieldErrors,
          projectId: c.req.param('projectId'),
          timestamp: new Date().toISOString(),
        }
      );
    }
  }),
  taskController.bulkUpdateStatus
);

/**
 * PATCH /:projectId/tasks/bulk-status
 * Alias for PATCH support
 */
app.patch(
  '/:projectId/tasks/bulk-status',
  zValidator('json', bulkUpdateTaskStatusSchema),
  taskController.bulkUpdateStatus
);

/**
 * GET /:id/stats
 * Project statistics stub - prevent 404s until full analytics is implemented.
 */
app.get('/:id/stats', (c) => {
  const id = c.req.param('id');
  logger.info(`[Project:Routes] Serving /stats STUB for project: ${id}`);
  return c.json({
    success: true,
    data: {
      stats: {
        totalTasks: 0,
        completedTasks: 0,
        pendingTasks: 0,
        efficiency: 100,
        lastActivity: new Date().toISOString()
      }
    }
  });
});

export default app;
