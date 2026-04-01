import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as orgService from '@/services/organization.service';
import { ORG_KEYS } from '@/lib/query-keys';

export function useOrganizations() {
  return useQuery({
    queryKey: ORG_KEYS.lists(),
    queryFn: orgService.getMyOrganizations,
    staleTime: 1000 * 60 * 5, // 5 min
  });
}

export function useOrganization(orgId: string | null) {
  return useQuery({
    queryKey: ORG_KEYS.detail(orgId ?? ''),
    queryFn: () => {
      if (!orgId) throw new Error('Organization ID is required');
      return orgService.getOrganization(orgId);
    },
    enabled: !!orgId,
    staleTime: 1000 * 60 * 5,
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
    mutationFn: (payload: { email: string; role: string }) =>
      orgService.inviteMember(orgId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ORG_KEYS.members(orgId) });
      qc.invalidateQueries({ queryKey: ORG_KEYS.invitations(orgId) });
    },
  });
}

export function useUpdateOrganization(orgId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<orgService.Organization>) =>
      orgService.updateOrganization(orgId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ORG_KEYS.detail(orgId) });
      qc.invalidateQueries({ queryKey: ORG_KEYS.all });
    },
  });
}

export function useOrgInvitations(orgId: string | null) {
  return useQuery({
    queryKey: ORG_KEYS.invitations(orgId ?? ''),
    queryFn: () => {
      if (!orgId) throw new Error('Organization ID is required');
      return orgService.getOrgInvitations(orgId);
    },
    enabled: !!orgId,
  });
}

export function useDeleteInvitation(orgId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (inviteId: string) =>
      orgService.deleteInvitation(orgId, inviteId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ORG_KEYS.invitations(orgId) });
    },
  });
}

export function useOrgRoles(orgId: string | null) {
  return useQuery({
    queryKey: ORG_KEYS.roles(orgId ?? ''),
    queryFn: () => {
      if (!orgId) throw new Error('Organization ID is required');
      return orgService.getOrganizationRoles(orgId);
    },
    enabled: !!orgId,
  });
}

export function useCreateCustomRole(orgId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<orgService.CustomRole>) =>
      orgService.createCustomRole(orgId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ORG_KEYS.roles(orgId) });
    },
  });
}

export function useUpdateCustomRole(orgId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      roleId,
      payload,
    }: {
      roleId: string;
      payload: Partial<orgService.CustomRole>;
    }) => orgService.updateCustomRole(orgId, roleId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ORG_KEYS.roles(orgId) });
    },
  });
}

export function useDeleteCustomRole(orgId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (roleId: string) => orgService.deleteCustomRole(orgId, roleId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ORG_KEYS.roles(orgId) });
    },
  });
}
