import { Context } from 'hono';
import { eq, and } from 'drizzle-orm';
import { db } from '../db';
import { projects, projectTypes, records } from '../db/schema';
import { ingestPayloadSchema } from '@validiant/shared';
import * as recordService from '../services/records.service';
import { logger } from '../utils/logger';

/**
 * Public Inbound Ingestion Controller
 *
 * Handles POST /api/v1/ingest/:projectKey
 * Secured by Project-specific API Keys.
 */

export const ingestData = async (c: Context) => {
  try {
    const projectKey = c.req.param('projectKey');
    const apiKey = c.req.header('x-api-key');

    if (!apiKey) {
      return c.json({ error: 'Missing x-api-key header' }, 401);
    }

    // 1. Resolve Project and Validate API Key
    const project = await db.query.projects.findFirst({
      where: eq(projects.key, projectKey),
    });

    if (!project) {
      return c.json({ error: 'Project not found' }, 404);
    }

    if (!project.isApiEnabled) {
      return c.json({ error: 'API access disabled for this project' }, 403);
    }

    if (project.clientApiKey !== apiKey) {
      return c.json({ error: 'Invalid API key' }, 401);
    }

    // 2. Validate Payload
    const body = await c.req.json();
    const result = ingestPayloadSchema.safeParse(body);

    if (!result.success) {
      return c.json(
        { error: 'Invalid payload format', details: result.error.format() },
        400
      );
    }

    const { type, typeId, data, assignTo, clientId, externalId, status } =
      result.data;

    // 3. Resolve Project Type
    let targetType;
    if (typeId) {
      targetType = await db.query.projectTypes.findFirst({
        where: and(
          eq(projectTypes.id, typeId),
          eq(projectTypes.projectId, project.id)
        ),
      });
    } else if (type) {
      targetType = await db.query.projectTypes.findFirst({
        where: and(
          eq(projectTypes.name, type),
          eq(projectTypes.projectId, project.id)
        ),
      });
    }

    if (!targetType) {
      return c.json(
        {
          error: `Project Archetype '${type || typeId}' not found in this coordinate`,
        },
        404
      );
    }

    // 4. Duplicate Check (Deduplication)
    if (externalId) {
      const existing = await db.query.records.findFirst({
        where: and(
          eq(records.projectId, project.id),
          eq(records.typeId, targetType.id),
          eq(records.externalId, externalId)
        ),
      });

      if (existing) {
        logger.warn('Duplicate ingestion attempt detected', {
          externalId,
          projectId: project.id,
        });
        return c.json(
          {
            success: false,
            error: 'Duplicate record',
            message: `Record with externalId '${externalId}' already exists in this universe`,
            data: {
              recordId: existing.id,
              number: existing.number,
              displayId: existing.displayId,
            },
          },
          409
        );
      }
    }

    // 5. Atomic Creation via Record Engine
    // We use the project ownerId as the system identity for the audit trail
    const newRecord = await recordService.createRecord(
      project.id,
      project.ownerId,
      {
        typeId: targetType.id,
        data,
        assignedTo: assignTo,
        clientId,
        createdVia: 'api',
        status: status || 'pending',
        externalId,
      }
    );

    logger.info('[Ingest:Success] Record injected via public API', {
      projectId: project.id,
      recordId: newRecord.id,
      number: newRecord.number,
      externalId,
    });

    return c.json(
      {
        success: true,
        data: {
          recordId: newRecord.id,
          number: newRecord.number,
          displayId: newRecord.displayId,
        },
      },
      201
    );
  } catch (error) {
    logger.error('[Ingest:Failure] API Exception', error as Error);
    return c.json(
      {
        error: 'Ingest logic failure',
        message: (error as Error).message,
      },
      500
    );
  }
};
