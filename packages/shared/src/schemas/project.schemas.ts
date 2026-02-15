/**
 * Project and Task Schemas
 * 
 * Zod validation schemas for project and task management operations.
 */

import { z } from 'zod';
import { VALIDATION } from '../constants';
import {
  ProjectStatus,
  ProjectVisibility,
  ProjectPriority,
  TaskStatus,
  TaskPriority,
  TaskType,
  CustomFieldType,
} from '../types';

/**
 * Enum schemas
 */
export const projectStatusSchema = z.nativeEnum(ProjectStatus);
export const projectVisibilitySchema = z.nativeEnum(ProjectVisibility);
export const projectPrioritySchema = z.nativeEnum(ProjectPriority);
export const taskStatusSchema = z.nativeEnum(TaskStatus);
export const taskPrioritySchema = z.nativeEnum(TaskPriority);
export const taskTypeSchema = z.nativeEnum(TaskType);
export const customFieldTypeSchema = z.nativeEnum(CustomFieldType);

/**
 * Project name schema
 */
export const projectNameSchema = z
  .string()
  .min(VALIDATION.PROJECT_NAME.MIN_LENGTH, `Project name must be at least ${VALIDATION.PROJECT_NAME.MIN_LENGTH} characters`)
  .max(VALIDATION.PROJECT_NAME.MAX_LENGTH, `Project name must not exceed ${VALIDATION.PROJECT_NAME.MAX_LENGTH} characters`)
  .trim();

/**
 * Project key schema
 */
export const projectKeySchema = z
  .string()
  .min(VALIDATION.PROJECT_KEY.MIN_LENGTH, `Project key must be at least ${VALIDATION.PROJECT_KEY.MIN_LENGTH} characters`)
  .max(VALIDATION.PROJECT_KEY.MAX_LENGTH, `Project key must not exceed ${VALIDATION.PROJECT_KEY.MAX_LENGTH} characters`)
  .regex(VALIDATION.PROJECT_KEY.REGEX, 'Project key must start with a letter and contain only uppercase letters and numbers')
  .toUpperCase();

/**
 * Task title schema
 */
export const taskTitleSchema = z
  .string()
  .min(VALIDATION.TASK_TITLE.MIN_LENGTH, `Task title must be at least ${VALIDATION.TASK_TITLE.MIN_LENGTH} characters`)
  .max(VALIDATION.TASK_TITLE.MAX_LENGTH, `Task title must not exceed ${VALIDATION.TASK_TITLE.MAX_LENGTH} characters`)
  .trim();

/**
 * Description schema
 */
export const descriptionSchema = z
  .string()
  .max(VALIDATION.DESCRIPTION.MAX_LENGTH, `Description must not exceed ${VALIDATION.DESCRIPTION.MAX_LENGTH} characters`)
  .optional();

/**
 * Create project schema
 */
export const createProjectSchema = z.object({
  name: projectNameSchema,
  key: projectKeySchema,
  description: descriptionSchema,
  organizationId: z.string().uuid(),
  teamId: z.string().uuid().optional(),
  visibility: projectVisibilitySchema.default(ProjectVisibility.PRIVATE),
  priority: projectPrioritySchema.default(ProjectPriority.MEDIUM),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  budget: z.number().min(0).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format').optional(),
  iconUrl: z.string().url().optional(),
}).refine(
  (data) => {
    if (data.startDate && data.endDate) {
      return new Date(data.startDate) < new Date(data.endDate);
    }
    return true;
  },
  { message: 'Start date must be before end date', path: ['endDate'] }
);

/**
 * Update project schema
 */
