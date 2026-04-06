/**
 * Type Templates Controller
 *
 * Handles HTTP requests for reusable schema templates.
 */

import { Context } from 'hono';
import * as templateService from '../services/templates.service';
import { typeTemplateCreateSchema } from '@validiant/shared';

/**
 * List available templates
 */
export const listTemplates = async (c: Context) => {
  try {
    const orgId = c.req.header('X-Org-Id');
    const industry = c.req.query('industry');
    
    const templates = await templateService.getAvailableTemplates(orgId, industry);

    return c.json({
      success: true,
      data: templates,
    });
  } catch (error) {
    return c.json(
      {
        success: false,
        error: 'Failed to list templates',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
};

/**
 * Create a new template
 */
export const createTemplate = async (c: Context) => {
  try {
    const orgId = c.req.header('X-Org-Id');
    const user = c.get('user');
    const body = await c.req.json();
    
    const validated = typeTemplateCreateSchema.parse(body);

    const template = await templateService.createTemplate(user.id, {
      ...validated,
      orgId,
    });

    return c.json(
      {
        success: true,
        message: 'Template created successfully',
        data: template,
      },
      201
    );
  } catch (error) {
    return c.json(
      {
        success: false,
        error: 'Failed to create template',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      error instanceof Error && error.name === 'ZodError' ? 400 : 500
    );
  }
};

/**
 * Get template details
 */
export const getTemplate = async (c: Context) => {
  try {
    const id = c.req.param('id');
    const template = await templateService.getTemplateById(id);

    return c.json({
      success: true,
      data: template,
    });
  } catch (error) {
    return c.json(
      {
        success: false,
        error: 'Failed to get template',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
};

/**
 * Delete a template
 */
export const deleteTemplate = async (c: Context) => {
  try {
    const id = c.req.param('id');
    await templateService.deleteTemplate(id);

    return c.json({
      success: true,
      message: 'Template deleted successfully',
    });
  } catch (error) {
    return c.json(
      {
        success: false,
        error: 'Failed to delete template',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
};
