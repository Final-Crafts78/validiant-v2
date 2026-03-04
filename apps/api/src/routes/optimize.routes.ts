import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { authenticate } from '../middleware/auth';
import { env } from 'hono/adapter';
import { inArray } from 'drizzle-orm';
import { db, schema } from '../db';

// Inline schema to avoid build-order dependency on @validiant/shared
const optimizeRouteSchema = z.object({
  currentLatitude: z.number(),
  currentLongitude: z.number(),
  taskIds: z.array(z.string().uuid()).min(1),
});

interface OptimizeEnv extends Record<string, unknown> {
  ORS_API_KEY: string;
}

const optimizeRoutes = new Hono();

optimizeRoutes.use('*', authenticate);

/**
 * POST /api/v1/tasks/optimize
 * VRP: Given worker location and task IDs, return optimized visit order.
 */
optimizeRoutes.post('/', zValidator('json', optimizeRouteSchema), async (c) => {
  try {
    const { currentLatitude, currentLongitude, taskIds } = c.req.valid('json');
    const envVars = env<OptimizeEnv>(c);

    // Fetch tasks with coordinates
    const taskResults = await db
      .select({
        id: schema.tasks.id,
        title: schema.tasks.title,
        latitude: schema.tasks.latitude,
        longitude: schema.tasks.longitude,
        clientName: schema.tasks.clientName,
        address: schema.tasks.address,
      })
      .from(schema.tasks)
      .where(inArray(schema.tasks.id, taskIds));

    // Filter tasks that have coordinates
    const geoTasks = taskResults.filter(
      (t: { latitude: number | null; longitude: number | null }) =>
        t.latitude != null && t.longitude != null
    );

    if (geoTasks.length === 0) {
      return c.json(
        { success: false, error: 'No tasks with GPS coordinates found' },
        400
      );
    }

    if (!envVars.ORS_API_KEY) {
      // Fallback: return tasks sorted by haversine distance (no ORS)
      const sorted = geoTasks.sort(
        (
          a: { latitude: number | null; longitude: number | null },
          b: { latitude: number | null; longitude: number | null }
        ) => {
          const distA = Math.hypot(
            (a.latitude ?? 0) - currentLatitude,
            (a.longitude ?? 0) - currentLongitude
          );
          const distB = Math.hypot(
            (b.latitude ?? 0) - currentLatitude,
            (b.longitude ?? 0) - currentLongitude
          );
          return distA - distB;
        }
      );
      return c.json({
        success: true,
        data: { optimizedOrder: sorted, source: 'haversine-fallback' },
      });
    }

    // Call OpenRouteService Optimization API
    const orsResponse = await fetch(
      'https://api.openrouteservice.org/optimization',
      {
        method: 'POST',
        headers: {
          Authorization: envVars.ORS_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jobs: geoTasks.map(
            (
              t: {
                id: string;
                title: string;
                latitude: number | null;
                longitude: number | null;
              },
              i: number
            ) => ({
              id: i + 1,
              location: [t.longitude, t.latitude],
              description: t.title,
            })
          ),
          vehicles: [
            {
              id: 1,
              start: [currentLongitude, currentLatitude],
              profile: 'driving-car',
            },
          ],
        }),
      }
    );

    if (!orsResponse.ok) {
      const err = await orsResponse.text();
      console.error('ORS error:', err);
      return c.json(
        { success: false, error: 'Route optimization failed' },
        502
      );
    }

    const orsResult = (await orsResponse.json()) as {
      routes: Array<{ steps: Array<{ id: number; type: string }> }>;
    };

    // Map ORS solution back to task objects
    const steps =
      orsResult.routes?.[0]?.steps?.filter((s) => s.type === 'job') || [];
    const optimizedOrder = steps
      .map((step) => geoTasks[step.id - 1])
      .filter(Boolean);

    return c.json({
      success: true,
      data: { optimizedOrder, source: 'openrouteservice' },
    });
  } catch (error) {
    console.error('Optimize error:', error);
    return c.json({ success: false, error: 'Route optimization failed' }, 500);
  }
});

export default optimizeRoutes;
