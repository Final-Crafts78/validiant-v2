/**
 * Type Templates Service
 *
 * Handles CRUD operations for reusable schema templates.
 * Supports public templates and organization-specific templates.
 */

import { eq, and, or } from 'drizzle-orm';
import { db } from '../db';
import { typeTemplates } from '../db/schema';
import { logger } from '../utils/logger';
import { assertExists } from '../utils/errors';
import { CreateTypeTemplateInput } from '@validiant/shared';

/**
 * Get templates available for an organization
 * Includes public templates and org-specific ones.
 */
export const getAvailableTemplates = async (orgId?: string, industry?: string) => {
  const orgFilter = orgId ? [eq(typeTemplates.orgId, orgId)] : [];
  const publicFilter = eq(typeTemplates.isPublic, true);
  
  const filters = or(publicFilter, ...orgFilter);
  
  const query = db
    .select()
    .from(typeTemplates)
    .where(filters);
    
  if (industry) {
    return await query.where(eq(typeTemplates.industry, industry));
  }

  return await query.orderBy(typeTemplates.name);
};

/**
 * Create a new template
 */
export const createTemplate = async (
  userId: string,
  data: CreateTypeTemplateInput & { orgId?: string }
) => {
  const [template] = await db
    .insert(typeTemplates)
    .values({
      orgId: data.orgId,
      name: data.name,
      description: data.description,
      industry: data.industry,
      typeDefinition: data.typeDefinition,
      isPublic: data.isPublic,
      createdBy: userId,
    })
    .returning();

  logger.info('Type template created', {
    templateId: template.id,
    name: template.name,
    isPublic: template.isPublic,
  });

  return template;
};

/**
 * Get template by ID
 */
export const getTemplateById = async (id: string) => {
  const [template] = await db
    .select()
    .from(typeTemplates)
    .where(eq(typeTemplates.id, id))
    .limit(1);
    
  assertExists(template, 'Type Template');
  return template;
};

/**
 * Delete a template
 */
export const deleteTemplate = async (id: string) => {
  const [deleted] = await db
    .delete(typeTemplates)
    .where(eq(typeTemplates.id, id))
    .returning();
    
  assertExists(deleted, 'Type Template');
  logger.info('Type template deleted', { templateId: id });
  return deleted;
};
