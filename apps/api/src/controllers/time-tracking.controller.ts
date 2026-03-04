/**
 * Time Tracking Controller (Phase 19)
 *
 * Start/stop timers on tasks, list time entries, and aggregate durations.
 * Used by both web dashboard and mobile app for field-worker time tracking.
 */

import { Context } from 'hono';
import { eq, and, desc, sql } from 'drizzle-orm';
import { db, schema } from '../db';
import type { UserContext } from '../middleware/auth';

/**
 * POST /time-tracking/start
 * Start a timer on a specific task. Stops any other running timers for this user first.
 */
export const startTimer = async (c: Context) => {
  try {
    const user = c.get('user') as UserContext;
    const { taskId, description } = await c.req.json();

    if (!taskId) {
      return c.json({ success: false, error: 'taskId is required' }, 400);
    }

    // Auto-stop any currently running timer for this user
    const runningEntries = await db
      .select()
      .from(schema.timeEntries)
      .where(
        and(
          eq(schema.timeEntries.userId, user.userId),
          eq(schema.timeEntries.isRunning, true)
        )
      );

    for (const entry of runningEntries) {
      const endTime = new Date();
      const durationMs = endTime.getTime() - entry.startTime.getTime();
      const durationSeconds = Math.floor(durationMs / 1000);

      await db
        .update(schema.timeEntries)
        .set({
          endTime,
          duration: durationSeconds,
          isRunning: false,
          updatedAt: endTime,
        })
        .where(eq(schema.timeEntries.id, entry.id));
    }

    // Start new timer
    const [newEntry] = await db
      .insert(schema.timeEntries)
      .values({
        taskId,
        userId: user.userId,
        description: description || null,
        startTime: new Date(),
        isRunning: true,
      })
      .returning();

    return c.json({ success: true, data: newEntry }, 201);
  } catch (error) {
    console.error('Start timer error:', error);
    return c.json({ success: false, error: 'Failed to start timer' }, 500);
  }
};

/**
 * POST /time-tracking/stop
 * Stop the user's currently running timer.
 */
export const stopTimer = async (c: Context) => {
  try {
    const user = c.get('user') as UserContext;

    // Find the running timer for this user
    const [runningEntry] = await db
      .select()
      .from(schema.timeEntries)
      .where(
        and(
          eq(schema.timeEntries.userId, user.userId),
          eq(schema.timeEntries.isRunning, true)
        )
      )
      .limit(1);

    if (!runningEntry) {
      return c.json({ success: false, error: 'No running timer found' }, 404);
    }

    const endTime = new Date();
    const durationMs = endTime.getTime() - runningEntry.startTime.getTime();
    const durationSeconds = Math.floor(durationMs / 1000);

    const [updated] = await db
      .update(schema.timeEntries)
      .set({
        endTime,
        duration: durationSeconds,
        isRunning: false,
        updatedAt: endTime,
      })
      .where(eq(schema.timeEntries.id, runningEntry.id))
      .returning();

    return c.json({ success: true, data: updated });
  } catch (error) {
    console.error('Stop timer error:', error);
    return c.json({ success: false, error: 'Failed to stop timer' }, 500);
  }
};

/**
 * GET /time-tracking/current
 * Get the user's currently running timer (if any).
 */
export const getCurrentTimer = async (c: Context) => {
  try {
    const user = c.get('user') as UserContext;

    const [runningEntry] = await db
      .select()
      .from(schema.timeEntries)
      .where(
        and(
          eq(schema.timeEntries.userId, user.userId),
          eq(schema.timeEntries.isRunning, true)
        )
      )
      .limit(1);

    return c.json({
      success: true,
      data: runningEntry || null,
    });
  } catch (error) {
    console.error('Get current timer error:', error);
    return c.json(
      { success: false, error: 'Failed to get current timer' },
      500
    );
  }
};

/**
 * GET /time-tracking/task/:taskId
 * List all time entries for a specific task.
 */
export const getTaskTimeEntries = async (c: Context) => {
  try {
    const taskId = c.req.param('taskId');

    const entries = await db
      .select()
      .from(schema.timeEntries)
      .where(eq(schema.timeEntries.taskId, taskId))
      .orderBy(desc(schema.timeEntries.startTime));

    // Calculate total tracked time for this task (in seconds)
    const totalSeconds = entries.reduce(
      (sum: number, entry: { duration: number | null }) => {
        return sum + (entry.duration || 0);
      },
      0
    );

    return c.json({
      success: true,
      data: {
        entries,
        totalSeconds,
        totalHours: Math.round((totalSeconds / 3600) * 100) / 100,
      },
    });
  } catch (error) {
    console.error('Get task time entries error:', error);
    return c.json(
      { success: false, error: 'Failed to fetch time entries' },
      500
    );
  }
};

/**
 * GET /time-tracking/user
 * List time entries for the authenticated user, optionally filtered by date range.
 */
export const getUserTimeEntries = async (c: Context) => {
  try {
    const user = c.get('user') as UserContext;
    const page = parseInt(c.req.query('page') || '1');
    const limit = parseInt(c.req.query('limit') || '20');
    const offset = (page - 1) * limit;

    const entries = await db
      .select()
      .from(schema.timeEntries)
      .where(eq(schema.timeEntries.userId, user.userId))
      .orderBy(desc(schema.timeEntries.startTime))
      .limit(limit)
      .offset(offset);

    // Aggregate total for user
    const [aggregate] = await db
      .select({
        totalSeconds:
          sql<number>`COALESCE(SUM(${schema.timeEntries.duration}), 0)`.mapWith(
            Number
          ),
        totalEntries: sql<number>`COUNT(${schema.timeEntries.id})`.mapWith(
          Number
        ),
      })
      .from(schema.timeEntries)
      .where(eq(schema.timeEntries.userId, user.userId));

    return c.json({
      success: true,
      data: {
        entries,
        totalSeconds: aggregate?.totalSeconds || 0,
        totalHours:
          Math.round(((aggregate?.totalSeconds || 0) / 3600) * 100) / 100,
        pagination: {
          page,
          limit,
          total: aggregate?.totalEntries || 0,
        },
      },
    });
  } catch (error) {
    console.error('Get user time entries error:', error);
    return c.json(
      { success: false, error: 'Failed to fetch time entries' },
      500
    );
  }
};

/**
 * DELETE /time-tracking/:entryId
 * Delete a time entry (only the owner can delete).
 */
export const deleteTimeEntry = async (c: Context) => {
  try {
    const user = c.get('user') as UserContext;
    const entryId = c.req.param('entryId');

    const [entry] = await db
      .select()
      .from(schema.timeEntries)
      .where(eq(schema.timeEntries.id, entryId))
      .limit(1);

    if (!entry) {
      return c.json({ success: false, error: 'Time entry not found' }, 404);
    }

    if (entry.userId !== user.userId) {
      return c.json(
        { success: false, error: 'Not authorized to delete this entry' },
        403
      );
    }

    await db
      .delete(schema.timeEntries)
      .where(eq(schema.timeEntries.id, entryId));

    return c.json({ success: true, message: 'Time entry deleted' });
  } catch (error) {
    console.error('Delete time entry error:', error);
    return c.json(
      { success: false, error: 'Failed to delete time entry' },
      500
    );
  }
};
