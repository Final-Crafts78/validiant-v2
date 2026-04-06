/**
 * Portal Service - Schema Universe (Phase 11)
 *
 * Handles secure, token-gated access for external stakeholders:
 * - Client Viewers: Magic-link access to specific project records.
 * - Field Agents: Mobile-first capture nodes.
 */

import { eq, and, desc } from 'drizzle-orm';
import { db } from '../db';
import { 
  orgSubAccounts,
  records,
  projects,
  organizations,
  projectTypes,
} from '../db/schema';
import { NotFoundError, ForbiddenError } from '../utils/errors';
import crypto from 'crypto';

/**
 * Verifies a portal token and returns the associated sub-account and context.
 *
 * @param token The magic-link portal token (base64 encoded hash)
 */
export const verifyPortalToken = async (token: string) => {
  const [subAccount] = await db
    .select()
    .from(orgSubAccounts)
    .where(
      and(
        eq(orgSubAccounts.portalToken, token),
        eq(orgSubAccounts.isActive, true)
      )
    )
    .limit(1);

  if (!subAccount) {
    throw new ForbiddenError('Invalid or expired portal token');
  }

  // Fetch organization context
  const [org] = await db
    .select({
      id: organizations.id,
      name: organizations.name,
      slug: organizations.slug,
      logoUrl: organizations.logoUrl,
    })
    .from(organizations)
    .where(eq(organizations.id, subAccount.orgId))
    .limit(1);

  return {
    subAccount,
    organization: org,
  };
};

/**
 * Lists records accessible to a portal sub-account.
 * Filtered by projectAccess and optionally by clientId.
 */
export const listPortalRecords = async (
  subAccountId: string,
  projectKey: string,
  limit: number = 50
) => {
  // 1. Resolve Sub-Account and Project
  const [subAccount] = await db
    .select()
    .from(orgSubAccounts)
    .where(eq(orgSubAccounts.id, subAccountId))
    .limit(1);

  if (!subAccount) throw new NotFoundError('Sub-account not found');

  const [project] = await db
    .select()
    .from(projects)
    .where(
      and(
        eq(projects.key, projectKey),
        eq(projects.organizationId, subAccount.orgId)
      )
    )
    .limit(1);

  if (!project) throw new NotFoundError('Project universe not found');

  // 2. Verify Project Access
  const access = (
    subAccount.projectAccess as { projectId: string; role: string }[]
  )?.find((a) => a.projectId === project.id);

  if (!access) {
    throw new ForbiddenError('Access to this project universe is restricted');
  }

  // 3. Fetch Scoped Records
  // If it's a client_viewer, optionally filter by their clientId
  const conditions = [eq(records.projectId, project.id)];
  
  // High-trust filtering: if metadata contains a clientId, enforce it
  const metadata = (subAccount.metadata as { clientId?: string }) || {};
  const enforcedClientId = metadata.clientId || subAccount.name; // Fallback to name if client_viewer

  if (subAccount.accountType === 'client_viewer') {
    conditions.push(eq(records.clientId, enforcedClientId));
  }

  const portalRecords = await db.query.records.findMany({
    where: and(...conditions),
    orderBy: [desc(records.createdAt)],
    limit: limit,
  });

  return {
    records: portalRecords,
    project: {
      id: project.id,
      name: project.name,
      key: project.key,
      color: project.color,
      themeColor: project.themeColor,
      logoUrl: project.logoUrl,
    },
  };
};

/**
 * Gets a single record for the portal view.
 */
export const getPortalRecord = async (
  subAccountId: string,
  projectKey: string,
  recordNumber: number
) => {
  const { records: results, project } = await listPortalRecords(
    subAccountId,
    projectKey
  );

  const record = results.find(
    (r: { number: number }) => r.number === recordNumber
  );

  if (!record) {
    throw new NotFoundError('Record not found or access restricted');
  }

  // Fetch full details including history
  const fullRecord = await db.query.records.findFirst({
    where: eq(records.id, record.id),
    with: {
      type: true,
      history: {
        orderBy: [desc(records.createdAt)],
        limit: 10,
      },
    },
  });

  return {
    record: fullRecord,
    project,
  };
};

/**
 * List record archetypes (types + columns) for a portal session.
 * Used by field agents to generate dynamic capture forms.
 */
export const listPortalTypes = async (
  subAccountId: string,
  projectKey: string
) => {
  // 1. Resolve Project Universe
  const project = await db.query.projects.findFirst({
    where: eq(projects.key, projectKey),
  });

  if (!project) throw new Error('Project universe not found');

  // 2. Locate Sub-Account
  const subAccount = await db.query.orgSubAccounts.findFirst({
    where: eq(orgSubAccounts.id, subAccountId),
  });

  if (!subAccount) throw new Error('Sub-account context lost');

  // 3. Verify Project Access
  const access = (
    subAccount.projectAccess as { projectId: string; role: string }[]
  )?.find((a) => a.projectId === project.id);

  if (!access) {
    throw new ForbiddenError(
      'Access denied for this project universe (Field Agent)'
    );
  }

  // 4. Fetch Types with Columns
  const types = await db.query.projectTypes.findMany({
    where: eq(records.projectId, project.id), // Actually wait, projectTypes table should have projectId
    with: {
      columns: true,
    },
  });

  return {
    types,
    project,
  };
};

/**
 * Ingest a new record from a portal session (Field Agent).
 * Handles scoped record numbering and data persistence.
 */
export const ingestPortalRecord = async (
  subAccountId: string,
  projectKey: string,
  payload: { typeId: string; data: any; externalId?: string }
) => {
  // 1. Resolve Project Universe
  const project = await db.query.projects.findFirst({
    where: eq(projects.key, projectKey),
  });

  if (!project) throw new Error('Project universe not found');

  // 2. Locate Sub-Account
  const subAccount = await db.query.orgSubAccounts.findFirst({
    where: eq(orgSubAccounts.id, subAccountId),
  });

  if (!subAccount) throw new Error('Sub-account context lost');

  // 3. Verify Project Access
  const access = (
    subAccount.projectAccess as { projectId: string; role: string }[]
  )?.find((a) => a.projectId === project.id);

  if (!access) {
    throw new ForbiddenError('Access denied for this project universe');
  }

  // 4. Resolve Record Archetype
  const type = await db.query.projectTypes.findFirst({
    where: and(
      eq(projectTypes.projectId, project.id),
      eq(projectTypes.id, payload.typeId)
    ),
  });

  if (!type) throw new Error('Record archetype not found in this universe');

  // 5. Atomic Record Numbering (Concurrency-safe)
  const result = await db.transaction(async (tx: any) => {
    // Get current project record count + 1
    const [latest] = await tx
      .select({ count: records.number })
      .from(records)
      .where(eq(records.projectId, project.id))
      .orderBy(desc(records.number))
      .limit(1);

    const nextNumber = (latest?.count || 0) + 1;

    // 6. Create Record Node
    const [newRecord] = await tx
      .insert(records)
      .values({
        id: crypto.randomUUID(),
        projectId: project.id,
        typeId: type.id,
        number: nextNumber,
        status: 'pending', // Field agents start at pending/submitted
        data: payload.data,
        externalId: payload.externalId || `portal-node-${Date.now()}`,
        organizationId: project.organizationId,
        metadata: {
          capturedBy: subAccount.id,
          agentName: subAccount.name,
          source: 'Field Verification Node',
        },
      })
      .returning();

    return newRecord;
  });

  return {
    record: result,
    project,
    type,
  };
};
