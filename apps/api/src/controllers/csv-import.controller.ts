import { Context } from 'hono';
import * as csvImportService from '../services/csv-import.service';
import { db } from '../db';
import { organizations } from '../db/schema';
import { eq } from 'drizzle-orm';
import { logger } from '../utils/logger';
import { UserContext } from '../middleware/auth';
import {
  csvImportTemplateSchema,
  csvImportExecuteSchema,
  CsvImportTemplate,
} from '@validiant/shared';

/**
 * Validate a CSV file against a mapping
 */
export const validateCsv = async (c: Context) => {
  const user = c.get('user') as UserContext;
  const { csvText, template } = (await c.req.json()) as {
    csvText: string;
    template: CsvImportTemplate;
  };

  // Validate template schema
  const parsedTemplate = csvImportTemplateSchema.parse(template);

  const result = await csvImportService.validateCsv(
    user.organizationId as string,
    csvText,
    parsedTemplate
  );

  return c.json({
    success: true,
    data: result,
  });
};

/**
 * Execute the import
 */
export const executeImport = async (c: Context) => {
  const user = c.get('user') as UserContext;
  const body = await c.req.json();

  const input = csvImportExecuteSchema.parse(body);

  const result = await csvImportService.executeImport(
    user.organizationId as string,
    user.userId as string,
    input
  );

  // If saveAsTemplate is true, update the organization settings
  if (input.saveAsTemplate && input.templateName) {
    const [org] = await db
      .select()
      .from(organizations)
      .where(eq(organizations.id, user.organizationId as string))
      .limit(1);

    if (org) {
      const settings = (org.settings as Record<string, unknown>) || {};
      const templates = (settings.csvImportTemplates as unknown[]) || [];

      // Logic to append or update template
      // This would ideally store the full mapping configuration
      logger.info('Template saving requested', {
        name: input.templateName,
        templatesCount: templates.length,
      });
    }
  }

  return c.json({
    success: true,
    message: `Successfully imported ${result.count} cases`,
    data: result,
  });
};

/**
 * Get saved templates
 */
export const getTemplates = async (c: Context) => {
  const user = c.get('user') as UserContext;
  const templates = await csvImportService.getImportTemplates(
    user.organizationId as string
  );

  return c.json({
    success: true,
    data: templates,
  });
};
