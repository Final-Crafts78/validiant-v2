/**
 * Project and Task Types
 * 
 * Core type definitions for project management, task tracking,
 * milestones, and related entities.
 */

/**
 * Project status enumeration
 */
export enum ProjectStatus {
  PLANNING = 'planning',
  ACTIVE = 'active',
  ON_HOLD = 'on_hold',
  COMPLETED = 'completed',
  ARCHIVED = 'archived',
  CANCELLED = 'cancelled',
}

/**
 * Project visibility
 */
export enum ProjectVisibility {
  PUBLIC = 'public',
  PRIVATE = 'private',
  ORGANIZATION = 'organization',
}

/**
 * Project priority
 */
export enum ProjectPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

/**
 * Task status enumeration
 */
export enum TaskStatus {
  TODO = 'todo',
  IN_PROGRESS = 'in_progress',
  IN_REVIEW = 'in_review',
  BLOCKED = 'blocked',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

/**
 * Task priority
 */
export enum TaskPriority {
  NONE = 'none',
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

/**
 * Task type enumeration
 */
export enum TaskType {
  TASK = 'task',
  BUG = 'bug',
  FEATURE = 'feature',
  STORY = 'story',
  EPIC = 'epic',
  SUBTASK = 'subtask',
}

/**
 * Custom field type enumeration
 */
export enum CustomFieldType {
  TEXT = 'text',
  NUMBER = 'number',
  DATE = 'date',
  SELECT = 'select',
  MULTISELECT = 'multiselect',
  CHECKBOX = 'checkbox',
  URL = 'url',
}

/**
 * Task dependency type
 */
export enum DependencyType {
  BLOCKS = 'blocks',
  BLOCKED_BY = 'blocked_by',
  RELATED = 'related',
  DUPLICATES = 'duplicates',
  DUPLICATED_BY = 'duplicated_by',
}

/**
 * Project settings
 */
export interface ProjectSettings {
  allowGuestAccess: boolean;
  requireTaskApproval: boolean;
  enableTimeTracking: boolean;
  enableCustomFields: boolean;
  defaultTaskStatus: TaskStatus;
  autoArchiveCompletedTasks: boolean;
  autoArchiveDays: number;
  notifyOnTaskAssignment: boolean;
  notifyOnTaskCompletion: boolean;
}

/**
 * Core Project interface
 */
export interface Project {
  id: string;
  organizationId: string;
  teamId?: string;
  name: string;
  key: string; // Short identifier (e.g., "PROJ")
  description?: string;
  status: ProjectStatus;
  priority: ProjectPriority;
  visibility: ProjectVisibility;
  settings: ProjectSettings;
  startDate?: Date;
  endDate?: Date;
  budget?: number;
  currency?: string;
  progress: number; // 0-100
  coverImageUrl?: string;
  ownerId: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  archivedAt?: Date;
}

/**
 * Project member role
 */
export enum ProjectMemberRole {
  ADMIN = 'admin',
  MEMBER = 'member',
  VIEWER = 'viewer',
}

/**
 * Project member
 */
export interface ProjectMember {
  id: string;
  projectId: string;
  userId: string;
  role: ProjectMemberRole;
  joinedAt: Date;
  addedBy: string;
}

/**
 * Milestone
 */
export interface Milestone {
  id: string;
  projectId: string;
  name: string;
  description?: string;
  dueDate?: Date;
  status: 'pending' | 'in_progress' | 'completed';
  progress: number; // 0-100
  order: number;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

/**
 * Task custom field value
 */
export interface CustomFieldValue {
  fieldId: string;
  value: string | number | boolean | Date | string[];
}

/**
 * Core Task interface
 */
export interface Task {
  id: string;
  projectId: string;
  milestoneId?: string;
  parentTaskId?: string; // For subtasks
  number: number; // Sequential number within project (e.g., PROJ-123)
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeId?: string;
  reporterId: string;
  tags: string[];
  dueDate?: Date;
  startDate?: Date;
  estimatedHours?: number;
  actualHours?: number;
  progress: number; // 0-100
  customFields?: CustomFieldValue[];
  position: number; // For ordering within lists
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

/**
 * Task dependency
 */
export interface TaskDependency {
  id: string;
  taskId: string;
  dependsOnTaskId: string;
  type: DependencyType;
  createdBy: string;
  createdAt: Date;
}

/**
 * Subtask (extends Task with simplified fields)
 */
export interface Subtask {
  id: string;
  parentTaskId: string;
  title: string;
  status: TaskStatus;
  assigneeId?: string;
  completed: boolean;
  position: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Task comment
 */
export interface TaskComment {
  id: string;
  taskId: string;
  userId: string;
  content: string;
  mentions: string[]; // Array of user IDs mentioned
  attachments?: string[]; // Array of attachment URLs
  parentCommentId?: string; // For threaded replies
  edited: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

/**
 * File attachment
 */
export interface Attachment {
  id: string;
  entityType: 'task' | 'project' | 'comment';
  entityId: string;
  userId: string;
  filename: string;
  originalFilename: string;
  fileUrl: string;
  fileSize: number; // in bytes
  mimeType: string;
  uploadedAt: Date;
}

/**
 * Activity log entry
 */
export interface Activity {
  id: string;
  entityType: 'project' | 'task' | 'milestone';
  entityId: string;
  userId: string;
  action: string; // e.g., 'created', 'updated', 'deleted', 'status_changed'
  changes?: ActivityChange[];
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

/**
 * Activity change detail
 */
export interface ActivityChange {
  field: string;
  oldValue?: string | number | boolean | null;
  newValue?: string | number | boolean | null;
}

/**
 * Task label/tag
 */
export interface TaskLabel {
  id: string;
  projectId: string;
  name: string;
  color: string; // Hex color code
  description?: string;
  createdAt: Date;
}

/**
 * Custom field definition
 */
export interface CustomField {
  id: string;
  organizationId: string;
  projectId?: string; // null for organization-wide fields
  name: string;
  key: string;
  type: 'text' | 'number' | 'date' | 'select' | 'multiselect' | 'checkbox' | 'url';
  options?: string[]; // For select/multiselect types
  required: boolean;
  defaultValue?: string | number | boolean;
  description?: string;
  createdAt: Date;
}

/**
 * Project with aggregated data
 */
export interface ProjectWithStats extends Project {
  taskCount: number;
  completedTaskCount: number;
  memberCount: number;
  milestoneCount: number;
  completedMilestones: number;
  totalEstimatedHours: number;
  totalActualHours: number;
}

/**
 * Task with populated relations
 */
export interface TaskWithDetails extends Task {
  assignee?: {
    id: string;
    fullName: string;
    avatarUrl?: string;
  };
  reporter: {
    id: string;
    fullName: string;
    avatarUrl?: string;
  };
  project: {
    id: string;
    name: string;
    key: string;
  };
  subtaskCount: number;
  completedSubtasks: number;
  commentCount: number;
  attachmentCount: number;
}

/**
 * Project creation data
 */
export interface CreateProjectData {
  name: string;
  key?: string;
  description?: string;
  teamId?: string;
  visibility?: ProjectVisibility;
  priority?: ProjectPriority;
  startDate?: Date;
  endDate?: Date;
  budget?: number;
  currency?: string;
  settings?: Partial<ProjectSettings>;
}

/**
 * Project update data
 */
export interface UpdateProjectData {
  name?: string;
  description?: string;
  status?: ProjectStatus;
  priority?: ProjectPriority;
  visibility?: ProjectVisibility;
  startDate?: Date;
  endDate?: Date;
  budget?: number;
  progress?: number;
  settings?: Partial<ProjectSettings>;
}

/**
 * Task creation data
 */
export interface CreateTaskData {
  projectId: string;
  milestoneId?: string;
  parentTaskId?: string;
  title: string;
  description?: string;
  priority?: TaskPriority;
  assigneeId?: string;
  tags?: string[];
  dueDate?: Date;
  startDate?: Date;
  estimatedHours?: number;
  customFields?: CustomFieldValue[];
}

/**
 * Task update data
 */
export interface UpdateTaskData {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assigneeId?: string;
  tags?: string[];
  dueDate?: Date;
  startDate?: Date;
  estimatedHours?: number;
  progress?: number;
  customFields?: CustomFieldValue[];
}

/**
 * Task filter options
 */
export interface TaskFilters {
  projectId?: string;
  status?: TaskStatus[];
  priority?: TaskPriority[];
  assigneeId?: string[];
  reporterId?: string;
  tags?: string[];
  dueAfter?: Date;
  dueBefore?: Date;
  search?: string;
}

/**
 * Task sort options
 */
export interface TaskSortOptions {
  field: 'createdAt' | 'updatedAt' | 'dueDate' | 'priority' | 'status' | 'title';
  direction: 'asc' | 'desc';
}

/**
 * Default project settings
 */
export const DEFAULT_PROJECT_SETTINGS: ProjectSettings = {
  allowGuestAccess: false,
  requireTaskApproval: false,
  enableTimeTracking: true,
  enableCustomFields: true,
  defaultTaskStatus: TaskStatus.TODO,
  autoArchiveCompletedTasks: false,
  autoArchiveDays: 30,
  notifyOnTaskAssignment: true,
  notifyOnTaskCompletion: true,
};

/**
 * Priority weights for sorting
 */
export const PRIORITY_WEIGHTS: Record<TaskPriority, number> = {
  [TaskPriority.NONE]: 0,
  [TaskPriority.LOW]: 1,
  [TaskPriority.MEDIUM]: 2,
  [TaskPriority.HIGH]: 3,
  [TaskPriority.URGENT]: 4,
};

/**
 * Status weights for workflow ordering
 */
export const STATUS_WEIGHTS: Record<TaskStatus, number> = {
  [TaskStatus.TODO]: 0,
  [TaskStatus.IN_PROGRESS]: 1,
  [TaskStatus.IN_REVIEW]: 2,
  [TaskStatus.BLOCKED]: 3,
  [TaskStatus.COMPLETED]: 4,
  [TaskStatus.CANCELLED]: 5,
};

/**
 * Type guard to check if task is overdue
 */
export const isTaskOverdue = (task: Task): boolean => {
  if (!task.dueDate) return false;
  if (task.status === TaskStatus.COMPLETED || task.status === TaskStatus.CANCELLED) {
    return false;
  }
  return new Date(task.dueDate) < new Date();
};

/**
 * Type guard to check if task is due soon (within 24 hours)
 */
export const isTaskDueSoon = (task: Task): boolean => {
  if (!task.dueDate) return false;
  if (task.status === TaskStatus.COMPLETED || task.status === TaskStatus.CANCELLED) {
    return false;
  }
  const now = new Date();
  const dueDate = new Date(task.dueDate);
  const hoursUntilDue = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60);
  return hoursUntilDue > 0 && hoursUntilDue <= 24;
};

/**
 * Helper to check if user can edit task
 */
export const canEditTask = (
  task: Task,
  userId: string,
  projectRole?: ProjectMemberRole
): boolean => {
  // Task reporter can always edit
  if (task.reporterId === userId) return true;
  // Task assignee can edit
  if (task.assigneeId === userId) return true;
  // Project admins can edit
  if (projectRole === ProjectMemberRole.ADMIN) return true;
  return false;
};

/**
 * Helper to check if user can delete task
 */
export const canDeleteTask = (
  task: Task,
  userId: string,
  projectRole?: ProjectMemberRole
): boolean => {
  // Only task reporter or project admin can delete
  return task.reporterId === userId || projectRole === ProjectMemberRole.ADMIN;
};

/**
 * Calculate project completion percentage
 */
export const calculateProjectProgress = (tasks: Task[]): number => {
  if (tasks.length === 0) return 0;
  const completedTasks = tasks.filter(
    (task) => task.status === TaskStatus.COMPLETED
  ).length;
  return Math.round((completedTasks / tasks.length) * 100);
};

/**
 * Calculate milestone progress
 */
export const calculateMilestoneProgress = (tasks: Task[]): number => {
  if (tasks.length === 0) return 0;
  const totalProgress = tasks.reduce((sum, task) => sum + task.progress, 0);
  return Math.round(totalProgress / tasks.length);
};
