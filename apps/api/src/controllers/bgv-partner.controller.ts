/**
 * BGV Partner Controller
 *
 * Handles HTTP requests for managing BGV partners.
 */

import { Context } from 'hono';
import { z } from 'zod';
import * as partnerService from '../services/bgv-partner.service';
import {
  createBgvPartnerSchema,
  updateBgvPartnerSchema,
} from '@validiant/shared';

/**
 * List partners for an organization
 */
export const listPartners = async (c: Context) => {
  try {
    const orgId = c.req.param('orgId');
    const partners = await partnerService.getPartners(orgId);

    return c.json({
      success: true,
      data: partners,
    });
  } catch (error) {
    return c.json(
      {
        success: false,
        error: 'Failed to list partners',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
};

/**
 * Create a new partner
 */
export const createPartner = async (c: Context) => {
  try {
    const orgId = c.req.param('orgId');
    const body = (await c.req.json()) as z.infer<typeof createBgvPartnerSchema>;

    const partner = await partnerService.createPartner(orgId, body);

    return c.json(
      {
        success: true,
        message: 'Partner created successfully',
        data: partner,
      },
      201
    );
  } catch (error) {
    return c.json(
      {
        success: false,
        error: 'Failed to create partner',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
};

/**
 * Update partner configuration
 */
export const updatePartner = async (c: Context) => {
  try {
    const id = c.req.param('id');
    const body = (await c.req.json()) as z.infer<typeof updateBgvPartnerSchema>;

    const partner = await partnerService.updatePartner(id, body);

    return c.json({
      success: true,
      message: 'Partner updated successfully',
      data: partner,
    });
  } catch (error) {
    return c.json(
      {
        success: false,
        error: 'Failed to update partner',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
};

/**
 * Get partner details
 */
export const getPartner = async (c: Context) => {
  try {
    const id = c.req.param('id');
    const decrypt = c.req.query('decrypt') === 'true';

    const partner = await partnerService.getPartnerById(id, decrypt);

    return c.json({
      success: true,
      data: partner,
    });
  } catch (error) {
    return c.json(
      {
        success: false,
        error: 'Failed to get partner',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
};
