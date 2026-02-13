/**
 * Time Tracking Types
 * 
 * Type definitions for time entries, timers, timesheets,
 * and time-related analytics.
 */

/**
 * Time entry type
 */
export enum TimeEntryType {
  MANUAL = 'manual',
  TIMER = 'timer',
  IMPORTED = 'imported',
}

/**
 * Time entry status
 */
export enum TimeEntryStatus {
  DRAFT = 'draft',
  SUBMITTED = 'submitted',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

/**
 * Core Time Entry interface
 */
export interface TimeEntry {
  id: string;
  userId: string;
  projectId?: string;
  taskId?: string;
  description?: string;
  startTime: Date;
  endTime?: Date;
  duration: number; // in seconds
  billable: boolean;
  hourlyRate?: number;
  type: TimeEntryType;
  status: TimeEntryStatus;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  approvedBy?: string;
  approvedAt?: Date;
}

/**
 * Active timer
 */
export interface Timer {
  id: string;
  userId: string;
  projectId?: string;
  taskId?: string;
  description?: string;
  startedAt: Date;
  pausedAt?: Date;
  totalPausedDuration: number; // in seconds
  isPaused: boolean;
  isActive: boolean;
}

/**
 * Timesheet
 * Collection of time entries for a specific period
 */
export interface Timesheet {
  id: string;
  userId: string;
  organizationId: string;
  startDate: Date;
  endDate: Date;
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
  totalHours: number;
  billableHours: number;
  totalAmount?: number;
  notes?: string;
  submittedAt?: Date;
  approvedBy?: string;
  approvedAt?: Date;
  rejectedReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Time entry with populated data
 */
export interface TimeEntryWithDetails extends TimeEntry {
  user: {
    id: string;
    fullName: string;
    avatarUrl?: string;
  };
  project?: {
    id: string;
    name: string;
    key: string;
  };
  task?: {
    id: string;
    title: string;
    number: number;
  };
}

/**
 * Timesheet with entries
 */
export interface TimesheetWithEntries extends Timesheet {
  entries: TimeEntry[];
  user: {
    id: string;
    fullName: string;
    email: string;
  };
}

/**
 * Time tracking statistics
 */
export interface TimeTrackingStats {
  totalHours: number;
  billableHours: number;
  nonBillableHours: number;
  totalAmount: number;
  averageHoursPerDay: number;
  mostProductiveDay: string;
  leastProductiveDay: string;
  projectBreakdown: ProjectTimeBreakdown[];
  taskBreakdown: TaskTimeBreakdown[];
}

/**
 * Project time breakdown
 */
export interface ProjectTimeBreakdown {
  projectId: string;
  projectName: string;
  totalHours: number;
  billableHours: number;
  percentage: number;
}

/**
 * Task time breakdown
 */
export interface TaskTimeBreakdown {
  taskId: string;
  taskTitle: string;
  totalHours: number;
  estimatedHours?: number;
  percentage: number;
}

/**
 * Daily time summary
 */
export interface DailyTimeSummary {
  date: Date;
  totalHours: number;
  billableHours: number;
  entries: number;
  projects: number;
  tasks: number;
}

/**
 * Weekly time summary
 */
export interface WeeklyTimeSummary {
  weekStart: Date;
  weekEnd: Date;
  totalHours: number;
  billableHours: number;
  dailySummaries: DailyTimeSummary[];
  targetHours: number;
  progress: number; // percentage of target achieved
}

/**
 * Time entry creation data
 */
export interface CreateTimeEntryData {
  projectId?: string;
  taskId?: string;
  description?: string;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  billable?: boolean;
  tags?: string[];
}

/**
 * Time entry update data
 */
export interface UpdateTimeEntryData {
  projectId?: string;
  taskId?: string;
  description?: string;
  startTime?: Date;
  endTime?: Date;
  duration?: number;
  billable?: boolean;
  tags?: string[];
}

/**
 * Timer start data
 */
export interface StartTimerData {
  projectId?: string;
  taskId?: string;
  description?: string;
}

/**
 * Time report filters
 */
export interface TimeReportFilters {
  userId?: string[];
  projectId?: string[];
  taskId?: string[];
  startDate?: Date;
  endDate?: Date;
  billable?: boolean;
  status?: TimeEntryStatus[];
  tags?: string[];
}

/**
 * Time report grouping
 */
export type TimeReportGroupBy = 
  | 'user' 
  | 'project' 
  | 'task' 
  | 'date' 
  | 'week' 
  | 'month';

/**
 * Time report export format
 */
export type TimeReportFormat = 'csv' | 'xlsx' | 'pdf' | 'json';

/**
 * Billable hours summary
 */
export interface BillableHoursSummary {
  userId: string;
  period: {
    start: Date;
    end: Date;
  };
  totalHours: number;
  billableHours: number;
  billableAmount: number;
  hourlyRate: number;
  currency: string;
}

/**
 * Time tracking settings (user-level)
 */
export interface UserTimeTrackingSettings {
  defaultBillable: boolean;
  defaultHourlyRate?: number;
  reminderEnabled: boolean;
  reminderTime?: string; // HH:MM format
  reminderDays: number[]; // 0-6 (Sunday-Saturday)
  trackIdleTime: boolean;
  idleTimeThreshold: number; // in minutes
  autoStopTimer: boolean;
  autoStopDuration: number; // in hours
}

/**
 * Time tracking settings (organization-level)
 */
export interface OrganizationTimeTrackingSettings {
  requireProjectForTimeEntry: boolean;
  requireTaskForTimeEntry: boolean;
  requireDescriptionForTimeEntry: boolean;
  allowManualTimeEntry: boolean;
  allowTimerEditing: boolean;
  requireTimesheetApproval: boolean;
  timesheetPeriod: 'daily' | 'weekly' | 'biweekly' | 'monthly';
  timesheetSubmissionDeadline: number; // days after period end
  overtimeThreshold: number; // hours per week
  minimumTimeEntry: number; // in minutes
  roundingInterval: number; // in minutes (0 for no rounding)
  roundingMethod: 'up' | 'down' | 'nearest';
}

/**
 * Helper to calculate duration between two dates in seconds
 */
export const calculateDuration = (startTime: Date, endTime: Date): number => {
  return Math.floor((endTime.getTime() - startTime.getTime()) / 1000);
};

/**
 * Helper to format duration in seconds to human-readable format
 */
export const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  } else {
    return `${secs}s`;
  }
};

