/**
 * SLA Monitor Worker
 *
 * Background cron job that runs every 5 minutes to identify tasks
 * approaching their SLA deadline or already breached.
 */

import { eq, and, isNull, lt } from 'drizzle-orm';
import { db } from '../db';
import { tasks } from '../db/schema';
import * as notificationService from '../services/notification.service';
import { logger } from '../utils/logger';

export const checkSLAs = async () => {
  logger.info('[SLA Monitor] Starting SLA check...');

  try {
    const now = new Date();

    // 1. Find at-risk tasks
    // For now, using a fixed 2-hour threshold
    const atRiskThreshold = new Date(now.getTime() + 2 * 60 * 60 * 1000);

    const atRiskTasks = await db
      .select({
        taskId: tasks.id,
        title: tasks.title,
        orgId: tasks.organizationId,
        assigneeId: tasks.assigneeId,
        dueDate: tasks.dueDate,
      })
      .from(tasks)
      .where(
        and(
          isNull(tasks.completedAt),
          isNull(tasks.deletedAt),
          eq(tasks.slaAtRiskNotified, false),
          lt(tasks.dueDate, atRiskThreshold)
        )
      );

    for (const task of atRiskTasks) {
      if (task.assigneeId) {
        await notificationService.createNotification({
          userId: task.assigneeId,
          organizationId: task.orgId,
          type: 'SLA_AT_RISK',
          title: 'Task SLA at Risk',
          body: `The task "${task.title}" is approaching its deadline.`,
          priority: 'high',
          actionUrl: `/tasks/${task.taskId}`,
        });
      }

      // Mark as notified to avoid spamming every 5 mins
      await db
        .update(tasks)
        .set({ slaAtRiskNotified: true })
        .where(eq(tasks.id, task.taskId));
    }

    // 2. Find breached tasks
    const breachedTasks = await db
      .select({
        taskId: tasks.id,
        title: tasks.title,
        orgId: tasks.organizationId,
        assigneeId: tasks.assigneeId,
        dueDate: tasks.dueDate,
      })
      .from(tasks)
      .where(
        and(
          isNull(tasks.completedAt),
          isNull(tasks.deletedAt),
          eq(tasks.slaBreachedNotified, false),
          lt(tasks.dueDate, now)
        )
      );

    for (const task of breachedTasks) {
      if (task.assigneeId) {
        await notificationService.createNotification({
          userId: task.assigneeId,
          organizationId: task.orgId,
          type: 'SLA_BREACHED',
          title: 'Task SLA Breached',
          body: `The task "${task.title}" has passed its deadline!`,
          priority: 'urgent',
          actionUrl: `/tasks/${task.taskId}`,
        });
      }

      // Mark as notified
      await db
        .update(tasks)
        .set({ slaBreachedNotified: true })
        .where(eq(tasks.id, task.taskId));
    }

    logger.info(
      `[SLA Monitor] Completed. Notified ${atRiskTasks.length} at-risk and ${breachedTasks.length} breached tasks.`
    );
  } catch (error) {
    logger.error('[SLA Monitor] Critical failure:', error as Error);
  }
};
