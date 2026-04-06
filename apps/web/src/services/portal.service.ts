import { get, post } from '@/lib/api';
import { ProjectRecord } from '@validiant/shared';
import { APIResponse } from '@/lib/api';

/**
 * Portal API Service - Phase 4 (External Stakeholders)
 *
 * Handles communication with the token-gated portal endpoints.
 * These methods require an `x-portal-token` header.
 */

export interface PortalContext {
  records: ProjectRecord[];
  project: {
    id: string;
    name: string;
    key: string;
    color?: string;
    themeColor?: string;
    logoUrl?: string;
  };
  account: {
    name: string;
    type: string;
    projectAccess: {
      projectId: string;
      projectKey: string;
      role: string;
    }[];
  };
}

/**
 * List records for a portal session
 */
export const listPortalRecords = async (
  projectKey: string,
  token: string
): Promise<PortalContext> => {
  const response = await get<APIResponse<PortalContext>>(
    `/portal/${projectKey}/records`,
    {
      headers: {
        'x-portal-token': token,
      },
    }
  );

  if (!response.data.data) {
    throw new Error('Failed to fetch portal records');
  }

  return response.data.data;
};

/**
 * Get a single record detail for a portal session
 */
export const getPortalRecord = async (
  projectKey: string,
  recordNumber: number,
  token: string
): Promise<{ record: ProjectRecord; project: { name: string; key: string } }> => {
  const response = await get<
    APIResponse<{ record: ProjectRecord; project: { name: string; key: string } }>
  >(`/portal/${projectKey}/records/${recordNumber}`, {
    headers: {
      'x-portal-token': token,
    },
  });

  if (!response.data.data) {
    throw new Error('Record not found or access denied');
  }

  return response.data.data;
};

/**
 * Get portal context (account and accessible projects)
 */
export const getPortalContext = async (
  token: string
): Promise<{ account: PortalContext['account']; organization: any }> => {
  const response = await get<
    APIResponse<{ account: PortalContext['account']; organization: any }>
  >('/portal/context', {
    headers: {
      'x-portal-token': token,
    },
  });

  if (!response.data.data) {
    throw new Error('Invalid or expired portal token');
  }

  return response.data.data;
};

/**
 * List record archetypes (types + columns) for a portal session
 */
export const listPortalTypes = async (
  projectKey: string,
  token: string
): Promise<{ types: any[]; project: any }> => {
  const response = await get<APIResponse<{ types: any[]; project: any }>>(
    `/portal/${projectKey}/types`,
    {
      headers: {
        'x-portal-token': token,
      },
    }
  );

  if (!response.data.data) {
    throw new Error('Failed to fetch portal types');
  }

  return response.data.data;
};

/**
 * Ingest a new record via the portal (Field Agent)
 */
export const ingestPortalRecord = async (
  projectKey: string,
  token: string,
  payload: { typeId: string; data: any; externalId?: string }
): Promise<any> => {
  const response = await post<APIResponse<any>>(
    `/portal/${projectKey}/records`,
    payload,
    {
      headers: {
        'x-portal-token': token,
      },
    }
  );

  if (!response.data.data) {
    throw new Error('Failed to ingest record');
  }

  return response.data.data;
};

export const portalService = {
  getPortalContext,
  listPortalRecords,
  getPortalRecord,
  listPortalTypes,
  ingestPortalRecord,
};

export default portalService;
