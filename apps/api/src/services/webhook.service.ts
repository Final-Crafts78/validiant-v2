import { db } from '../db';
import {
  outboundDeliveryLogs,
  bgvPartners,
  webhookSubscriptions,
  tasks,
  caseFieldValues,
} from '../db/schema';
import { eq, and } from 'drizzle-orm';

/**
 * Interface mapping to what the Cloudflare Queue transports
 */
export interface WebhookDispatchJob {
  logId: string;
  partnerId: string;
  projectId: string;
  taskId: string;
  targetUrl: string;
  payload: any;
  secretKey?: string;
}

/**
 * Resolves the outbox mechanism:
 * 1. Called during Task 'VERIFIED' status transition.
 * 2. Compiles EAV JSON payload.
 * 3. Saves to `outboundDeliveryLogs`.
 * 4. Pushes to Cloudflare Queue buffer.
 */
export async function queueWebhookDispatch(
  taskId: string,
  projectId: string,
  env: any
) {
  // 1. Locate valid external hook subscriptions
  const hooks = await db
    .select()
    .from(webhookSubscriptions)
    .where(
      and(
        eq(webhookSubscriptions.projectId, projectId),
        eq(webhookSubscriptions.isActive, true)
      )
    );

  if (!hooks.length) return; // No hooks attached

  // 2. We need a 'partnerId' representing the external system.
  // In a unified command center, we associate the Webhook Subscription to the Partner.
  // Let's grab the API key bindings or fallback to generic partner mapping.
  const partners = await db
    .select()
    .from(bgvPartners)
    .where(
      and(
        eq(
          bgvPartners.organizationId,
          (await getOrgByProject(projectId)) ?? ''
        ),
        eq(bgvPartners.isActive, true)
      )
    );

  if (!partners.length) return; // For safety, tie it to the first active partner config
  const partnerId = partners[0].id;

  // 3. Compile the Payload (Flat JSON mapping from EAV)
  const taskData = await db.select().from(tasks).where(eq(tasks.id, taskId));
  if (!taskData.length) return;

  const eavFields = await db
    .select()
    .from(caseFieldValues)
    .where(eq(caseFieldValues.taskId, taskId));

  const customDataStringified = eavFields.reduce(
    (acc: Record<string, any>, field: any) => {
      // Basic hydration strategy
      let val: any = field.valueText;
      if (field.valueBoolean !== null) val = field.valueBoolean;
      if (field.valueNumber !== null) val = field.valueNumber;
      if (field.valueJson !== null) val = field.valueJson;
      if (field.mediaUrl !== null) val = field.mediaUrl;

      acc[field.fieldKey] = val;
      return acc;
    },
    {} as Record<string, any>
  );

  const payload = {
    event: 'case.verified',
    caseId: taskData[0].caseId,
    taskId: taskData[0].id,
    clientName: taskData[0].clientName,
    pincode: taskData[0].pincode,
    verifiedAt: new Date().toISOString(),
    customData: customDataStringified,
  };

  // 4. Create Outbox entries
  for (const hook of hooks) {
    const [inserted] = await db
      .insert(outboundDeliveryLogs)
      .values({
        taskId,
        partnerId,
        triggerStatus: 'VERIFIED',
        payloadSent: payload,
      })
      .returning();

    // 5. Push to Queue
    if (env.WEBHOOK_DISPATCHER) {
      await env.WEBHOOK_DISPATCHER.send({
        logId: inserted.id,
        partnerId,
        projectId,
        taskId,
        targetUrl: hook.endpointUrl,
        payload,
        secretKey: hook.secretKey,
      });
      console.log(`[Webhooks] Queued dispatch to ${hook.endpointUrl}`);
    }
  }
}

async function getOrgByProject(projectId: string) {
  const { projects } = require('../db/schema');
  const [proj] = await db
    .select({ orgId: projects.organizationId })
    .from(projects)
    .where(eq(projects.id, projectId));
  return proj?.orgId;
}

/**
 * Queue Consumer Execution
 * Called from index.ts `queue` handler
 */
export async function processWebhookQueue(batch: any) {
  for (const msg of batch.messages) {
    const job = msg.body as WebhookDispatchJob;
    let status = 0;
    let responseBody = '';

    try {
      const resp = await fetch(job.targetUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(job.secretKey && { 'x-webhook-signature': job.secretKey }),
        },
        body: JSON.stringify(job.payload),
      });

      status = resp.status;
      responseBody = await resp.text();

      if (!resp.ok) {
        throw new Error(`HTTP ${status}: ${responseBody}`);
      }

      await db
        .update(outboundDeliveryLogs)
        .set({
          responseStatus: status,
          responseBody,
          deliveredAt: new Date(),
        })
        .where(eq(outboundDeliveryLogs.id, job.logId));

      msg.ack();
      console.log(
        `[Webhook:Success] Sent logId ${job.logId} to ${job.targetUrl}`
      );
    } catch (e: any) {
      console.error(`[Webhook:Error] logId ${job.logId}:`, e.message);

      // We read attempt number and increment if it failed.
      const [existing] = await db
        .select({ attemptNumber: outboundDeliveryLogs.attemptNumber })
        .from(outboundDeliveryLogs)
        .where(eq(outboundDeliveryLogs.id, job.logId));

      const newAttempt = (existing?.attemptNumber || 1) + 1;

      await db
        .update(outboundDeliveryLogs)
        .set({
          responseStatus: status,
          responseBody: e.message,
          attemptNumber: newAttempt,
          failedAt: new Date(),
          error: e.message,
        })
        .where(eq(outboundDeliveryLogs.id, job.logId));

      // Retry logic relies on Cloudflare max_retries
      msg.retry();
    }
  }
}
