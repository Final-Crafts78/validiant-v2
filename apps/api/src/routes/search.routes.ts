/**
 * Search Routes (Phase 19)
 *
 * Full-text search using PostgreSQL LIKE and ILIKE operators.
 * Searches across tasks: title, description, clientName, address.
 *
 * Note: For production at scale, consider adding a tsvector column
 * and using to_tsquery() for ranked results. This implementation
 * uses ILIKE which works well for < 100K records on Neon.
 */

import { Hono } from 'hono';
import { sql, eq, and } from 'drizzle-orm';
import { authenticate } from '../middleware/auth';
import { db, schema } from '../db';

const searchRoutes = new Hono();

searchRoutes.use('*', authenticate);

/**
 * GET /api/v1/search
 *
 * Query params:
 *   - q: search query (required, min 2 chars)
 *   - projectId: optional project scope
 *   - limit: max results (default 20, max 50)
 */
searchRoutes.get('/', async (c) => {
  try {
    // Auth is enforced by middleware — no need to access user context for search
    const query = c.req.query('q');
    const projectId = c.req.query('projectId');
    const limit = Math.min(parseInt(c.req.query('limit') || '20'), 50);

    if (!query || query.length < 2) {
      return c.json(
        { success: false, error: 'Search query must be at least 2 characters' },
        400
      );
    }

    // Build search pattern for ILIKE
    const searchPattern = `%${query.replace(/[%_]/g, '\\$&')}%`;

    // Search tasks across multiple fields
    const conditions = [
      sql`(
        ${schema.tasks.title} ILIKE ${searchPattern}
        OR ${schema.tasks.description} ILIKE ${searchPattern}
        OR ${schema.tasks.clientName} ILIKE ${searchPattern}
        OR ${schema.tasks.address} ILIKE ${searchPattern}
      )`,
      sql`${schema.tasks.deletedAt} IS NULL`,
    ];

    if (projectId) {
      conditions.push(eq(schema.tasks.projectId, projectId));
    }

    const tasks = await db
      .select({
        id: schema.tasks.id,
        title: schema.tasks.title,
        description: schema.tasks.description,
        statusKey: schema.tasks.statusKey,
        priority: schema.tasks.priority,
        clientName: schema.tasks.clientName,
        pincode: schema.tasks.pincode,
        projectId: schema.tasks.projectId,
        createdAt: schema.tasks.createdAt,
      })
      .from(schema.tasks)
      .where(and(...conditions))
      .orderBy(schema.tasks.updatedAt)
      .limit(limit);

    // Also search users if no projectId filter
    let users: Array<{
      id: string;
      email: string;
      fullName: string;
      avatarUrl: string | null;
    }> = [];
    if (!projectId) {
      users = await db
        .select({
          id: schema.users.id,
          email: schema.users.email,
          fullName: schema.users.fullName,
          avatarUrl: schema.users.avatarUrl,
        })
        .from(schema.users)
        .where(
          and(
            sql`(
              ${schema.users.fullName} ILIKE ${searchPattern}
              OR ${schema.users.email} ILIKE ${searchPattern}
            )`,
            sql`${schema.users.deletedAt} IS NULL`
          )
        )
        .limit(10);
    }

    return c.json({
      success: true,
      data: {
        tasks,
        users,
        totalResults: tasks.length + users.length,
      },
    });
  } catch (error) {
    console.error('Search error:', error);
    return c.json({ success: false, error: 'Search failed' }, 500);
  }
});

export default searchRoutes;
