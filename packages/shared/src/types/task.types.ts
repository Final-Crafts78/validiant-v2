/**
 * Task Types
 * Maps service/controller enum usage to actual DB-stored string values.
 */

export enum TaskStatus {
  UNASSIGNED = 'Unassigned',
  PENDING = 'Pending',
  TODO = 'Pending', // alias — new tasks default to Pending
  IN_PROGRESS = 'In Progress',
  IN_REVIEW = 'In Progress', // no in-review in DB, nearest valid transition
  COMPLETED = 'Completed',
  VERIFIED = 'Verified',
  CANCELLED = 'Completed', // no cancelled in DB, maps to Completed
}

export enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}
