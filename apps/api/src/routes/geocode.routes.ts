/**
 * Geocoding Routes (Phase 18)
 *
 * Exposes the geocoding pipeline as API endpoints for:
 * 1. Geocoding an address (POST /geocode)
 * 2. Auto-geocoding when creating/updating tasks with addresses
 */

import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { authenticate } from '../middleware/auth';
import { geocodeAddress, applyGeoPolicy } from '../services/geocode.service';
import { eq } from 'drizzle-orm';
import { db, schema } from '../db';

const geocodeRoutes = new Hono();

geocodeRoutes.use('*', authenticate);

// ----------------------------------------------------------------
// Schema definitions
// ----------------------------------------------------------------

const geocodeRequestSchema = z.object({
  address: z.string().min(3, 'Address must be at least 3 characters'),
  pincode: z.string().optional(),
});

const geocodeTaskSchema = z.object({
  taskId: z.string().uuid(),
  address: z.string().min(3),
  pincode: z.string().optional(),
});

// ----------------------------------------------------------------
// POST /api/v1/geocode — Geocode a raw address
// ----------------------------------------------------------------

geocodeRoutes.post('/', zValidator('json', geocodeRequestSchema), async (c) => {
  try {
    const { address, pincode } = c.req.valid('json');

    const geoResult = await geocodeAddress(address, pincode);
    const policy = applyGeoPolicy(geoResult);

    return c.json({
      success: true,
      data: {
        ...geoResult,
        policy,
      },
    });
  } catch (error) {
    console.error('[Geocode] Error:', error);
    return c.json({ success: false, error: 'Geocoding failed' }, 500);
  }
});

// ----------------------------------------------------------------
// POST /api/v1/geocode/task — Geocode and update a task in place
// ----------------------------------------------------------------

geocodeRoutes.post(
  '/task',
  zValidator('json', geocodeTaskSchema),
  async (c) => {
    try {
      const { taskId, address, pincode } = c.req.valid('json');

      // 1. Verify task exists
      const [task] = await db
        .select({ id: schema.tasks.id })
        .from(schema.tasks)
        .where(eq(schema.tasks.id, taskId))
        .limit(1);

      if (!task) {
        return c.json({ success: false, error: 'Task not found' }, 404);
      }

      // 2. Run geocode pipeline
      const geoResult = await geocodeAddress(address, pincode);
      const policy = applyGeoPolicy(geoResult);

      // 3. Update task with geocoded coordinates + confidence
      await db
        .update(schema.tasks)
        .set({
          address,
          pincode: pincode ?? null,
          latitude: geoResult.latitude,
          longitude: geoResult.longitude,
          geocodeConfidence: geoResult.confidence,
          geocodeMatchLevel: geoResult.matchLevel,
          locationWarning: policy.warning,
        })
        .where(eq(schema.tasks.id, taskId));

      return c.json({
        success: true,
        data: {
          taskId,
          geocode: geoResult,
          policy,
          updated: true,
        },
      });
    } catch (error) {
      console.error('[Geocode/Task] Error:', error);
      return c.json({ success: false, error: 'Task geocoding failed' }, 500);
    }
  }
);

export default geocodeRoutes;
