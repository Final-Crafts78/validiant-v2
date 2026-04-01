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

/**
 * Field Schema for Dynamic Task Execution
 */
export interface FieldSchema {
  fieldKey: string;
  label: string;
  type:
    | 'text'
    | 'textarea'
    | 'boolean'
    | 'photo-request'
    | 'signature'
    | 'pdf-upload';
  required?: boolean;
  validationRules?: {
    requireGeoTag?: boolean;
    [key: string]: unknown;
  };
  prompt?: string;
  [key: string]: unknown;
}

/**
 * Verification Type (Schema Template)
 */
export interface VerificationType {
  id: string;
  organizationId: string;
  name: string;
  code: string; // e.g. "PRJ_123_CUSTOM"
  fieldSchema: FieldSchema[];
  isActive: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}

/**
 * Verification Task Metadata
 * Used to type-safely access custom fields in verification contexts.
 */
export interface VerificationTaskMetadata {
  caseId?: string;
  googleMapsLink?: string;
  targetLatitude?: string | number;
  targetLongitude?: string | number;
  [key: string]: unknown;
}

/**
 * Verification-aware Task extension
 */
import { Task } from './project.types';
export interface VerificationTask extends Omit<Task, 'customFields'> {
  customFields?: VerificationTaskMetadata;
  customData?: Record<string, unknown>;
}
