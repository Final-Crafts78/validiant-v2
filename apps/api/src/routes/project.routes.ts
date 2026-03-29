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
  zValidator('json', createProjectSchema),
  projectController.createProject
);
app.get('/my', projectController.getMyProjects);
app.get('/:id', projectController.getProjectById);
app.put(
  '/:id',
  zValidator('json', updateProjectSchema),
  projectController.updateProject
);
app.patch(
  '/:id/settings',
  zValidator('json', updateProjectSettingsSchema),
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
  zValidator('json', addProjectMemberSchema),
  projectController.addProjectMember
);
app.delete('/:id/members/:userId', projectController.removeProjectMember);

// Task sub-routes
app.get('/:projectId/tasks', taskController.listProjectTasks);
app.post(
  '/:projectId/tasks',
  zValidator('json', createTaskSchema),
  taskController.createTask
);

export default app;
