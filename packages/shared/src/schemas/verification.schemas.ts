/**
 * Verification Type Zod Schemas
 *
 * Architecture for the extensible core of the BGV product.
 */

import { z } from 'zod';

/**
 * Supported field types for EAV storage
 */
export const FIELD_TYPES = [
  'text',
  'number',
  'date',
  'boolean',
  'select',
  'multi_select',
  'photo',
  'document',
  'gps_location',
] as const;

export type FieldType = (typeof FIELD_TYPES)[number];

/**
 * Role-based visibility and editability
 */
export const ORG_ROLE_KEYS = [
  'owner',
  'admin',
  'manager',
  'executive',
  'member',
  'viewer',
] as const;

export type OrgRoleKey = (typeof ORG_ROLE_KEYS)[number];

/**
 * Upload configuration for photo/document types
 */
export const uploadConfigSchema = z.object({
  allowedMimeTypes: z
    .array(z.string())
    .default(['image/jpeg', 'image/png', 'application/pdf']),
  maxFileSizeMb: z.number().min(0.1).max(50).default(5),
  maxFiles: z.number().min(1).max(10).default(1),
  requireGeoTag: z.boolean().default(false),
  requireLiveCapture: z.boolean().default(false),
  watermarkEnabled: z.boolean().default(false),
});

/**
 * Single field definition within a verification type
 */
export const fieldDefinitionSchema = z.object({
  id: z.string().uuid().optional(), // Internal ID for tracking
  key: z
    .string()
    .min(1)
    .max(50)
    .regex(/^[a-z0-9_]+$/, 'Key must be alphanumeric with underscores'),
  label: z.string().min(1).max(100),
  type: z.enum(FIELD_TYPES),
  isRequired: z.boolean().default(false),
  placeholder: z.string().optional(),
  helpText: z.string().optional(),

  // Conditional logic (Field A shows if Field B has value X)
  conditionalOn: z
    .object({
      fieldKey: z.string(),
      operator: z.enum(['eq', 'neq', 'contains', 'exists']),
      value: z.any().optional(),
    })
    .optional(),

  // Role Gate
  visibleTo: z
    .array(z.enum(ORG_ROLE_KEYS))
    .default(['owner', 'admin', 'manager', 'executive', 'member', 'viewer']),
  editableBy: z
    .array(z.enum(ORG_ROLE_KEYS))
    .default(['owner', 'admin', 'manager', 'executive', 'member']),

  // Type specific configs
  options: z
    .array(
      z.object({
        label: z.string(),
        value: z.string(),
      })
    )
    .optional(), // for select/multi_select

  uploadConfig: uploadConfigSchema.optional(), // for photo/document
});

export type FieldDefinition = z.infer<typeof fieldDefinitionSchema>;

/**
 * Entire Field Schema (array of field definitions)
 */
export const fieldSchemaObject = z.array(fieldDefinitionSchema);

export type VerificationFieldSchema = z.infer<typeof fieldSchemaObject>;

/**
 * Create verification type schema
 */
export const createVerificationTypeSchema = z.object({
  code: z
    .string()
    .min(1)
    .max(50)
    .regex(
      /^[A-Z0-9_]+$/,
      'Code must be uppercase alphanumeric with underscores'
    ),
  name: z.string().min(1).max(100),
  fieldSchema: fieldSchemaObject,
  slaOverrideHours: z.number().int().positive().optional(),
});

/**
 * Update verification type schema
 */
export const updateVerificationTypeSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  fieldSchema: fieldSchemaObject.optional(),
  isActive: z.boolean().optional(),
  slaOverrideHours: z.number().int().positive().optional(),
});
