import { useQuery } from '@tanstack/react-query';
import { portalService, PortalContext } from '@/services/portal.service';

/**
 * Hook for fetching the portal context (account and accessible projects).
 */
export function usePortalContext(token: string) {
  return useQuery({
    queryKey: ['portal', 'context', token],
    queryFn: () => portalService.getPortalContext(token),
    enabled: !!token,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Hook for fetching records in a portal session.
 * 
 * @param projectKey The project's public key (e.g., PJ-M001)
 * @param token The portal magic-link token
 */
export function usePortalRecords(projectKey: string, token: string) {
  const query = useQuery<PortalContext>({
    queryKey: ['portal', projectKey, 'records', token],
    queryFn: () => portalService.listPortalRecords(projectKey, token),
    enabled: !!projectKey && !!token,
    staleTime: 1000 * 30, // 30 seconds
  });

  return {
    ...query,
    records: query.data?.records ?? [],
    project: query.data?.project,
    account: query.data?.account,
  };
}

/**
 * Hook for fetching a single record detail in a portal session.
 */
export function usePortalRecord(projectKey: string, token: string, recordNumber: number) {
  const query = useQuery({
    queryKey: ['portal', projectKey, 'records', recordNumber, token],
    queryFn: () => portalService.getPortalRecord(projectKey, recordNumber, token),
    enabled: !!projectKey && !!token && !!recordNumber,
    staleTime: 1000 * 60, // 1 minute
  });

  return {
    ...query,
    record: query.data?.record,
    project: query.data?.project,
  };
}

/**
 * Hook for fetching record archetypes (types + columns) in a portal session.
 */
export function usePortalTypes(projectKey: string, token: string) {
  const query = useQuery({
    queryKey: ['portal', projectKey, 'types', token],
    queryFn: () => portalService.listPortalTypes(projectKey, token),
    enabled: !!projectKey && !!token,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  return {
    ...query,
    types: query.data?.types ?? [],
    project: query.data?.project,
  };
}
