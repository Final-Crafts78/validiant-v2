/**
 * Analytics Service
 *
 * Handles retrieval of materialized analytics snapshots.
 */

import { desc, eq, and, sql } from 'drizzle-orm';
import { db } from '../db';
import { orgAnalyticsSnapshots } from '../db/schema';

export const getOrganizationAnalytics = async (
  organizationId: string,
  limit: number = 30
) => {
  return await db
    .select()
    .from(orgAnalyticsSnapshots)
    .where(eq(orgAnalyticsSnapshots.organizationId, organizationId))
    .orderBy(desc(orgAnalyticsSnapshots.recordedAt))
    .limit(limit);
};

export const getLatestSnapshot = async (organizationId: string) => {
  const snapshots = await db
    .select()
    .from(orgAnalyticsSnapshots)
    .where(eq(orgAnalyticsSnapshots.organizationId, organizationId))
    .orderBy(desc(orgAnalyticsSnapshots.recordedAt))
    .limit(1);

  return snapshots[0] || null;
};

export const getAnalyticsTrend = async (
  organizationId: string,
  days: number = 7
) => {
  const ago = new Date();
  ago.setDate(ago.getDate() - days);

  return await db
    .select()
    .from(orgAnalyticsSnapshots)
    .where(
      and(
        eq(orgAnalyticsSnapshots.organizationId, organizationId),
        sql`${orgAnalyticsSnapshots.recordedAt} > ${ago}`
      )
    )
    .orderBy(orgAnalyticsSnapshots.recordedAt);
};
