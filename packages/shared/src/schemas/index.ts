/**
 * Schemas Barrel Export
 *
 * Central export point for all Zod validation schemas.
 * Import schemas from this file in other packages and applications.
 */

// User and authentication schemas
export * from './user.schemas';

// Organization and team schemas
export * from './organization.schemas';

// Project and task schemas
export * from './project.schemas';

// Time tracking schemas
export * from './time-tracking.schemas';

// Notification and API schemas
export * from './notification.schemas';

// Task schemas (selective export to avoid collision with project.schemas)
export {
  taskStatusChangeSchema,
  taskAssignSchema,
  bulkUploadTaskSchema,
  optimizeRouteSchema,
  type TaskStatusChangeInput,
  type TaskAssignInput,
  type BulkUploadTaskInput,
  type OptimizeRouteInput,
} from './task.schemas';

// KYC schemas
export * from './kyc.schemas';
