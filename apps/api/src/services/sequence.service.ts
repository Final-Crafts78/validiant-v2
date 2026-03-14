/**
 * Sequence Service
 *
 * Handles atomic generation of organization-specific sequences
 * for case IDs and other sequential identifiers.
 */

import { sql } from 'drizzle-orm';
import { db } from '../db';
import { logger } from '../utils/logger';

/**
 * Get the next case ID for an organization
 * Generates a sequence per organization in the format: org_{orgId}_case_seq
 */
export const getNextCaseId = async (
  organizationId: string
): Promise<string> => {
  // Postgres sequence names cannot have hyphens
  const sanitizedOrgId = organizationId.replace(/-/g, '_');
  const sequenceName = `org_${sanitizedOrgId}_case_seq`;

  try {
    // 1. Ensure the sequence exists
    await db.execute(
      sql.raw(`CREATE SEQUENCE IF NOT EXISTS ${sequenceName} START 1`)
    );

    // 2. Fetch the next value
    const result = (await db.execute(
      sql.raw(`SELECT nextval('${sequenceName}') as val`)
    )) as unknown as { rows: { val: string | number }[] };
    const val = result.rows[0].val;

    // 3. Format into a human-readable case ID (e.g. CASE-000001)
    const formattedId = `CASE-${val.toString().padStart(6, '0')}`;

    return formattedId;
  } catch (error) {
    logger.error('Failed to generate next case ID', { organizationId, error });
    throw new Error('Sequence generation failed');
  }
};
