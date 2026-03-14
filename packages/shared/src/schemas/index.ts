/**
 * Schemas Barrel Export
 *
 * Central export point for all Zod validation schemas.
 * Import schemas from this file in other packages and applications.
 */

// User and authentication schemas
export * from './user.schemas';
export * from './user-preferences.schema';

// Organization and team schemas
export * from './organization.schemas';

// Project and task schemas
export * from './project.schemas';

// Time tracking schemas
export * from './time-tracking.schemas';

// Notification and API schemas
export * from './notification.schemas';

// Verification Type schemas (Phase 11)
export * from './verification.schemas';

// BGV Partner schemas (Phase 13)
export * from './bgv-partner.schemas';

// Task schemas (selective export to avoid collision with project.schemas)
export {
  taskStatusChangeSchema,
  taskAssignSchema,
  bulkUploadTaskSchema,
  optimizeRouteSchema,
  bulkAssignTasksSchema,
  bulkUpdateTaskStatusSchema,
  type TaskStatusChangeInput,
  type TaskAssignInput,
  type BulkUploadTaskInput,
  type OptimizeRouteInput,
  type BulkAssignTasksInput,
  type BulkUpdateTaskStatusInput,
} from './task.schemas';

// KYC schemas
export * from './kyc.schemas';

// Inbound Case schemas (Phase 14)
export * from './inbound-case.schemas';

// CSV Import schemas (Phase 15)
export * from './csv-import.schemas';
