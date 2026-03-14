/**
 * Task Zod Schemas
 *
 * Validation schemas for task-related API endpoints.
 */

import { z } from 'zod';
import { BGV_STATUSES } from '../bgv-status';

/**
 * Create task schema
 */
export const createTaskSchema = z.object({
  projectId: z.string().uuid(),
  title: z.string().min(1).max(200),
  description: z.string().max(5000).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  clientName: z.string().max(200).optional(),
  pincode: z.string().length(6).optional(),
  address: z.string().optional(),
  mapUrl: z.string().url().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  dueDate: z.string().datetime().optional(),
});

/**
 * Update task schema
 */
export const updateTaskSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(5000).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  clientName: z.string().max(200).optional(),
  pincode: z.string().length(6).optional(),
  address: z.string().optional(),
  mapUrl: z.string().url().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  dueDate: z.string().datetime().optional().nullable(),
});

/**
 * Task status change schema (validates against state machine)
 */
export const taskStatusChangeSchema = z.object({
  statusKey: z.enum(BGV_STATUSES),
});

/**
 * Task assign schema
 */
export const taskAssignSchema = z.object({
  userId: z.string().uuid(),
});

/**
 * Bulk upload schema
 */
export const bulkUploadTaskSchema = z.object({
  projectId: z.string().uuid(),
  tasks: z
    .array(
      z.object({
        title: z.string().min(1),
        description: z.string().optional(),
        priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
        clientName: z.string().optional(),
        pincode: z.string().optional(),
        address: z.string().optional(),
        mapUrl: z.string().optional(),
      })
    )
    .min(1)
    .max(500),
});

/**
 * Task optimize route schema (VRP)
 */
export const optimizeRouteSchema = z.object({
  currentLatitude: z.number(),
  currentLongitude: z.number(),
  taskIds: z.array(z.string().uuid()).min(1).max(25),
});

/**
 * Bulk task assignment schema
 */
export const bulkAssignTasksSchema = z.object({
  taskIds: z.array(z.string().uuid()).min(1, 'At least one task is required'),
  assigneeId: z.string().uuid(),
});

/**
 * Bulk status update schema
 */
export const bulkUpdateTaskStatusSchema = z.object({
  taskIds: z.array(z.string().uuid()).min(1, 'At least one task is required'),
  statusKey: z.enum(BGV_STATUSES),
});

// Type exports
export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type TaskStatusChangeInput = z.infer<typeof taskStatusChangeSchema>;
export type TaskAssignInput = z.infer<typeof taskAssignSchema>;
export type BulkUploadTaskInput = z.infer<typeof bulkUploadTaskSchema>;
export type OptimizeRouteInput = z.infer<typeof optimizeRouteSchema>;
export type BulkAssignTasksInput = z.infer<typeof bulkAssignTasksSchema>;
export type BulkUpdateTaskStatusInput = z.infer<
  typeof bulkUpdateTaskStatusSchema
>;
