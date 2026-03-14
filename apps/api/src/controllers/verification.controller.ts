/**
 * Verification Type Controller
 *
 * Handles HTTP requests for managing verification types and their schemas.
 */

import { Context } from 'hono';
import { z } from 'zod';
import * as verificationService from '../services/verification.service';
import * as organizationService from '../services/organization.service';
import { OrganizationRole } from '@validiant/shared';
import {
  createVerificationTypeSchema,
  updateVerificationTypeSchema,
} from '@validiant/shared';

/**
 * Common permission check
 */
async function checkAdminPermission(c: Context, organizationId: string) {
  const user = c.get('user');
  if (!user || !user.userId) return false;

  const role = await organizationService.getUserRole(
    organizationId,
    user.userId
  );
  return role === OrganizationRole.OWNER || role === OrganizationRole.ADMIN;
}

/**
 * List all verification types for an organization
 */
export const listVerificationTypes = async (c: Context) => {
  try {
    const orgId = c.req.param('orgId');
    const activeOnly = c.req.query('activeOnly') !== 'false';

    const vts = await verificationService.getVerificationTypes(
      orgId,
      activeOnly
    );

    return c.json({
      success: true,
      data: vts,
    });
  } catch (error) {
    return c.json(
      {
        success: false,
        error: 'Failed to list verification types',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
};

/**
 * Create a new verification type
 */
export const createVerificationType = async (c: Context) => {
  try {
    const orgId = c.req.param('orgId');
    const user = c.get('user');

    if (!(await checkAdminPermission(c, orgId))) {
      return c.json(
        {
          success: false,
          error: 'Forbidden',
          message: 'Insufficient permissions',
        },
        403
      );
    }

    const validatedData = (await c.req.json()) as z.infer<
      typeof createVerificationTypeSchema
    >;

    const vt = await verificationService.createVerificationType(
      orgId,
      user.userId,
      validatedData
    );

    return c.json(
      {
        success: true,
        message: 'Verification type created successfully',
        data: vt,
      },
      201
    );
  } catch (error) {
    return c.json(
      {
        success: false,
        error: 'Failed to create verification type',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
};

/**
 * Update verification type
 */
export const updateVerificationType = async (c: Context) => {
  try {
    const orgId = c.req.param('orgId');
    const id = c.req.param('id');
    const user = c.get('user');

    if (!(await checkAdminPermission(c, orgId))) {
      return c.json(
        {
          success: false,
          error: 'Forbidden',
          message: 'Insufficient permissions',
        },
        403
      );
    }

    const validatedData = (await c.req.json()) as z.infer<
      typeof updateVerificationTypeSchema
    >;

    const vt = await verificationService.updateVerificationType(
      id,
      user.userId,
      validatedData
    );

    return c.json({
      success: true,
      message: 'Verification type updated successfully',
      data: vt,
    });
  } catch (error) {
    return c.json(
      {
        success: false,
        error: 'Failed to update verification type',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
};

/**
 * Get schema versions
 */
export const getSchemaVersions = async (c: Context) => {
  try {
    const id = c.req.param('id');
    const versions = await verificationService.getSchemaVersions(id);

    return c.json({
      success: true,
      data: versions,
    });
  } catch (error) {
    return c.json(
      {
        success: false,
        error: 'Failed to get schema versions',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
};
