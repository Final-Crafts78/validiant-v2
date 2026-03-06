/**
 * Task Types
 * Maps service/controller enum usage to actual DB-stored string values.
 */

export enum TaskStatus {
  UNASSIGNED = 'Unassigned',
  PENDING = 'Pending',
  IN_PROGRESS = 'In Progress',
  COMPLETED = 'Completed',
  VERIFIED = 'Verified',
}

export enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}
