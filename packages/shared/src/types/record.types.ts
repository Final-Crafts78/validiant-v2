/**
 * Record and Schema Engine Types
 *
 * Core type definitions for the dynamic data universe,
 * including custom project types, columns, and records.
 */

/**
 * Column types for the project data universe
 */
export enum ColumnType {
  TEXT = 'text',
  LONG_TEXT = 'long_text',
  NUMBER = 'number',
  CURRENCY = 'currency',
  DATE = 'date',
  DATE_RANGE = 'date_range',
  SELECT = 'select',
  MULTI_SELECT = 'multi_select',
  CHECKBOX = 'checkbox',
  FILE_UPLOAD = 'file_upload',
  PHOTO_CAPTURE = 'photo_capture',
  GPS_LOCATION = 'gps_location',
  SIGNATURE = 'signature',
  BARCODE_SCAN = 'barcode_scan',
  PHONE = 'phone',
  EMAIL = 'email',
  URL = 'url',
  PERSON = 'person',
  RELATION = 'relation',
  FORMULA = 'formula',
  RATING = 'rating',
  STATUS = 'status',
  TIMER = 'timer',
}

/**
 * Project Type (evolves from verification_types)
 * Defines a structural category for data (e.g., "Address Check")
 */
export interface ProjectType {
  id: string;
  projectId: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  order: number;
  settings: ProjectTypeSettings;
  columns?: TypeColumn[]; // Relation: Columns belonging to this type
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProjectTypeSettings {
  requiredFields?: string[];
  slaHours?: number;
  gpsRequired?: boolean;
  allowedCreators?: ('admin' | 'member' | 'field_agent')[];
}

/**
 * Type Column (evolves from field_schema JSONB)
 * Defines a specific field within a Project Type
 */
export interface TypeColumn {
  id: string;
  typeId: string;
  projectId: string;
  name: string;
  key: string;
  columnType: ColumnType;
  options?: ColumnOptions;
  settings: ColumnSettings;
  order: number;
  createdAt: Date;
}

export interface ColumnOptions {
  choices?: { value: string; label: string; color?: string }[];
  // For future use: targetProjectId, expression, etc.
}

export interface ColumnSettings {
  required?: boolean;
  visibleTo?: ('admin' | 'member' | 'field_agent' | 'client_portal')[];
  editableBy?: ('admin' | 'member')[];
  showInList?: boolean;
  showInCard?: boolean;
  showInMobile?: boolean;
  defaultValue?: unknown;
  hint?: string;
  validation?: { [rule: string]: unknown };
}

/**
 * Project Record (next-gen of tasks)
 * The actual data instance containing custom field values
 *
 * ⚠️ IMPORTANT: Named `ProjectRecord` (not `Record`) to avoid collision with
 * the built-in TypeScript `Record<K, V>` utility type.
 */
export interface ProjectRecord {
  id: string;
  projectId: string;
  typeId: string;
  number: number;
  displayId: string;
  data: { [columnKey: string]: unknown };
  status: string;
  assignedTo?: string;
  createdBy?: string;
  createdVia: 'web' | 'mobile' | 'api' | 'csv_import';
  clientId?: string;
  gpsLat?: number;
  gpsLng?: number;
  gpsAccuracy?: number;
  submittedAt?: Date;
  closedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Record change history
 * Immutable audit trail for all record events
 */
export interface RecordHistory {
  id: string;
  recordId: string;
  changedBy?: string;
  changeType: 'created' | 'updated' | 'status_changed' | 'assigned' | 'comment';
  diff?: { [field: string]: { old: unknown; new: unknown } };
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

/**
 * Organization Sub-Account (Field Agents, Client Viewers, Partners)
 */
export interface OrgSubAccount {
  id: string;
  orgId: string;
  userId?: string;
  accountType: 'field_agent' | 'client_viewer' | 'partner';
  name: string;
  email?: string;
  phone?: string;
  industry?: string;
  projectAccess: { projectId: string; role: string }[];
  portalToken?: string;
  metadata?: Record<string, unknown>;
  isActive: boolean;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Type Template (Reusable Schema Definition)
 */
export interface TypeTemplate {
  id: string;
  orgId?: string;
  name: string;
  description?: string;
  industry?: string;
  typeDefinition: {
    typeName: string;
    typeIcon?: string;
    typeColor?: string;
    columns: Omit<TypeColumn, 'id' | 'typeId' | 'projectId' | 'createdAt'>[];
  };
  isPublic: boolean;
  createdBy?: string;
  createdAt: Date;
}
