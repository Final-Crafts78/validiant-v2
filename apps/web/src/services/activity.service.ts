import { get } from '@/lib/api';
import type { APIResponse } from '@/lib/api';

export interface ActivityLog {
  id: string;
  organizationId: string;
  userId: string | null;
  action: string;
  entityId: string | null;
  entityType: string | null;
  oldValue: any;
  newValue: any;
  details: string | null;
  deviceType: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  isChainBroken: boolean;
  createdAt: string;
}

export const getAuditLogs = async (params: {
  orgId: string;
  entityId?: string;
  entityType?: string;
  page?: number;
  limit?: number;
}): Promise<ActivityLog[]> => {
  const query = new URLSearchParams();
  if (params.entityId) query.append('entityId', params.entityId);
  if (params.entityType) query.append('entityType', params.entityType);
  if (params.page) query.append('page', params.page.toString());
  if (params.limit) query.append('limit', params.limit.toString());

  return get<APIResponse<ActivityLog[]>>(`/activity?${query.toString()}`).then(
    (res) => res.data.data ?? []
  );
};
