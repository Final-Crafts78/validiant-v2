/**
 * Verification Type Service
 *
 * Handles creation and management of verification types, field schemas,
 * and schema versioning for organizations.
 */

import { eq, and, desc } from 'drizzle-orm';
import { db } from '../db';
import { verificationTypes, fieldSchemaVersions } from '../db/schema';
import { ConflictError, assertExists } from '../utils/errors';
import { logger } from '../utils/logger';

/**
 * Create a new verification type
 */
export const createVerificationType = async (
  organizationId: string,
  userId: string,
  data: {
    code: string;
    name: string;
    fieldSchema: Record<string, unknown>[];
    slaOverrideHours?: number;
  }
) => {
  // Check if code already exists for this org
  const existing = await db
    .select({ id: verificationTypes.id })
    .from(verificationTypes)
    .where(
      and(
        eq(verificationTypes.organizationId, organizationId),
        eq(verificationTypes.code, data.code)
      )
    )
    .limit(1);

  if (existing.length > 0) {
    throw new ConflictError(
      `Verification type with code ${data.code} already exists`
    );
  }

  // Create VT
  const [newVT] = await db
    .insert(verificationTypes)
    .values({
      organizationId,
      code: data.code,
      name: data.name,
      fieldSchema: data.fieldSchema,
      slaOverrideHours: data.slaOverrideHours,
    })
    .returning();

  // Create initial version
  await db.insert(fieldSchemaVersions).values({
    verificationTypeId: newVT.id,
    version: 1,
    fieldSchema: data.fieldSchema,
    createdById: userId,
  });

  logger.info('Verification type created', {
    organizationId,
    code: data.code,
    vtId: newVT.id,
  });

  return newVT;
};

/**
 * Get all verification types for an organization
 */
export const getVerificationTypes = async (
  organizationId: string,
  activeOnly = true
) => {
  const whereClause = activeOnly
    ? and(
        eq(verificationTypes.organizationId, organizationId),
        eq(verificationTypes.isActive, true)
      )
    : eq(verificationTypes.organizationId, organizationId);

  return await db
    .select()
    .from(verificationTypes)
    .where(whereClause)
    .orderBy(verificationTypes.name);
};

/**
 * Get verification type by ID
 */
export const getVerificationTypeById = async (id: string) => {
  const [vt] = await db
    .select()
    .from(verificationTypes)
    .where(eq(verificationTypes.id, id))
    .limit(1);

  assertExists(vt, 'VerificationType');
  return vt;
};

/**
 * Update verification type and create new schema version if fields changed
 */
export const updateVerificationType = async (
  id: string,
  userId: string,
  data: {
    name?: string;
    fieldSchema?: Record<string, unknown>[];
    isActive?: boolean;
    slaOverrideHours?: number;
  }
) => {
  const oldVT = await getVerificationTypeById(id);

  const updateData: Record<string, unknown> = {
    ...data,
    updatedAt: new Date(),
  };

  const [updatedVT] = await db
    .update(verificationTypes)
    .set(updateData)
    .where(eq(verificationTypes.id, id))
    .returning();

  // If fieldSchema changed, create new version
  if (
    data.fieldSchema &&
    JSON.stringify(data.fieldSchema) !== JSON.stringify(oldVT.fieldSchema)
  ) {
    // Get latest version number
    const [latestVersion] = await db
      .select({ version: fieldSchemaVersions.version })
      .from(fieldSchemaVersions)
      .where(eq(fieldSchemaVersions.verificationTypeId, id))
      .orderBy(desc(fieldSchemaVersions.version))
      .limit(1);

    await db.insert(fieldSchemaVersions).values({
      verificationTypeId: id,
      version: (latestVersion?.version || 0) + 1,
      fieldSchema: data.fieldSchema,
      createdById: userId,
    });

    logger.info('New verification schema version created', {
      vtId: id,
      version: (latestVersion?.version || 0) + 1,
    });
  }

  return updatedVT;
};

/**
 * Get schema versions for a verification type
 */
export const getSchemaVersions = async (vtId: string) => {
  return await db
    .select()
    .from(fieldSchemaVersions)
    .where(eq(fieldSchemaVersions.verificationTypeId, vtId))
    .orderBy(desc(fieldSchemaVersions.version));
};
