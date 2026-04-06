/**
 * Sub-Accounts Controller
 *
 * Handles HTTP requests for managing specialized organization roles
 * (Field Agents, Client Viewers, Partners).
 */

import { Context } from 'hono';
import * as subAccountService from '../services/sub-accounts.service';
import {
  createSubAccountSchema,
  updateSubAccountSchema,
} from '@validiant/shared';

/**
 * List sub-accounts for an organization
 */
export const listSubAccounts = async (c: Context) => {
  try {
    const orgId = c.req.param('orgId');
    const type = c.req.query('type');
    const subAccounts = await subAccountService.getSubAccounts(orgId, type);

    return c.json({
      success: true,
      data: subAccounts,
    });
  } catch (error) {
    return c.json(
      {
        success: false,
        error: 'Failed to list sub-accounts',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
};

/**
 * Create a new sub-account (Invite flow)
 */
export const createSubAccount = async (c: Context) => {
  try {
    const orgId = c.req.param('orgId');
    const user = c.get('user'); // Assuming user is injected by auth middleware
    const body = await c.req.json();

    // Validate request
    const validated = createSubAccountSchema.parse(body);

    const subAccount = await subAccountService.createSubAccount(orgId, {
      ...validated,
      createdById: user.id,
    });

    return c.json(
      {
        success: true,
        message: 'Sub-account created successfully',
        data: subAccount,
      },
      201
    );
  } catch (error) {
    return c.json(
      {
        success: false,
        error: 'Failed to create sub-account',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      error instanceof Error && error.name === 'ZodError' ? 400 : 500
    );
  }
};

/**
 * Update sub-account
 */
export const updateSubAccount = async (c: Context) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();

    // Validate request
    const validated = updateSubAccountSchema.parse(body);

    const subAccount = await subAccountService.updateSubAccount(id, validated);

    return c.json({
      success: true,
      message: 'Sub-account updated successfully',
      data: subAccount,
    });
  } catch (error) {
    return c.json(
      {
        success: false,
        error: 'Failed to update sub-account',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      error instanceof Error && error.name === 'ZodError' ? 400 : 500
    );
  }
};

/**
 * Revoke sub-account access
 */
export const deleteSubAccount = async (c: Context) => {
  try {
    const id = c.req.param('id');
    await subAccountService.deleteSubAccount(id);

    return c.json({
      success: true,
      message: 'Sub-account access revoked',
    });
  } catch (error) {
    return c.json(
      {
        success: false,
        error: 'Failed to delete sub-account',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
};

/**
 * Get sub-account details
 */
export const getSubAccount = async (c: Context) => {
  try {
    const id = c.req.param('id');
    const subAccount = await subAccountService.getSubAccountById(id);

    return c.json({
      success: true,
      data: subAccount,
    });
  } catch (error) {
    return c.json(
      {
        success: false,
        error: 'Failed to get sub-account',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
};
