/**
 * Analytics Controller
 */

import { Context } from 'hono';
import * as analyticsService from '../services/analytics.service';
import { logger } from '../utils/logger';
import { OrgAnalyticsSnapshot } from '../db/schema';

export const getLatestMetrics = async (c: Context) => {
  try {
    const orgId = c.get('organizationId');
    if (!orgId) {
      return c.json({ error: 'Organization ID required' }, 400);
    }

    const snapshot = await analyticsService.getLatestSnapshot(orgId);

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
    const orgId = c.get('organizationId');
    const days = Number(c.req.query('days')) || 7;

    if (!orgId) {
      return c.json({ error: 'Organization ID required' }, 400);
    }

    const snapshots = await analyticsService.getAnalyticsTrend(orgId, days);

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
