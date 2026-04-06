/**
 * Inbound Case Ingestion Service
 * Handles processing of cases pushed by external partners into the Project Universe.
 */

import { eq, and } from 'drizzle-orm';
import { db } from '../db';
import { projectTypes, projects, BgvPartner, records } from '../db/schema';
import { logger } from '../utils/logger';
import { logActivity } from '../utils/activity';
import { ConflictError, NotFoundError, ForbiddenError } from '../utils/errors';
import { InboundCasePushInput } from '@validiant/shared';
import * as recordService from './records.service';

/**
 * Process an inbound case push from a partner
 */
export const processInboundCase = async (
  _partnerKey: string,
  data: InboundCasePushInput,
  partner: BgvPartner
) => {
  const organizationId = partner.organizationId;

  // 1. Resolve Project Archetype (Project Type)
  // Partner sends data.checkType which maps to projectTypes.name or a slug
  const [pType] = await db
    .select()
    .from(projectTypes)
    .where(
      and(
        eq(projectTypes.projectId, data.projectId || ''), // Ideally projectId is in the push
        eq(projectTypes.name, data.checkType)
      )
    )
    .limit(1);

  if (!pType) {
    throw new NotFoundError(
      `Project Archetype '${data.checkType}' not found in the target scope`
    );
  }

  // 2. Resource/Project Resolution
  let targetProjectId: string = '';
  
  if (data.projectId) {
    const [project] = await db
      .select({ id: projects.id, ownerId: projects.ownerId })
      .from(projects)
      .where(
        and(
          eq(projects.id, data.projectId),
          eq(projects.organizationId, organizationId)
        )
      )
      .limit(1);

    if (!project) {
      throw new ForbiddenError('Project scope access denied');
    }
    targetProjectId = project.id;
  } else {
    // Fallback logic for partner pushes without explicit projectId
    const [defaultProject] = await db
      .select({ id: projects.id, ownerId: projects.ownerId })
      .from(projects)
      .where(
        and(
          eq(projects.organizationId, organizationId),
          eq(projects.status, 'active')
        )
      )
      .limit(1);

    if (!defaultProject) {
      throw new Error('No active project universe found for this partner');
    }
    targetProjectId = defaultProject.id;
  }

  // 3. Deduplication (External ID check)
  const [existingRecord] = await db
    .select({ id: records.id })
    .from(records)
    .where(
      and(
        eq(records.projectId, targetProjectId),
        eq(records.externalId, data.caseId)
      )
    )
    .limit(1);

  if (existingRecord) {
    throw new ConflictError(
      `Case ID '${data.caseId}' already exists in this universe`,
      { recordId: existingRecord.id }
    );
  }

  // 4. Create Record via Record Engine
  const newRecord = await recordService.createRecord(
    targetProjectId,
    partner.organizationId, // System level identity
    {
      typeId: pType.id,
      data: {
        ...data.customFields,
        candidateName: data.candidateName,
        candidateEmail: data.candidateEmail,
        pushedByPartner: partner.id,
      },
      status: 'pending',
      externalId: data.caseId,
      createdVia: 'partner_api',
    }
  );

  // 5. High-level Audit
  await logActivity({
    organizationId,
    userId: organizationId,
    action: 'RECORD_INGESTED_VIA_PARTNER',
    entityId: newRecord.id,
    entityType: 'record',
    details: `Record injected by partner ${partner.name}. External ID: ${data.caseId}`,
  });

  logger.info('[Inbound:Success] External case synced to Universe', {
    recordId: newRecord.id,
    externalId: data.caseId,
    partnerId: partner.id,
  });

  return newRecord;
};
