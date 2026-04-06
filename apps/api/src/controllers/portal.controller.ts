import { Context } from 'hono';
import { eq } from 'drizzle-orm';
import { db } from '../db';
import { projects } from '../db/schema';
import { logger } from '../utils/logger';
import * as portalService from '../services/portal.service';
import { ForbiddenError, NotFoundError } from '../utils/errors';

/**
 * Client Portal Controller
 *
 * Dedicated controller for client-facing views of records.
 * Secured by Project + Token (Portal magic link).
 */

export const getPortalContextHandler = async (c: Context) => {
  try {
    const { subAccount, organization } = await getPortalContext(c);
    return c.json({
      success: true,
      data: {
        account: {
          id: subAccount.id,
          name: subAccount.name,
          type: subAccount.accountType,
          projectAccess: subAccount.projectAccess,
        },
        organization,
      },
    });
  } catch (error) {
    if (error instanceof ForbiddenError || error instanceof NotFoundError) {
      return c.json(
        { error: error.message },
        error instanceof ForbiddenError ? 403 : 404
      );
    }
    logger.error('Portal Context Failure', error as Error);
    return c.json({ error: 'Internal Server Error' }, 500);
  }
};

const getPortalContext = async (c: Context) => {
  const token = c.req.header('x-portal-token') || c.req.query('token');

  if (!token) {
    throw new ForbiddenError('Missing authorization token');
  }

  const { subAccount, organization } = await portalService.verifyPortalToken(token);

  return { subAccount, organization };
};

export const listPortalRecords = async (c: Context) => {
  try {
    const projectKey = c.req.param('projectKey');
    const { subAccount, organization } = await getPortalContext(c);

    // Fetch records scoped to this sub-account in the target project universe
    const { records: portalRecords, project } =
      await portalService.listPortalRecords(subAccount.id, projectKey);

    logger.info('[Portal:Access] Listing records for client', {
      subAccountId: subAccount.id,
      orgSlug: organization?.slug,
      projectKey,
    });

    return c.json({
      success: true,
      data: {
        records: portalRecords,
        project,
        account: {
          name: subAccount.name,
          type: subAccount.accountType,
        },
      },
    });
  } catch (error) {
    if (error instanceof ForbiddenError || error instanceof NotFoundError) {
      return c.json(
        { error: error.message },
        error instanceof ForbiddenError ? 403 : 404
      );
    }
    logger.error('Portal API Failure', error as Error);
    return c.json({ error: 'Internal Server Error' }, 500);
  }
};

export const listPortalTypes = async (c: Context) => {
  try {
    const projectKey = c.req.param('projectKey');
    const { subAccount } = await getPortalContext(c);

    const { types, project } = await portalService.listPortalTypes(
      subAccount.id,
      projectKey
    );

    return c.json({
      success: true,
      data: { types, project },
    });
  } catch (error) {
    if (error instanceof ForbiddenError || error instanceof NotFoundError) {
      return c.json(
        { error: error.message },
        error instanceof ForbiddenError ? 403 : 404
      );
    }
    logger.error('Portal API Types Failure', error as Error);
    return c.json({ error: 'Internal Server Error' }, 500);
  }
};

export const getPortalRecord = async (c: Context) => {
  try {
    const projectKey = c.req.param('projectKey');
    const recordNumber = parseInt(c.req.param('number'), 10);
    const { subAccount } = await getPortalContext(c);

    const { record, project } = await portalService.getPortalRecord(
      subAccount.id,
      projectKey,
      recordNumber
    );

    return c.json({
      success: true,
      data: { record, project },
    });
  } catch (error) {
    if (error instanceof ForbiddenError || error instanceof NotFoundError) {
      return c.json(
        { error: error.message },
        error instanceof ForbiddenError ? 403 : 404
      );
    }
    logger.error('Portal API Failure', error as Error);
    return c.json({ error: 'Internal Server Error' }, 500);
  }
};

export const ingestPortalRecord = async (c: Context) => {
  try {
    const projectKey = c.req.param('projectKey');
    const { subAccount, organization } = await getPortalContext(c);

    // 1. Security Check: Only Field Agents or Partners can write
    if (subAccount.accountType === 'client_viewer') {
      throw new ForbiddenError('Client viewers have read-only access');
    }

    const body = await c.req.json();
    const { typeId, data, externalId } = body;

    // 2. Resolve Project
    const project = await db.query.projects.findFirst({
      where: eq(projects.key, projectKey),
    });

    if (!project) throw new NotFoundError('Project universe not found');

    // 3. Process Ingestion via hardened Portal Service
    const result = await portalService.ingestPortalRecord(
      subAccount.id,
      projectKey,
      { typeId, data, externalId }
    );

    logger.info('[Portal:Ingest] Record created by field agent', {
      subAccountId: subAccount.id,
      orgSlug: organization.slug,
      recordId: result.record.id,
    });

    return c.json({
      success: true,
      data: result,
    });
  } catch (error) {
    if (error instanceof ForbiddenError || error instanceof NotFoundError) {
      return c.json(
        { error: error.message },
        error instanceof ForbiddenError ? 403 : 404
      );
    }
    logger.error('Portal Ingestion Failure', error as Error);
    return c.json({ error: 'Internal Server Error' }, 500);
  }
};
