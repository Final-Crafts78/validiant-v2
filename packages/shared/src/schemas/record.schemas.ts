import { z } from 'zod';

/**
 * Record Engine Schemas - Advanced Field Types (Phase 2)
 */

export const columnTypeEnum = z.enum([
  'text',
  'long_text',
  'number',
  'currency',
  'date',
  'date_range',
  'select',
  'multi_select',
  'checkbox',
  'file_upload',
  'photo_capture',
  'gps_location',
  'signature',
  'barcode_scan',
  'phone',
  'email',
  'url',
  'person',
  'relation',
  'formula',
  'rating',
  'status',
  'timer',
]);

// ── Column Options & Settings ────────────────────────────────────────────────

export const columnChoiceSchema = z.object({
  value: z.string().min(1),
  label: z.string().min(1),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .optional(),
});

export const typeColumnCreateSchema = z.object({
  name: z.string().min(1).max(100),
  key: z
    .string()
    .min(1)
    .max(60)
    .regex(
      /^[a-z][a-z0-9_]*$/,
      'Key must be lowercase snake_case starting with a letter'
    ),
  columnType: columnTypeEnum,
  options: z
    .object({
      choices: z.array(columnChoiceSchema).optional(),
      maxValue: z.number().int().min(1).max(10).optional(),
      allowManualOverride: z.boolean().optional(),
    })
    .optional(),
  settings: z
    .object({
      required: z.boolean().optional(),
      visibleTo: z
        .array(z.enum(['admin', 'member', 'field_agent', 'client_portal']))
        .optional(),
      editableBy: z.array(z.enum(['admin', 'member'])).optional(),
      showInList: z.boolean().optional(),
      showInCard: z.boolean().optional(),
      showInMobile: z.boolean().optional(),
      defaultValue: z.unknown().optional(),
      hint: z.string().max(200).optional(),
      placeholder: z.string().max(100).optional(),
      disabled: z.boolean().optional(),
      conditions: z
        .array(
          z.object({
            fieldKey: z.string().min(1),
            operator: z.enum([
              'equals',
              'not_equals',
              'contains',
              'not_contains',
              'is_set',
              'is_not_set',
              'is_checked',
            ]),
            value: z.unknown(),
          })
        )
        .optional(),
      validationRules: z.array(z.any()).optional(),
      formulaExpression: z.string().optional(),
    })
    .optional(),
  order: z.number().int().optional(),
});

export const typeColumnUpdateSchema = typeColumnCreateSchema
  .partial()
  .omit({ key: true }); // Key is immutable after creation

export type CreateTypeColumnData = z.infer<typeof typeColumnCreateSchema>;
export type UpdateTypeColumnData = z.infer<typeof typeColumnUpdateSchema>;

// ── Project Type ────────────────────────────────────────────────────────────

export const projectTypeCreateSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  icon: z.string().max(50).optional(),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .optional(),
  order: z.number().int().min(0).optional(),
  settings: z
    .object({
      requiredFields: z.array(z.string()).optional(),
      slaHours: z.number().positive().optional(),
      gpsRequired: z.boolean().optional(),
      allowedCreators: z
        .array(z.enum(['admin', 'member', 'field_agent']))
        .optional(),
      customVerificationLabels: z.record(z.string(), z.string()).optional(),
      statusLifecycle: z
        .array(
          z.object({
            key: z.string(),
            label: z.string(),
            color: z.string(),
            icon: z.string().optional(),
            isFinal: z.boolean().optional(),
          })
        )
        .optional(),
    })
    .optional(),
});

export const projectTypeUpdateSchema = projectTypeCreateSchema.partial();

export type CreateProjectTypeData = z.infer<typeof projectTypeCreateSchema>;
export type UpdateProjectTypeData = z.infer<typeof projectTypeUpdateSchema>;

// ── Advanced Field Content Schemas ───────────────────────────────────────────

/** Schema for PHOTO_CAPTURE data */
export const photoCaptureSchema = z.object({
  url: z.string().url(),
  thumbnail: z.string().url().optional(),
  timestamp: z.string().datetime(), // ISO 8601
  capturedBy: z.string().uuid(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  hash: z.string().optional(), // For tamper detection
});

/** Schema for GPS_LOCATION data */
export const gpsLocationSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  accuracy: z.number().min(0),
  timestamp: z.string().datetime(),
  provider: z.string().optional(), // 'gps', 'network', 'manual'
  isManual: z.boolean().optional(),
});

/** Schema for SIGNATURE data */
export const signatureSchema = z.object({
  url: z.string().url(), // Flattened image URL (R2)
  timestamp: z.string().datetime(),
  drawnBy: z.string().optional(), // Name or User ID
  ip: z.string().optional(),
});

