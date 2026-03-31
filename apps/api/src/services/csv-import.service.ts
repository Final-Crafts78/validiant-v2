/**
 * CSV Import Service
 *
 * Handles bulk task ingestion with smart mapping and validation.
 */

import { eq } from 'drizzle-orm';
import { db } from '../db';
import {
  tasks,
  verificationTypes,
  caseFieldValues,
  VerificationType,
} from '../db/schema';
import {
  CsvValidationResult,
  CsvImportTemplate,
  TaskCsvRow,
  CsvImportExecuteInput,
} from '@validiant/shared';
import { BadRequestError } from '../utils/errors';

/**
 * Simple robust CSV parser for Edge compatibility
 */
function parseCSV(text: string, delimiter: string = ','): string[][] {
  const lines = text.split(/\r?\n/);
  return lines
    .filter((line) => line.trim())
    .map((line) => {
      const parts = [];
      let current = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === delimiter && !inQuotes) {
          parts.push(current);
          current = '';
        } else {
          current += char;
        }
      }
      parts.push(current);
      return parts.map((p) => p.trim().replace(/^"|"$/g, ''));
    });
}

/**
 * Validate CSV data against a mapping template
 */
export const validateCsv = async (
  organizationId: string,
  csvText: string,
  template: CsvImportTemplate
): Promise<CsvValidationResult> => {
  const rows = parseCSV(csvText, template.delimiter);
  if (rows.length === 0) {
    throw new BadRequestError('CSV is empty');
  }

  const dataRows = template.hasHeader ? rows.slice(1) : rows;
  const headers = template.hasHeader ? rows[0] : [];

  // Fetch valid verification types for this org
  const vTypes = await db
    .select({ code: verificationTypes.code, id: verificationTypes.id })
    .from(verificationTypes)
    .where(eq(verificationTypes.organizationId, organizationId));

  const validVTypeCodes = new Set(vTypes.map((v: { code: string }) => v.code));

  const result: CsvValidationResult = {
    totalRows: dataRows.length,
    validRows: 0,
    errors: [],
    warnings: [],
    preview: [],
  };

  dataRows.forEach((row, index) => {
    const rowIndex = index + (template.hasHeader ? 2 : 1);
    const rowData: Record<string, string> = {};
    headers.forEach((h, i) => {
      rowData[h || `Column ${i}`] = row[i];
    });

    try {
      const mappedRow: Partial<TaskCsvRow> = { rowIndex };
      const customFields: Record<string, string> = {};

      template.mappings.forEach((mapping) => {
        let value = '';
        if (mapping.columnIndex !== undefined) {
          value = row[mapping.columnIndex];
        } else {
          const colIdx = headers.indexOf(mapping.columnName);
          if (colIdx !== -1) {
            value = row[colIdx];
          }
        }

        if (!value && mapping.defaultValue) {
          value = String(mapping.defaultValue);
        }

        // Apply transforms
        if (value) {
          switch (mapping.transform) {
            case 'lowercase':
              value = value.toLowerCase();
              break;
            case 'uppercase':
              value = value.toUpperCase();
              break;
            case 'trim':
              value = value.trim();
              break;
          }
        }

        if (mapping.targetField === 'customField' && mapping.fieldKey) {
          customFields[mapping.fieldKey] = value;
        } else if (mapping.targetField !== 'customField') {
          (mappedRow as Record<string, unknown>)[mapping.targetField] = value;
        }
      });

      mappedRow.customFields = customFields;

      // Basic Validation
      const errors: string[] = [];
      if (!mappedRow.candidateName) errors.push('Candidate Name is required');
      if (!mappedRow.candidateEmail) errors.push('Candidate Email is required');
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mappedRow.candidateEmail)) {
        errors.push('Invalid Candidate Email format');
      }

      if (!mappedRow.checkType) {
        errors.push('Check Type (Verification Code) is required');
      } else if (!validVTypeCodes.has(mappedRow.checkType)) {
        errors.push(`Invalid Verification Type: ${mappedRow.checkType}`);
      }

      if (errors.length > 0) {
        errors.forEach((err) => {
          result.errors.push({
            row: rowIndex,
            message: err,
            rowData,
          });
        });
      } else {
        result.validRows++;
        result.preview.push(mappedRow as TaskCsvRow);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      result.errors.push({
        row: rowIndex,
        message: `Processing error: ${message}`,
        rowData,
      });
    }
  });

  return result;
};

/**
 * Execute the bulk import in a transaction
 */
export const executeImport = async (
  organizationId: string,
  userId: string,
  input: CsvImportExecuteInput
) => {
  return await db.transaction(async (tx: any) => {
    const createdTasks = [];

    // 1. Resolve Verification Types once
    const vTypes = (await tx
      .select()
      .from(verificationTypes)
      .where(
        eq(verificationTypes.organizationId, organizationId)
      )) as VerificationType[];

    const vTypeMap = new Map(vTypes.map((v: VerificationType) => [v.code, v]));

    // 2. Process each row
    for (const row of input.rows) {
      const vType = vTypeMap.get(row.checkType);
      if (!vType) continue; // Should have been caught by validation

      const [newTask] = await tx
        .insert(tasks)
        .values({
          organizationId,
          projectId: input.projectId,
          title: `${row.candidateName} - ${vType.name}`,
          description: 'Bulk imported via CSV',
          statusKey: 'UNASSIGNED',
          priority: row.priority,
          caseId: row.caseId,
          verificationTypeId: vType.id,
          clientName: row.candidateName,
          createdById: userId,
        })
        .returning();

      // 3. Insert Custom Fields if any
      const fieldEntries = Object.entries(row.customFields);
      if (fieldEntries.length > 0) {
        await tx.insert(caseFieldValues).values(
          fieldEntries.map(([key, val]) => ({
            taskId: newTask.id,
            fieldKey: key,
            valueText: String(val),
            filledById: userId,
          }))
        );
      }

      createdTasks.push(newTask);
    }

    return {
      count: createdTasks.length,
      taskIds: createdTasks.map((t: { id: string }) => t.id),
    };
  });
};

/**
 * Get import templates for an organization
 */
export const getImportTemplates = async (organizationId: string) => {
  // TODO: Implement database storage for templates if needed
  // For now, return a default mock template
  return [
    {
      id: 'default-task-import',
      name: 'Default Task Import',
      organizationId,
      hasHeader: true,
      delimiter: ',',
      mappings: [
        { columnName: 'Candidate Name', targetField: 'candidateName' },
        { columnName: 'Candidate Email', targetField: 'candidateEmail' },
        { columnName: 'Check Type', targetField: 'checkType' },
        {
          columnName: 'Priority',
          targetField: 'priority',
          defaultValue: 'medium',
        },
      ],
    },
  ];
};
