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
} from '@validiant/shared';
import * as taskController from '../controllers/task.controller';
import * as caseDataController from '../controllers/case-data.controller';

const app = new Hono();

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

app.get('/projects/:projectId/stats', taskController.getProjectStats);

export default app;
