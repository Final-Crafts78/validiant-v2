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
  taskListQuerySchema,
} from '@validiant/shared';
import * as taskController from '../controllers/task.controller';
import { authenticate } from '../middleware/auth';

const app = new Hono();

// Authentication required for all task routes
app.use('*', authenticate);

// CRUD operations
app.post('/', zValidator('json', createTaskSchema), taskController.createTask);
app.get('/my', taskController.getMyTasks);
app.get('/:id', taskController.getTaskById);
app.put('/:id', zValidator('json', updateTaskSchema), taskController.updateTask);
app.delete('/:id', taskController.deleteTask);

// Task actions
app.post('/:id/assign', zValidator('json', assignTaskSchema), taskController.assignTask);
app.post('/:id/complete', taskController.completeTask);
app.post('/:id/reopen', taskController.reopenTask);

export default app;
