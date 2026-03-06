import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as orgService from '@/services/organization.service';

const ORG_KEYS = {
  all: ['organizations', 'my'] as const,
  members: (orgId: string) => ['organizations', orgId, 'members'] as const,
};

export function useOrganizations() {
  return useQuery({
    queryKey: ORG_KEYS.all,
    queryFn: orgService.getMyOrganizations,
    staleTime: 1000 * 60 * 5, // 5 min
  });
}

export function useOrgMembers(orgId: string | null) {
  return useQuery({
    queryKey: ORG_KEYS.members(orgId ?? ''),
    queryFn: () => {
      if (!orgId) throw new Error('Organization ID is required');
      return orgService.getOrgMembers(orgId);
    },
    enabled: !!orgId,
  });
}

export function useInviteMember(orgId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      email: string;
      role: 'admin' | 'member' | 'guest';
    }) => orgService.inviteMember(orgId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ORG_KEYS.members(orgId) });
    },
  });
}
