import { useQuery } from '@tanstack/react-query';
import * as activityService from '@/services/activity.service';

export function useActivityLogs(params: {
  orgId: string;
  entityId?: string;
  entityType?: string;
  page?: number;
  limit?: number;
}) {
  return useQuery({
    queryKey: ['activity-logs', params.orgId, params.entityId, params.entityType, params.page, params.limit],
    queryFn: () => activityService.getAuditLogs(params),
    enabled: !!params.orgId,
  });
}
