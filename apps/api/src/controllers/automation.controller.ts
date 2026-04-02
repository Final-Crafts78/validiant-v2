/**
 * Automation Controller (Phase 21)
 *
 * CRUD operations for automation rules (Zapier-like workflows).
 * Admins can create rules: Trigger → Condition → Action.
 */

import { Context } from 'hono';
import { eq, desc, sql } from 'drizzle-orm';
import { db, schema } from '../db';
import type { UserContext } from '../middleware/auth';

/**
 * GET /automations
 * List automations for the user's organization.
 */
export const listAutomations = async (c: Context) => {
  try {
    const user = c.get('user') as UserContext;
    const orgId =
      c.req.query('organizationId') ||
      c.req.query('orgId') ||
      user.organizationId;

    if (!orgId) {
      return c.json(
        { success: false, error: 'organizationId is required' },
        400
      );
    }

    const automations = await db
      .select()
      .from(schema.automations)
      .where(eq(schema.automations.organizationId, orgId))
      .orderBy(desc(schema.automations.createdAt));

    return c.json({ success: true, data: automations });
  } catch (error) {
    console.error('List automations error:', error);
    return c.json({ success: false, error: 'Failed to list automations' }, 500);
  }
};

/**
 * GET /automations/:id
 * Get a single automation by ID.
 */
export const getAutomation = async (c: Context) => {
  try {
    const id = c.req.param('id');

    const [automation] = await db
      .select()
      .from(schema.automations)
      .where(eq(schema.automations.id, id))
      .limit(1);

    if (!automation) {
      return c.json({ success: false, error: 'Automation not found' }, 404);
    }

    return c.json({ success: true, data: automation });
  } catch (error) {
    console.error('Get automation error:', error);
    return c.json({ success: false, error: 'Failed to get automation' }, 500);
  }
};

/**
 * POST /automations
 * Create a new automation rule.
 */
export const createAutomation = async (c: Context) => {
  try {
    const user = c.get('user') as UserContext;
    const body = await c.req.json();

    const {
      organizationId,
      name,
      description,
      triggerEvent,
      conditions,
      actionType,
      actionPayload,
    } = body;

    if (!organizationId || !name || !triggerEvent || !actionType) {
      return c.json(
        {
          success: false,
          error:
            'organizationId, name, triggerEvent, and actionType are required',
        },
        400
      );
    }

    const [automation] = await db
      .insert(schema.automations)
      .values({
        organizationId,
        createdById: user.userId,
        name,
        description: description || null,
        triggerEvent,
        conditions: conditions || [],
        actionType,
        actionPayload: actionPayload || {},
        isActive: true,
      })
      .returning();

    return c.json({ success: true, data: automation }, 201);
  } catch (error) {
    console.error('Create automation error:', error);
    return c.json(
      { success: false, error: 'Failed to create automation' },
      500
    );
  }
};

/**
 * PUT /automations/:id
 * Update an existing automation rule.
 */
export const updateAutomation = async (c: Context) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();

    const updateData: Record<string, unknown> = { updatedAt: new Date() };

    if (body.name !== undefined) updateData.name = body.name;
    if (body.description !== undefined)
      updateData.description = body.description;
    if (body.triggerEvent !== undefined)
      updateData.triggerEvent = body.triggerEvent;
    if (body.conditions !== undefined) updateData.conditions = body.conditions;
    if (body.actionType !== undefined) updateData.actionType = body.actionType;
    if (body.actionPayload !== undefined)
      updateData.actionPayload = body.actionPayload;
    if (body.isActive !== undefined) updateData.isActive = body.isActive;

    const [updated] = await db
      .update(schema.automations)
      .set(updateData)
      .where(eq(schema.automations.id, id))
      .returning();

    if (!updated) {
      return c.json({ success: false, error: 'Automation not found' }, 404);
    }

    return c.json({ success: true, data: updated });
  } catch (error) {
    console.error('Update automation error:', error);
    return c.json(
      { success: false, error: 'Failed to update automation' },
      500
    );
  }
};

/**
 * DELETE /automations/:id
 * Delete an automation rule.
 */
export const deleteAutomation = async (c: Context) => {
  try {
    const id = c.req.param('id');

    const [deleted] = await db
      .delete(schema.automations)
      .where(eq(schema.automations.id, id))
      .returning();

    if (!deleted) {
      return c.json({ success: false, error: 'Automation not found' }, 404);
    }

    return c.json({ success: true, message: 'Automation deleted' });
  } catch (error) {
    console.error('Delete automation error:', error);
    return c.json(
      { success: false, error: 'Failed to delete automation' },
      500
    );
  }
};

/**
 * GET /automations/stats
 * Get aggregate automation stats for an organization.
 */
export const getAutomationStats = async (c: Context) => {
  try {
    const user = c.get('user') as UserContext;
    const orgId =
      c.req.query('organizationId') ||
      c.req.query('orgId') ||
      user.organizationId;

    if (!orgId) {
      return c.json(
        { success: false, error: 'organizationId is required' },
        400
      );
    }

    const [stats] = await db
      .select({
        totalAutomations: sql<number>`COUNT(${schema.automations.id})`.mapWith(
          Number
        ),
        activeCount:
          sql<number>`COUNT(CASE WHEN ${schema.automations.isActive} THEN 1 END)`.mapWith(
            Number
          ),
        totalTriggers:
          sql<number>`COALESCE(SUM(${schema.automations.triggerCount}), 0)`.mapWith(
            Number
          ),
      })
      .from(schema.automations)
      .where(eq(schema.automations.organizationId, orgId));

    return c.json({
      success: true,
      data: {
        totalAutomations: stats?.totalAutomations || 0,
        activeCount: stats?.activeCount || 0,
        totalTriggers: stats?.totalTriggers || 0,
      },
    });
  } catch (error) {
    console.error('Automation stats error:', error);
    return c.json(
      { success: false, error: 'Failed to get automation stats' },
      500
    );
  }
};