/** Schema for RATING data */
export const ratingSchema = z.number().min(1).max(10);

// ── Record CRUD Schemas ──────────────────────────────────────────────────────

export const recordCreateSchema = z.object({
  typeId: z.string().uuid(),
  data: z.record(z.string(), z.unknown()), // Keys are ColumnKeys, Values are typed
  status: z.string().max(50).optional(),
  assignedTo: z.string().uuid().optional(),
  clientId: z.string().max(200).optional(),
  gpsLat: z.number().min(-90).max(90).optional(),
  gpsLng: z.number().min(-180).max(180).optional(),
  gpsAccuracy: z.number().min(0).optional(),
});

export const recordUpdateSchema = z.object({
  data: z.record(z.string(), z.unknown()).optional(),
  status: z.string().max(50).optional(),
  assignedTo: z.string().uuid().nullable().optional(),
  gpsLat: z.number().min(-90).max(90).optional(),
  gpsLng: z.number().min(-180).max(180).optional(),
  gpsAccuracy: z.number().min(0).optional(),
});

export type CreateRecordData = z.infer<typeof recordCreateSchema>;
export type UpdateRecordData = z.infer<typeof recordUpdateSchema>;

// ── Sub-Account ─────────────────────────────────────────────────────────────

export const subAccountCreateSchema = z.object({
  accountType: z.enum(['field_agent', 'client_viewer', 'partner']),
  name: z.string().min(1).max(200),
  email: z.string().email().optional(),
  phone: z.string().max(20).optional(),
  projectAccess: z
    .array(
      z.object({
        projectId: z.string().uuid(),
        role: z.string().max(50),
      })
    )
    .optional(),
});

export type CreateSubAccountData = z.infer<typeof subAccountCreateSchema>;

// ── Portal Token ────────────────────────────────────────────────────────────

export const portalTokenSchema = z.object({
  token: z.string().min(32).max(128),
});

// ── Legacy Type Mappings (for compatibility) ─────────────────────────────────
export type CreateRecordDataInput = CreateRecordData;
export type UpdateRecordDataInput = UpdateRecordData;

export type ProjectTypeColumn = z.infer<typeof typeColumnCreateSchema> & {
  id: string;
  projectId: string;
  typeId: string;
};
// ── Type Template Schemas ────────────────────────────────────────────────────

export const typeTemplateCreateSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(500).optional(),
  industry: z.string().max(100).optional(),
  typeDefinition: z.object({
    typeName: z.string().min(1),
    typeIcon: z.string().max(50).optional(),
    typeColor: z
      .string()
      .regex(/^#[0-9a-fA-F]{6}$/)
      .optional(),
    columns: z.array(typeColumnCreateSchema),
  }),
  isPublic: z.boolean().optional(),
});

export type CreateTypeTemplateData = z.infer<typeof typeTemplateCreateSchema>;
export type CreateTypeTemplateInput = CreateTypeTemplateData;

// ── Ingest API Payload Schema ────────────────────────────────────────────────

/**
 * The shape of a JSON body that an external system POSTs to
 * POST https://api.validiant.in/api/v1/ingest/:projectKey
 *
 * The `data` object maps column keys to values. Required columns are
 * enforced server-side by validating against the target Type's column schema.
 */
export const ingestPayloadSchema = z
  .object({
    /** Type name OR Type ID — at least one must be provided */
    type: z.string().optional(), // e.g. "Identity Verification"
    typeId: z.string().uuid().optional(), // e.g. "550e8400-e29b-..."

    /** The actual field data — keys MUST match column keys defined in the Type */
    data: z.record(z.string(), z.unknown()), // e.g. { "applicant_name": "Raj", "aadhaar": "1234..." }

    /** Optional: pre-assign to a specific user */
    assignTo: z.string().uuid().optional(), // User ID of the assigned field agent

    /** Optional: client reference for portal filtering */
    clientId: z.string().max(200).optional(), // e.g. "acme-corp" or "client-uuid"

    /** Optional: external system reference ID for deduplication */
    externalId: z.string().max(200).optional(),

    /** Optional: initial status (defaults to 'pending' if omitted) */
    status: z.string().max(50).optional(),

    /** Optional: metadata not stored in columns (for webhook passthrough) */
    metadata: z.record(z.string(), z.unknown()).optional(),
  })
  .refine((d) => d.type || d.typeId, {
    message: 'Either `type` (name) or `typeId` (UUID) must be provided',
  });

export type IngestPayloadData = z.infer<typeof ingestPayloadSchema>;