export const updateProjectSchema = z.object({
  name: projectNameSchema.optional(),
  description: descriptionSchema,
  visibility: projectVisibilitySchema.optional(),
  priority: projectPrioritySchema.optional(),
  status: projectStatusSchema.optional(),
  startDate: z.string().datetime().optional().nullable(),
  endDate: z.string().datetime().optional().nullable(),
  budget: z.number().min(0).optional().nullable(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  iconUrl: z.string().url().optional().nullable(),
}).refine(
  (data) => {
    if (data.startDate && data.endDate) {
      return new Date(data.startDate) < new Date(data.endDate);
    }
    return true;
  },
  { message: 'Start date must be before end date', path: ['endDate'] }
);

/**
 * Project settings schema
 */
export const projectSettingsSchema = z.object({
  autoArchive: z.boolean(),
  autoArchiveDays: z.number().min(1).max(365).optional(),
  requireTaskApproval: z.boolean(),
  allowGuestComments: z.boolean(),
  defaultTaskPriority: taskPrioritySchema,
  defaultTaskType: taskTypeSchema,
  enableTimeTracking: z.boolean(),
  enableSubtasks: z.boolean(),
  enableDependencies: z.boolean(),
  notifyOnTaskAssignment: z.boolean(),
  notifyOnTaskCompletion: z.boolean(),
});

/**
 * Update project settings schema
 */
export const updateProjectSettingsSchema = projectSettingsSchema.partial();

/**
 * Create task schema
 */
export const createTaskSchema = z.object({
  title: taskTitleSchema,
  description: descriptionSchema,
  projectId: z.string().uuid(),
  parentTaskId: z.string().uuid().optional(),
  assigneeId: z.string().uuid().optional(),
  reporterId: z.string().uuid().optional(),
  type: taskTypeSchema.default(TaskType.TASK),
  status: taskStatusSchema.default(TaskStatus.TODO),
  priority: taskPrioritySchema.default(TaskPriority.MEDIUM),
  dueDate: z.string().datetime().optional(),
  estimatedHours: z.number().min(0).max(1000).optional(),
  labels: z.array(z.string().uuid()).optional(),
  customFields: z.record(z.unknown()).optional(),
});

/**
 * Update task schema
 */
export const updateTaskSchema = z.object({
  title: taskTitleSchema.optional(),
  description: descriptionSchema,
  assigneeId: z.string().uuid().optional().nullable(),
  reporterId: z.string().uuid().optional(),
  type: taskTypeSchema.optional(),
  status: taskStatusSchema.optional(),
  priority: taskPrioritySchema.optional(),
  dueDate: z.string().datetime().optional().nullable(),
  estimatedHours: z.number().min(0).max(1000).optional().nullable(),
  actualHours: z.number().min(0).optional(),
  completedAt: z.string().datetime().optional().nullable(),
  labels: z.array(z.string().uuid()).optional(),
  customFields: z.record(z.unknown()).optional(),
});

/**
 * Task status update schema
 */
export const updateTaskStatusSchema = z.object({
  status: taskStatusSchema,
  comment: z.string().max(500).optional(),
});

/**
 * Task assignment schema
 */
export const assignTaskSchema = z.object({
  assigneeId: z.string().uuid(),
  notifyAssignee: z.boolean().default(true),
});

/**
 * Bulk task assignment schema
 */
export const bulkAssignTasksSchema = z.object({
  taskIds: z.array(z.string().uuid()).min(1, 'At least one task is required'),
  assigneeId: z.string().uuid(),
  notifyAssignee: z.boolean().default(true),
});

/**
 * Task move schema
 */
export const moveTaskSchema = z.object({
  projectId: z.string().uuid(),
  status: taskStatusSchema.optional(),
});

/**
 * Task list query schema
 * For paginated task listing with optional filters
 */
export const taskListQuerySchema = z.object({
  projectId: z.string().uuid().optional(),
  status: taskStatusSchema.optional(),
  assigneeId: z.string().uuid().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

/**
 * Update task position schema
 * For drag-and-drop task reordering
 * CATEGORY 5 FIX: Added for task position updates
 */
export const updateTaskPositionSchema = z.object({
  position: z.number(),
});

/**
 * Create milestone schema
 */
export const createMilestoneSchema = z.object({
  name: z.string().min(3).max(100),
  description: descriptionSchema,
  projectId: z.string().uuid(),
  dueDate: z.string().datetime(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
});

/**
 * Update milestone schema
 */
export const updateMilestoneSchema = z.object({
  name: z.string().min(3).max(100).optional(),
  description: descriptionSchema,
  dueDate: z.string().datetime().optional(),
  completedAt: z.string().datetime().optional().nullable(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
});

/**
 * Create label schema
 */
export const createLabelSchema = z.object({
  name: z.string().min(2).max(50),
  description: z.string().max(200).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  projectId: z.string().uuid().optional(),
});

/**
 * Update label schema
 */
export const updateLabelSchema = z.object({
  name: z.string().min(2).max(50).optional(),
  description: z.string().max(200).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
});

/**
 * Create custom field schema
 */
export const createCustomFieldSchema = z.object({
  name: z.string().min(2).max(50),
  description: z.string().max(200).optional(),
  type: customFieldTypeSchema,
  projectId: z.string().uuid(),
  required: z.boolean().default(false),
  options: z.array(z.string()).optional(),
  defaultValue: z.unknown().optional(),
  validation: z.object({
    min: z.number().optional(),
    max: z.number().optional(),
    pattern: z.string().optional(),
  }).optional(),
});

/**
 * Update custom field schema
 */
export const updateCustomFieldSchema = z.object({
  name: z.string().min(2).max(50).optional(),
  description: z.string().max(200).optional(),
  required: z.boolean().optional(),
  options: z.array(z.string()).optional(),
  defaultValue: z.unknown().optional(),
  validation: z.object({
    min: z.number().optional(),
    max: z.number().optional(),
    pattern: z.string().optional(),
  }).optional(),
});

/**
 * Create comment schema
 */
export const createCommentSchema = z.object({
  content: z.string().min(1).max(5000),
  parentCommentId: z.string().uuid().optional(),
  mentions: z.array(z.string().uuid()).optional(),
});

/**
 * Update comment schema
 */
export const updateCommentSchema = z.object({
  content: z.string().min(1).max(5000),
});

/**
 * Task dependency schema
 */
export const taskDependencySchema = z.object({
  dependsOnTaskId: z.string().uuid(),
  type: z.enum(['blocks', 'blocked_by', 'relates_to', 'duplicates']),
});

/**
 * Add project member schema
 */
export const addProjectMemberSchema = z.object({
  userId: z.string().uuid(),
  role: z.enum(['owner', 'admin', 'member', 'viewer']),
});

/**
 * Bulk add project members schema
 */
export const bulkAddProjectMembersSchema = z.object({
  members: z.array(
    z.object({
      userId: z.string().uuid(),
      role: z.enum(['owner', 'admin', 'member', 'viewer']),
    })
  ).min(1).max(100),
});

/**
 * Update project member role schema
 */
export const updateProjectMemberRoleSchema = z.object({
  role: z.enum(['owner', 'admin', 'member', 'viewer']),
});

/**
 * Project filters schema
 */
export const projectFiltersSchema = z.object({
  search: z.string().optional(),
  status: projectStatusSchema.optional(),
  visibility: projectVisibilitySchema.optional(),
  priority: projectPrioritySchema.optional(),
  organizationId: z.string().uuid().optional(),
  teamId: z.string().uuid().optional(),
  ownerId: z.string().uuid().optional(),
  archived: z.boolean().optional(),
});

/**
 * Task filters schema
 */
export const taskFiltersSchema = z.object({
  search: z.string().optional(),
  projectId: z.string().uuid().optional(),
  assigneeId: z.string().uuid().optional(),
  reporterId: z.string().uuid().optional(),
  status: taskStatusSchema.optional(),
  priority: taskPrioritySchema.optional(),
  type: taskTypeSchema.optional(),
  labels: z.array(z.string().uuid()).optional(),
  milestoneId: z.string().uuid().optional(),
  dueDateFrom: z.string().datetime().optional(),
  dueDateTo: z.string().datetime().optional(),
  overdue: z.boolean().optional(),
  unassigned: z.boolean().optional(),
});

/**
 * Project sort schema
 */
export const projectSortSchema = z.object({
  field: z.enum(['createdAt', 'updatedAt', 'name', 'priority', 'startDate', 'endDate']),
  direction: z.enum(['asc', 'desc']),
});

/**
 * Task sort schema
 */
export const taskSortSchema = z.object({
  field: z.enum(['createdAt', 'updatedAt', 'title', 'priority', 'status', 'dueDate']),
  direction: z.enum(['asc', 'desc']),
});

/**
 * Bulk update tasks schema
 */
export const bulkUpdateTasksSchema = z.object({
  taskIds: z.array(z.string().uuid()).min(1),
  updates: z.object({
    status: taskStatusSchema.optional(),
    priority: taskPrioritySchema.optional(),
    assigneeId: z.string().uuid().optional(),
    labels: z.array(z.string().uuid()).optional(),
    milestoneId: z.string().uuid().optional().nullable(),
  }),
});

/**
 * Bulk delete tasks schema
 */
export const bulkDeleteTasksSchema = z.object({
  taskIds: z.array(z.string().uuid()).min(1),
  permanent: z.boolean().default(false),
});

/**
 * Task template schema
 */
export const createTaskTemplateSchema = z.object({
  name: z.string().min(3).max(100),
  description: descriptionSchema,
  projectId: z.string().uuid(),
  tasks: z.array(
    z.object({
      title: taskTitleSchema,
      description: descriptionSchema,
      type: taskTypeSchema,
      priority: taskPrioritySchema,
      estimatedHours: z.number().min(0).optional(),
      order: z.number().min(0),
    })
  ).min(1),
});

/**
 * Archive project schema
 */
export const archiveProjectSchema = z.object({
  reason: z.string().max(500).optional(),
});

/**
 * Duplicate project schema
 */
export const duplicateProjectSchema = z.object({
  name: projectNameSchema,
  key: projectKeySchema,
  includeTasks: z.boolean().default(false),
  includeMembers: z.boolean().default(false),
  includeSettings: z.boolean().default(true),
});

/**
 * Project list query schema
 * For paginated project listing with filters
 * CATEGORY 5 FIX: Added for project list pagination
 */
export const projectListQuerySchema = z.object({
  organizationId: z.string().uuid().optional(),
  status: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  sortBy: z.enum(['createdAt', 'updatedAt', 'name', 'priority']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

/**
 * Type inference helpers
 */
export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type UpdateProjectSettingsInput = z.infer<typeof updateProjectSettingsSchema>;
export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type UpdateTaskStatusInput = z.infer<typeof updateTaskStatusSchema>;
export type AssignTaskInput = z.infer<typeof assignTaskSchema>;
export type BulkAssignTasksInput = z.infer<typeof bulkAssignTasksSchema>;
export type TaskListQueryInput = z.infer<typeof taskListQuerySchema>;
export type UpdateTaskPositionInput = z.infer<typeof updateTaskPositionSchema>;
export type CreateMilestoneInput = z.infer<typeof createMilestoneSchema>;
export type UpdateMilestoneInput = z.infer<typeof updateMilestoneSchema>;
export type CreateLabelInput = z.infer<typeof createLabelSchema>;
export type UpdateLabelInput = z.infer<typeof updateLabelSchema>;
export type CreateCustomFieldInput = z.infer<typeof createCustomFieldSchema>;
export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type UpdateCommentInput = z.infer<typeof updateCommentSchema>;
export type TaskDependencyInput = z.infer<typeof taskDependencySchema>;
export type AddProjectMemberInput = z.infer<typeof addProjectMemberSchema>;
export type ProjectFiltersInput = z.infer<typeof projectFiltersSchema>;
export type TaskFiltersInput = z.infer<typeof taskFiltersSchema>;
export type BulkUpdateTasksInput = z.infer<typeof bulkUpdateTasksSchema>;
export type ProjectListQueryInput = z.infer<typeof projectListQuerySchema>;
