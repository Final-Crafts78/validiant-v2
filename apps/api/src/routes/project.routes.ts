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
import {
  createProjectSchema,
  updateProjectSchema,
  updateProjectSettingsSchema,
  addProjectMemberSchema,
  createTaskSchema,
} from '@validiant/shared';
import * as projectController from '../controllers/project.controller';
import * as taskController from '../controllers/task.controller';

const app = new Hono();

// CRUD operations
app.post(
  '/',
  zValidator('json', createProjectSchema, async (result, c) => {
    if (!result.success) {
      const flattenedErrors = result.error.flatten();
      const rawBody = await c.req
        .json()
        .catch(() => ({ error: 'Could not parse body' }));
      
      console.error('[Project:Routes] Validation FAILED (POST /)', {
        errors: flattenedErrors.fieldErrors,
        rawBody, // CRITICAL: See what the frontend actually sent
        path: c.req.path,
        timestamp: new Date().toISOString(),
      });
    }
  }),
  projectController.createProject
);
app.get('/my', projectController.getMyProjects);
app.get('/:id', projectController.getProjectById);
app.put(
  '/:id',
  zValidator('json', updateProjectSchema, (result, c) => {
    if (!result.success) {
      const flattenedErrors = result.error.flatten();
      console.error('[Project:Routes] Validation FAILED (PUT /:id)', {
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
  zValidator('json', updateProjectSchema, (result, c) => {
    if (!result.success) {
      const flattenedErrors = result.error.flatten();
      console.error('[Project:Routes] Validation FAILED (PATCH /:id)', {
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
      const flattenedErrors = result.error.flatten();
      console.error(
        '[Project:Routes] Validation FAILED (PATCH /:id/settings)',
        {
          errors: flattenedErrors.fieldErrors,
          projectId: c.req.param('id'),
          timestamp: new Date().toISOString(),
        }
      );
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
      const flattenedErrors = result.error.flatten();
      console.error('[Project:Routes] Validation FAILED (POST /:id/members)', {
        errors: flattenedErrors.fieldErrors,
        projectId: c.req.param('id'),
        timestamp: new Date().toISOString(),
      });
    }
  }),
  projectController.addProjectMember
);
app.delete('/:id/members/:userId', projectController.removeProjectMember);

// Task sub-routes
app.get('/:projectId/tasks', taskController.listProjectTasks);
app.post(
  '/:projectId/tasks',
  zValidator('json', createTaskSchema, (result, c) => {
    if (!result.success) {
      const flattenedErrors = result.error.flatten();
      console.error(
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

export default app;
