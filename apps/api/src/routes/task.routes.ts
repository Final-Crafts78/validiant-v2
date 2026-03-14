/**
 * Task Routes
 *
 * Task management endpoints with edge-native validation.
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
  createTaskSchema,
  updateTaskSchema,
  assignTaskSchema,
  bulkUploadTaskSchema,
  bulkAssignTasksSchema,
  bulkUpdateTaskStatusSchema,
} from '@validiant/shared';
import * as taskController from '../controllers/task.controller';
import * as caseDataController from '../controllers/case-data.controller';
import { authenticate } from '../middleware/auth';

const app = new Hono();

// Authentication required for all task routes
app.use('*', authenticate);

// CRUD operations
app.post('/', zValidator('json', createTaskSchema), taskController.createTask);
app.post(
  '/bulk',
  zValidator('json', bulkUploadTaskSchema),
  taskController.bulkUploadTasks
);
app.get('/my', taskController.getMyTasks);
app.get('/:id', taskController.getTaskById);
app.put(
  '/:id',
  zValidator('json', updateTaskSchema),
  taskController.updateTask
);
app.delete('/:id', taskController.deleteTask);

// Task actions
app.post(
  '/:id/assign',
  zValidator('json', assignTaskSchema),
  taskController.assignTask
);
app.patch(
  '/bulk-assign',
  zValidator('json', bulkAssignTasksSchema),
  taskController.bulkAssignTasks
);
app.patch(
  '/bulk-status',
  zValidator('json', bulkUpdateTaskStatusSchema),
  taskController.bulkUpdateStatus
);
app.post('/:id/complete', taskController.completeTask);
app.post('/:id/reopen', taskController.reopenTask);

// Case Data & Documents (Phase 16/20/21)
app.get('/case/:caseId', caseDataController.getCaseHub);
app.get('/:taskId/data', caseDataController.getTaskData);
app.patch('/:taskId/fields', caseDataController.updateFieldValues);
app.post('/:taskId/documents', caseDataController.logDocument);
app.post('/:taskId/evidence', caseDataController.uploadEvidence);

// Phase 21: Presigned URL Pipeline
app.post('/:taskId/upload-url', caseDataController.getUploadUrl);
app.post(
  '/:taskId/documents/:fileId/confirm',
  caseDataController.confirmUpload
);

export default app;
