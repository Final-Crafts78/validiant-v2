/**
 * Workflow Engine (Phase 21)
 *
 * Evaluates automation conditions and executes actions when triggered.
 * Called from task status changes, assignments, and other events.
 *
 * Flow: Event occurs → find matching automations → check conditions → execute action
 */

import { eq, and } from 'drizzle-orm';
import { db, schema } from '../db';
import { sendEmail } from '../services/email.service';

/**
 * Condition evaluation types
 */
interface Condition {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than';
  value: string;
}

interface ActionPayload {
  to?: string;
  subject?: string;
  body?: string;
  webhookUrl?: string;
  newStatus?: string;
  [key: string]: unknown;
}

/**
 * Check if a given data object satisfies all conditions
 */
function evaluateConditions(
  data: Record<string, unknown>,
  conditions: Condition[]
): boolean {
  if (!conditions || conditions.length === 0) return true;

  return conditions.every((condition) => {
    const fieldValue = String(data[condition.field] || '');
    const targetValue = String(condition.value);

    switch (condition.operator) {
      case 'equals':
        return fieldValue === targetValue;
      case 'not_equals':
        return fieldValue !== targetValue;
      case 'contains':
        return fieldValue.toLowerCase().includes(targetValue.toLowerCase());
      case 'greater_than':
        return Number(fieldValue) > Number(targetValue);
      case 'less_than':
        return Number(fieldValue) < Number(targetValue);
      default:
        return false;
    }
  });
}

/**
 * Execute the action defined by the automation
 */
async function executeAction(
  automation: { id: string; actionType: string; actionPayload: unknown },
  eventData: Record<string, unknown>,
  env: Record<string, unknown>
): Promise<void> {
  const payload = (automation.actionPayload || {}) as ActionPayload;

  switch (automation.actionType) {
    case 'SEND_EMAIL': {
      if (payload.to && payload.subject) {
        const body =
          payload.body ||
          `Automation "${eventData.automationName || 'Workflow'}" triggered.`;
        await sendEmail(
          env as unknown as Parameters<typeof sendEmail>[0],
          payload.to,
          payload.subject,
          `<p>${body}</p>`
        );
      }
      break;
    }

    case 'SEND_NOTIFICATION': {
      // Insert a notification for the target user
      const targetUserId = (payload.to || eventData.userId) as string;
      if (targetUserId) {
        await db.insert(schema.notifications).values({
          userId: targetUserId,
          type: 'automation',
          title: payload.subject || 'Automation Triggered',
          content:
            payload.body ||
            `An automation was triggered for task ${eventData.taskId || 'unknown'}.`,
          entityId: (eventData.taskId || eventData.entityId) as string,
          entityType: 'task',
        });
      }
      break;
    }

    case 'WEBHOOK': {
      if (payload.webhookUrl) {
        await fetch(payload.webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event: eventData,
            automation: {
              id: automation.id,
              actionType: automation.actionType,
            },
            timestamp: new Date().toISOString(),
          }),
        }).catch((err) => console.error('Webhook delivery failed:', err));
      }
      break;
    }

    default:
      console.warn(`Unknown action type: ${automation.actionType}`);
  }
}

/**
 * Process a triggered event — find matching automations and execute them
 *
 * @param organizationId - The org where the event occurred
 * @param triggerEvent - The event name (e.g., 'TASK_COMPLETED')
 * @param eventData - Data about the event (task fields, user info, etc.)
 * @param env - Cloudflare Worker env bindings
 */
export async function processAutomations(
  organizationId: string,
  triggerEvent: string,
  eventData: Record<string, unknown>,
  env: Record<string, unknown>
): Promise<void> {
  try {
    // Find active automations matching this trigger for this org
    const matchingAutomations = await db
      .select()
      .from(schema.automations)
      .where(
        and(
          eq(schema.automations.organizationId, organizationId),
          eq(schema.automations.triggerEvent, triggerEvent),
          eq(schema.automations.isActive, true)
        )
      );

    for (const automation of matchingAutomations) {
      const conditions = (automation.conditions || []) as Condition[];

      if (evaluateConditions(eventData, conditions)) {
        // Execute the action
        await executeAction(automation, eventData, env);

        // Update stats
        await db
          .update(schema.automations)
          .set({
            lastTriggeredAt: new Date(),
            triggerCount: automation.triggerCount + 1,
            updatedAt: new Date(),
          })
          .where(eq(schema.automations.id, automation.id));
      }
    }
  } catch (error) {
    // Never fail the main request if automation processing fails
    console.error('Automation processing error:', error);
  }
}
