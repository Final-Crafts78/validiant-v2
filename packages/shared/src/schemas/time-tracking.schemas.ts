/**
 * Time Tracking Schemas
 * 
 * Zod validation schemas for time tracking, timers, and timesheet operations.
 */

import { z } from 'zod';
import { TimesheetStatus } from '../types';

/**
 * Timesheet status enum schema
 */
export const timesheetStatusSchema = z.nativeEnum(TimesheetStatus);

/**
 * Create time entry schema
 */
export const createTimeEntrySchema = z.object({
  taskId: z.string().uuid().optional(),
  projectId: z.string().uuid(),
  description: z.string().min(1).max(500).optional(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime().optional(),
  duration: z.number().min(0).optional(), // In seconds
  isBillable: z.boolean().default(true),
  billableRate: z.number().min(0).optional(),
  tags: z.array(z.string()).max(10).optional(),
}).refine(
  (data) => {
    // If endTime is provided, validate it's after startTime
    if (data.endTime) {
      return new Date(data.endTime) > new Date(data.startTime);
    }
    return true;
  },
  { message: 'End time must be after start time', path: ['endTime'] }
).refine(
  (data) => {
    // If both endTime and duration provided, they should match
    if (data.endTime && data.duration) {
      const calculatedDuration = (new Date(data.endTime).getTime() - new Date(data.startTime).getTime()) / 1000;
      return Math.abs(calculatedDuration - data.duration) < 1; // Allow 1 second tolerance
    }
    return true;
  },
  { message: 'Duration must match the time difference', path: ['duration'] }
).refine(
  (data) => {
    // Validate max duration (24 hours)
    if (data.endTime) {
      const durationHours = (new Date(data.endTime).getTime() - new Date(data.startTime).getTime()) / (1000 * 60 * 60);
      return durationHours <= 24;
    }
    if (data.duration) {
      return data.duration <= 24 * 60 * 60; // 24 hours in seconds
    }
    return true;
  },
  { message: 'Time entry cannot exceed 24 hours', path: ['endTime'] }
);

/**
 * Update time entry schema
 */
export const updateTimeEntrySchema = z.object({
  taskId: z.string().uuid().optional().nullable(),
  projectId: z.string().uuid().optional(),
  description: z.string().min(1).max(500).optional(),
  startTime: z.string().datetime().optional(),
  endTime: z.string().datetime().optional().nullable(),
  duration: z.number().min(0).optional(),
  isBillable: z.boolean().optional(),
  billableRate: z.number().min(0).optional().nullable(),
  tags: z.array(z.string()).max(10).optional(),
}).refine(
  (data) => {
    if (data.startTime && data.endTime) {
      return new Date(data.endTime) > new Date(data.startTime);
    }
    return true;
  },
  { message: 'End time must be after start time', path: ['endTime'] }
);

/**
 * Start timer schema
 */
export const startTimerSchema = z.object({
  taskId: z.string().uuid().optional(),
  projectId: z.string().uuid(),
  description: z.string().min(1).max(500).optional(),
  isBillable: z.boolean().default(true),
  billableRate: z.number().min(0).optional(),
  tags: z.array(z.string()).max(10).optional(),
});

/**
 * Stop timer schema
 */
export const stopTimerSchema = z.object({
  description: z.string().min(1).max(500).optional(),
  adjustEndTime: z.string().datetime().optional(),
});

/**
 * Update active timer schema
 */
export const updateActiveTimerSchema = z.object({
  taskId: z.string().uuid().optional().nullable(),
  projectId: z.string().uuid().optional(),
  description: z.string().min(1).max(500).optional(),
  isBillable: z.boolean().optional(),
  billableRate: z.number().min(0).optional(),
  tags: z.array(z.string()).max(10).optional(),
});

/**
 * Create timesheet schema
 */
export const createTimesheetSchema = z.object({
  userId: z.string().uuid(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  notes: z.string().max(1000).optional(),
}).refine(
  (data) => new Date(data.endDate) > new Date(data.startDate),
  { message: 'End date must be after start date', path: ['endDate'] }
);

/**
 * Update timesheet schema
 */
export const updateTimesheetSchema = z.object({
  notes: z.string().max(1000).optional(),
});

/**
 * Submit timesheet schema
 */
export const submitTimesheetSchema = z.object({
  notes: z.string().max(1000).optional(),
});

/**
 * Approve timesheet schema
 */
export const approveTimesheetSchema = z.object({
  approvedHours: z.number().min(0),
  approverNotes: z.string().max(1000).optional(),
});

/**
 * Reject timesheet schema
 */
export const rejectTimesheetSchema = z.object({
  rejectionReason: z.string().min(1).max(1000),
});

/**
 * Time entry filters schema
 */
export const timeEntryFiltersSchema = z.object({
  userId: z.string().uuid().optional(),
  projectId: z.string().uuid().optional(),
  taskId: z.string().uuid().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  isBillable: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
  minDuration: z.number().min(0).optional(),
  maxDuration: z.number().min(0).optional(),
});

/**
 * Timesheet filters schema
 */
export const timesheetFiltersSchema = z.object({
  userId: z.string().uuid().optional(),
  status: timesheetStatusSchema.optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  approverId: z.string().uuid().optional(),
});

/**
 * Time entry sort schema
 */
export const timeEntrySortSchema = z.object({
  field: z.enum(['startTime', 'endTime', 'duration', 'createdAt']),
  direction: z.enum(['asc', 'desc']),
});

/**
 * Timesheet sort schema
 */
export const timesheetSortSchema = z.object({
  field: z.enum(['startDate', 'endDate', 'totalHours', 'status', 'submittedAt']),
  direction: z.enum(['asc', 'desc']),
});

/**
 * Bulk create time entries schema
 */
export const bulkCreateTimeEntriesSchema = z.object({
  entries: z.array(
    z.object({
      taskId: z.string().uuid().optional(),
      projectId: z.string().uuid(),
      description: z.string().max(500).optional(),
      startTime: z.string().datetime(),
      endTime: z.string().datetime(),
      isBillable: z.boolean().default(true),
      billableRate: z.number().min(0).optional(),
      tags: z.array(z.string()).max(10).optional(),
    })
  ).min(1, 'At least one time entry is required').max(100, 'Maximum 100 entries at once'),
});

/**
 * Bulk update time entries schema
 */
export const bulkUpdateTimeEntriesSchema = z.object({
  entryIds: z.array(z.string().uuid()).min(1),
  updates: z.object({
    projectId: z.string().uuid().optional(),
    taskId: z.string().uuid().optional().nullable(),
    isBillable: z.boolean().optional(),
    billableRate: z.number().min(0).optional(),
    tags: z.array(z.string()).max(10).optional(),
  }),
});

/**
 * Bulk delete time entries schema
 */
export const bulkDeleteTimeEntriesSchema = z.object({
  entryIds: z.array(z.string().uuid()).min(1),
});

/**
 * Time report request schema
 */
export const timeReportRequestSchema = z.object({
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  userId: z.string().uuid().optional(),
  projectId: z.string().uuid().optional(),
  groupBy: z.enum(['user', 'project', 'task', 'date', 'week', 'month']).optional(),
  includeUnbillable: z.boolean().default(true),
  format: z.enum(['json', 'csv', 'pdf']).default('json'),
}).refine(
  (data) => new Date(data.endDate) > new Date(data.startDate),
  { message: 'End date must be after start date', path: ['endDate'] }
);

/**
 * Time summary request schema
 */
export const timeSummaryRequestSchema = z.object({
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  userId: z.string().uuid().optional(),
  projectIds: z.array(z.string().uuid()).optional(),
  includeBillableBreakdown: z.boolean().default(true),
}).refine(
  (data) => new Date(data.endDate) > new Date(data.startDate),
  { message: 'End date must be after start date', path: ['endDate'] }
);

/**
 * Lock time entries schema
 */
export const lockTimeEntriesSchema = z.object({
  lockDate: z.string().datetime(),
  reason: z.string().max(500).optional(),
});

/**
 * Unlock time entries schema
 */
export const unlockTimeEntriesSchema = z.object({
  reason: z.string().max(500).optional(),
});

/**
 * Time entry correction schema
 */
export const correctTimeEntrySchema = z.object({
  originalEntryId: z.string().uuid(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  reason: z.string().min(1).max(500),
}).refine(
  (data) => new Date(data.endTime) > new Date(data.startTime),
  { message: 'End time must be after start time', path: ['endTime'] }
);

/**
 * Import time entries schema
 */
export const importTimeEntriesSchema = z.object({
  format: z.enum(['csv', 'json']),
  data: z.string().min(1),
  overwriteExisting: z.boolean().default(false),
  validateOnly: z.boolean().default(false),
});

/**
 * Billable hours settings schema
 */
export const billableHoursSettingsSchema = z.object({
  defaultBillableRate: z.number().min(0),
  currency: z.string().length(3), // ISO currency code
  roundingInterval: z.number().min(1).max(60), // Minutes
  roundingMethod: z.enum(['up', 'down', 'nearest']),
  overtimeMultiplier: z.number().min(1).max(3).optional(),
  weekendMultiplier: z.number().min(1).max(3).optional(),
});

/**
 * Update billable hours settings schema
 */
export const updateBillableHoursSettingsSchema = billableHoursSettingsSchema.partial();

/**
 * Project time budget schema
 */
export const projectTimeBudgetSchema = z.object({
  projectId: z.string().uuid(),
  budgetHours: z.number().min(0),
  alertThreshold: z.number().min(0).max(100), // Percentage
  notifyOnThreshold: z.boolean().default(true),
});

/**
 * Update project time budget schema
 */
export const updateProjectTimeBudgetSchema = z.object({
  budgetHours: z.number().min(0).optional(),
  alertThreshold: z.number().min(0).max(100).optional(),
  notifyOnThreshold: z.boolean().optional(),
});

/**
 * Type inference helpers
 */
export type CreateTimeEntryInput = z.infer<typeof createTimeEntrySchema>;
export type UpdateTimeEntryInput = z.infer<typeof updateTimeEntrySchema>;
export type StartTimerInput = z.infer<typeof startTimerSchema>;
export type StopTimerInput = z.infer<typeof stopTimerSchema>;
export type UpdateActiveTimerInput = z.infer<typeof updateActiveTimerSchema>;
export type CreateTimesheetInput = z.infer<typeof createTimesheetSchema>;
export type UpdateTimesheetInput = z.infer<typeof updateTimesheetSchema>;
export type ApproveTimesheetInput = z.infer<typeof approveTimesheetSchema>;
export type RejectTimesheetInput = z.infer<typeof rejectTimesheetSchema>;
export type TimeEntryFiltersInput = z.infer<typeof timeEntryFiltersSchema>;
export type TimesheetFiltersInput = z.infer<typeof timesheetFiltersSchema>;
export type BulkCreateTimeEntriesInput = z.infer<typeof bulkCreateTimeEntriesSchema>;
export type BulkUpdateTimeEntriesInput = z.infer<typeof bulkUpdateTimeEntriesSchema>;
export type TimeReportRequestInput = z.infer<typeof timeReportRequestSchema>;
export type TimeSummaryRequestInput = z.infer<typeof timeSummaryRequestSchema>;
export type BillableHoursSettingsInput = z.infer<typeof billableHoursSettingsSchema>;
export type ProjectTimeBudgetInput = z.infer<typeof projectTimeBudgetSchema>;
