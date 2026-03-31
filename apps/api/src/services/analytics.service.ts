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
  const startTime = performance.now();
  const snapshots = await db
    .select()
    .from(orgAnalyticsSnapshots)
    .where(eq(orgAnalyticsSnapshots.organizationId, organizationId))
    .orderBy(desc(orgAnalyticsSnapshots.recordedAt))
    .limit(1);

  const duration = (performance.now() - startTime).toFixed(2);
  console.info(
    `[Analytics:DB] getLatestSnapshot (${organizationId}) took ${duration}ms`
  );

  return snapshots[0] || null;
};

export const getAnalyticsTrend = async (
  organizationId: string,
  days: number = 7
) => {
  const ago = new Date();
  ago.setDate(ago.getDate() - days);

  const startTime = performance.now();
  const results = await db
    .select()
    .from(orgAnalyticsSnapshots)
    .where(
      and(
        eq(orgAnalyticsSnapshots.organizationId, organizationId),
        sql`${orgAnalyticsSnapshots.recordedAt} > ${ago}`
      )
    )
    .orderBy(orgAnalyticsSnapshots.recordedAt);

  const duration = (performance.now() - startTime).toFixed(2);
  console.info(
    `[Analytics:DB] getAnalyticsTrend (${organizationId}, ${days} days) took ${duration}ms`
  );

  return results;
};