/**
 * Helper to convert seconds to decimal hours
 */
export const secondsToHours = (seconds: number): number => {
  return Math.round((seconds / 3600) * 100) / 100;
};

/**
 * Helper to convert decimal hours to seconds
 */
export const hoursToSeconds = (hours: number): number => {
  return Math.floor(hours * 3600);
};

/**
 * Helper to calculate billable amount
 */
export const calculateBillableAmount = (
  duration: number,
  hourlyRate: number
): number => {
  const hours = secondsToHours(duration);
  return Math.round(hours * hourlyRate * 100) / 100;
};

/**
 * Helper to check if time entry overlaps with another
 */
export const hasTimeOverlap = (
  entry1: TimeEntry,
  entry2: TimeEntry
): boolean => {
  if (!entry1.endTime || !entry2.endTime) return false;
  
  const start1 = new Date(entry1.startTime).getTime();
  const end1 = new Date(entry1.endTime).getTime();
  const start2 = new Date(entry2.startTime).getTime();
  const end2 = new Date(entry2.endTime).getTime();

  return start1 < end2 && start2 < end1;
};

/**
 * Helper to round time based on settings
 */
export const roundTime = (
  minutes: number,
  interval: number,
  method: 'up' | 'down' | 'nearest'
): number => {
  if (interval === 0) return minutes;

  switch (method) {
    case 'up':
      return Math.ceil(minutes / interval) * interval;
    case 'down':
      return Math.floor(minutes / interval) * interval;
    case 'nearest':
      return Math.round(minutes / interval) * interval;
    default:
      return minutes;
  }
};

/**
 * Default user time tracking settings
 */
export const DEFAULT_USER_TIME_TRACKING_SETTINGS: UserTimeTrackingSettings = {
  defaultBillable: true,
  reminderEnabled: false,
  reminderDays: [1, 2, 3, 4, 5], // Monday to Friday
  trackIdleTime: true,
  idleTimeThreshold: 5,
  autoStopTimer: true,
  autoStopDuration: 8,
};

/**
 * Default organization time tracking settings
 */
export const DEFAULT_ORG_TIME_TRACKING_SETTINGS: OrganizationTimeTrackingSettings = {
  requireProjectForTimeEntry: false,
  requireTaskForTimeEntry: false,
  requireDescriptionForTimeEntry: false,
  allowManualTimeEntry: true,
  allowTimerEditing: true,
  requireTimesheetApproval: false,
  timesheetPeriod: 'weekly',
  timesheetSubmissionDeadline: 3,
  overtimeThreshold: 40,
  minimumTimeEntry: 1,
  roundingInterval: 0,
  roundingMethod: 'nearest',
};
