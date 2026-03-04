/**
 * Comment Controller (Phase 14)
 *
 * CRUD operations for task comments.
 */

import { Context } from 'hono';
import { eq, desc } from 'drizzle-orm';
import { db, schema } from '../db';
import type { UserContext } from '../middleware/auth';

/**
 * GET comments for a specific task
 */
export const getTaskComments = async (c: Context) => {
  try {
    const taskId = c.req.param('taskId');

    const comments = await db
      .select()
      .from(schema.taskComments)
      .where(eq(schema.taskComments.taskId, taskId))
      .orderBy(desc(schema.taskComments.createdAt));

    return c.json({ success: true, data: comments });
  } catch (error) {
    console.error('Get comments error:', error);
    return c.json({ success: false, error: 'Failed to fetch comments' }, 500);
  }
};

/**
 * POST a new comment on a task
 */
export const createTaskComment = async (c: Context) => {
  try {
    const taskId = c.req.param('taskId');
    const user = c.get('user') as UserContext;
    const { content, attachmentUrl } = await c.req.json();

    const [comment] = await db
      .insert(schema.taskComments)
      .values({
        taskId,
        userId: user.userId,
        content,
        attachmentUrl,
      })
      .returning();

    return c.json({ success: true, data: comment }, 201);
  } catch (error) {
    console.error('Create comment error:', error);
    return c.json({ success: false, error: 'Failed to create comment' }, 500);
  }
};
