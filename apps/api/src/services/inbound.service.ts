/**
 * Inbound BGV Service
 *
 * Handles processing of cases pushed by external partners.
 */

import { eq, and } from 'drizzle-orm';
import { db } from '../db';
import { tasks, verificationTypes, projects, BgvPartner } from '../db/schema';
import { logger } from '../utils/logger';
import { logActivity } from '../utils/activity';
import { ConflictError, NotFoundError, ForbiddenError } from '../utils/errors';
import { InboundCasePushInput } from '@validiant/shared';

/**
 * Process an inbound case push from a partner
 */
export const processInboundCase = async (
  partnerKey: string,
  data: InboundCasePushInput,
  partner: BgvPartner
) => {
  const organizationId = partner.organizationId;

  // 1. Resolve Verification Type
  const [vType] = await db
    .select()
    .from(verificationTypes)
    .where(
      and(
        eq(verificationTypes.organizationId, organizationId),
        eq(verificationTypes.code, data.checkType)
      )
    )
    .limit(1);

  if (!vType) {
    throw new NotFoundError(
      `Verification type '${data.checkType}' not found for this organization`
    );
  }

  // 2. Resource/Project Resolution
  // If projectId is provided, verify it belongs to the org
  let targetProjectId = data.projectId;
  if (targetProjectId) {
    const [project] = await db
      .select({ id: projects.id })
      .from(projects)
      .where(
        and(
          eq(projects.id, targetProjectId),
          eq(projects.organizationId, organizationId)
        )
      )
      .limit(1);

    if (!project) {
      throw new ForbiddenError('Project not found or access denied');
    }
  } else {
    // Fallback: use the first active project or a default one if needed
    // In a real system, we might have a "Default Inbound Project" in org settings
    const [defaultProject] = await db
      .select({ id: projects.id })
      .from(projects)
      .where(
        and(
          eq(projects.organizationId, organizationId),
          eq(projects.status, 'active')
        )
      )
      .limit(1);

    if (!defaultProject) {
      throw new Error('No active project found to assign the inbound case');
    }
    targetProjectId = defaultProject.id;
  }

  // 3. Check for Duplicate Case ID (Atomic Collision Handling)
  const [existingTask] = await db
    .select({ id: tasks.id })
    .from(tasks)
    .where(
      and(
        eq(tasks.organizationId, organizationId),
        eq(tasks.caseId, data.caseId)
      )
    )
    .limit(1);

  if (existingTask) {
    throw new ConflictError(
      `Case ID '${data.caseId}' already exists. Task ID: ${existingTask.id}`,
      { taskId: existingTask.id }
    );
  }

  // 4. Create Task
  const [newTask] = await db
    .insert(tasks)
    .values({
      organizationId,
      projectId: targetProjectId as string,
      title: `${data.candidateName} - ${vType.name}`,
      description: `Inbound case from partner: ${partner.name}`,
      statusKey: 'UNASSIGNED',
      priority: data.priority,
      caseId: data.caseId,
      verificationTypeId: vType.id,
      clientName: data.candidateName,
      customFields: {
        ...data.customFields,
        candidateEmail: data.candidateEmail,
        pushedByPartner: partner.id,
      },
      createdById: partner.organizationId, // System created
    })
    .returning();

  // 5. Audit Logging
  await logActivity({
    organizationId,
    userId: organizationId,
    action: 'CASE_RECEIVED_FROM_PARTNER',
    entityId: newTask.id,
    entityType: 'task',
    details: `Case received from partner ${partner.name} (${partnerKey}). Case ID: ${data.caseId}`,
  });

  logger.info('Inbound case created', {
    taskId: newTask.id,
    caseId: data.caseId,
    partnerKey,
    orgId: organizationId,
  });

  return newTask;
};
