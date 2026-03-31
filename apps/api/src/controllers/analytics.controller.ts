/**
 * Analytics Controller
 */

import { Context } from 'hono';
import * as analyticsService from '../services/analytics.service';
import { logger } from '../utils/logger';
import { OrgAnalyticsSnapshot } from '../db/schema';

export const getLatestMetrics = async (c: Context) => {
  try {
    const orgId = c.get('orgId') || c.get('organizationId');
    if (!orgId) {
      logger.warn(
        '[Analytics Controller] getLatestMetrics - Missing orgId context'
      );
      return c.json({ error: 'Organization ID required' }, 400);
    }

    const startTime = performance.now();
    const snapshot = await analyticsService.getLatestSnapshot(orgId);
    const duration = (performance.now() - startTime).toFixed(2);

    logger.info('[Analytics Controller] getLatestMetrics complete', {
      orgId,
      duration: `${duration}ms`,
      found: !!snapshot,
    });

    if (!snapshot) {
      return c.json({ message: 'No metrics recorded yet' }, 404);
    }

    return c.json({
      data: snapshot.metrics,
      recordedAt: snapshot.recordedAt,
    });
  } catch (error) {
    logger.error(
      '[Analytics Controller] getLatestMetrics error:',
      error as Error
    );
    return c.json({ error: 'Internal server error' }, 500);
  }
};

export const getHistory = async (c: Context) => {
  try {
    const orgId = c.get('orgId') || c.get('organizationId');
    const days = Number(c.req.query('days')) || 7;

    if (!orgId) {
      logger.warn(
        '[Analytics Controller] getHistory - Missing orgId context'
      );
      return c.json({ error: 'Organization ID required' }, 400);
    }

    const startTime = performance.now();
    const snapshots = await analyticsService.getAnalyticsTrend(orgId, days);
    const duration = (performance.now() - startTime).toFixed(2);

    logger.info('[Analytics Controller] getHistory complete', {
      orgId,
      days,
      duration: `${duration}ms`,
      count: snapshots.length,
    });

    return c.json({
      data: snapshots.map((s: OrgAnalyticsSnapshot) => ({
        recordedAt: s.recordedAt,
        metrics: s.metrics,
      })),
    });
  } catch (error) {
    logger.error('[Analytics Controller] getHistory error:', error as Error);
    return c.json({ error: 'Internal server error' }, 500);
  }
};
