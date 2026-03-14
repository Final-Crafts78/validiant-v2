/**
 * CSV Import Zod Schemas
 *
 * For bulk ingestion of tasks with smart mapping.
 */

import { z } from 'zod';

/**
 * Supported field types for CSV mapping
 */
export const csvMappingTargetSchema = z.enum([
  'candidateName',
  'candidateEmail',
  'checkType',
  'priority',
  'projectId',
  'caseId',
  'customField', // If target is customField, we need the fieldKey
]);

/**
 * Individual column mapping rule
 */
export const csvColumnMappingSchema = z.object({
  columnIndex: z.number().int().min(0).optional(),
  columnName: z.string().min(1),
  targetField: csvMappingTargetSchema,
  fieldKey: z.string().optional(), // Required if targetField is 'customField'
  defaultValue: z.any().optional(),
  transform: z
    .enum(['none', 'lowercase', 'uppercase', 'trim', 'email'])
    .default('none'),
});

/**
 * Complete CSV Import Template
 */
export const csvImportTemplateSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  mappings: z.array(csvColumnMappingSchema),
  hasHeader: z.boolean().default(true),
  delimiter: z.string().default(','),
});

export type CsvImportTemplate = z.infer<typeof csvImportTemplateSchema>;
export type CsvColumnMapping = z.infer<typeof csvColumnMappingSchema>;

/**
 * Error/Warning structure for individual rows
 */
export const csvRowIssueSchema = z.object({
  row: z.number().int(),
  message: z.string(),
  field: z.string().optional(),
  rowData: z.record(z.any()), // The original raw data for context
});

/**
 * Preview version of a task ready for import
 */
export const taskCsvRowSchema = z.object({
  candidateName: z.string(),
  candidateEmail: z.string().email(),
  checkType: z.string(), // VerificationType code
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  caseId: z.string().optional(),
  projectId: z.string().uuid().optional(),
  customFields: z.record(z.any()).default({}),
  rowIndex: z.number().int(),
});

export type TaskCsvRow = z.infer<typeof taskCsvRowSchema>;

/**
 * Result of the validation pass
 */
export const csvValidationResultSchema = z.object({
  totalRows: z.number().int(),
  validRows: z.number().int(),
  errors: z.array(csvRowIssueSchema),
  warnings: z.array(csvRowIssueSchema),
  preview: z.array(taskCsvRowSchema),
});

export type CsvValidationResult = z.infer<typeof csvValidationResultSchema>;

/**
 * Final payload to process the import
 */
export const csvImportExecuteSchema = z.object({
  projectId: z.string().uuid(), // Target project override
  rows: z.array(taskCsvRowSchema),
  saveAsTemplate: z.boolean().default(false),
  templateName: z.string().optional(),
});

export type CsvImportExecuteInput = z.infer<typeof csvImportExecuteSchema>;
