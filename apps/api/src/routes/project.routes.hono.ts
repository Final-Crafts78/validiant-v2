/**
 * Project Routes (Hono Version)
 * 
 * Project management endpoints with edge-native validation.
 * Migrated from Express to Hono for Cloudflare Workers deployment.
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
} from '@validiant/shared';
import * as projectController from '../controllers/project.controller.hono';
import { authenticate } from '../middleware/auth.hono';

const app = new Hono();

// Authentication required for all project routes
app.use('*', authenticate);

// CRUD operations
app.post('/', zValidator('json', createProjectSchema), projectController.createProject);
app.get('/my', projectController.getMyProjects);
app.get('/:id', projectController.getProjectById);
app.put('/:id', zValidator('json', updateProjectSchema), projectController.updateProject);
app.patch('/:id/settings', zValidator('json', updateProjectSettingsSchema), projectController.updateProjectSettings);
app.delete('/:id', projectController.deleteProject);

// Project actions
app.post('/:id/archive', projectController.archiveProject);
app.post('/:id/unarchive', projectController.unarchiveProject);
app.post('/:id/complete', projectController.completeProject);
app.post('/:id/leave', projectController.leaveProject);

// Member management
app.get('/:id/members', projectController.getProjectMembers);
app.post('/:id/members', zValidator('json', addProjectMemberSchema), projectController.addProjectMember);
app.delete('/:id/members/:userId', projectController.removeProjectMember);

export default app;
