import { get, post, put, patch, del } from '@/lib/api';
import { API_CONFIG } from '@/lib/config';
import type { APIResponse } from '@/lib/api';

export interface Organization {
  id: string;
  name: string;
  slug: string;
  description?: string;
  website?: string;
  industry?: string;
  logoUrl?: string;
  settings: Record<string, unknown>;
  role?: string; // caller's role in this org
  memberCount?: number;
  projectCount?: number;
  
  // Phase 6: Billing
  plan?: 'free' | 'pro' | 'enterprise';
  subscriptionStatus?: string;
  planExpiresAt?: string;
}

export interface OrgMember {
  id: string;
  role: string; // 'owner' | 'admin' | 'member' | 'guest' or custom role key
  user: {
    id: string;
    email: string;
    fullName: string;
    avatarUrl?: string;
  };
}

export const getMyOrganizations = async (): Promise<Organization[]> => {
  return get<APIResponse<{ organizations: Organization[] }>>(
    API_CONFIG.ENDPOINTS.ORGANIZATIONS.MY
  ).then((res) => res.data.data?.organizations ?? []);
};

export const getOrgMembers = async (orgId: string): Promise<OrgMember[]> => {
  return get<APIResponse<{ members: OrgMember[] }>>(
    `/organizations/${orgId}/members`
  ).then((res) => res.data.data?.members ?? []);
};

export const getOrganization = async (id: string): Promise<Organization> => {
  const res = await get<APIResponse<{ organization: Organization }>>(
    `/organizations/${id}`
  );
  if (!res.data.data?.organization) throw new Error('Organization not found');
  return res.data.data.organization;
};

export const getOrganizationBySlug = async (
  slug: string
): Promise<Organization> => {
  const res = await get<APIResponse<{ organization: Organization }>>(
    `/organizations/slug/${slug}`
  );
  if (!res.data.data?.organization) throw new Error('Organization not found');
  return res.data.data.organization;
};

export const inviteMember = async (
  orgId: string,
  payload: { email: string; role: string }
): Promise<void> => {
  return post(API_CONFIG.ENDPOINTS.ORGANIZATIONS.INVITES(orgId), payload).then(
    () => undefined
  );
};

export const updateOrganization = async (
  orgId: string,
  payload: Partial<Organization>
): Promise<Organization> => {
  const res = await put<APIResponse<{ organization: Organization }>>(
    `/organizations/${orgId}`,
    payload
  );
  if (!res.data.data?.organization) throw new Error('Update failed');
  return res.data.data.organization;
};

export interface OrgInvite {
  id: string;
  email: string;
  role: string;
  token: string;
  expiresAt: string;
  createdAt: string;
}

export const getOrgInvitations = async (
  orgId: string
): Promise<OrgInvite[]> => {
  return get<APIResponse<{ invitations: OrgInvite[] }>>(
    `/organizations/${orgId}/invitations`
  ).then((res) => res.data.data?.invitations ?? []);
};

export const deleteInvitation = async (
  orgId: string,
  inviteId: string
): Promise<void> => {
  const { del } = await import('@/lib/api');
  return del(`/organizations/${orgId}/invitations/${inviteId}`).then(
    () => undefined
  );
};

export interface CustomRole {
  id: string;
  name: string;
  key: string;
  description?: string;
  inheritsFrom?: string;
  permissions: string[];
  isDefault: boolean;
  createdAt: string;
}

export const getOrganizationRoles = async (
  orgId: string
): Promise<CustomRole[]> => {
  return get<APIResponse<{ roles: CustomRole[] }>>(
    `/organizations/${orgId}/roles`
  ).then((res) => res.data.data?.roles ?? []);
};

export const createCustomRole = async (
  orgId: string,
  payload: Partial<CustomRole>
): Promise<CustomRole> => {
  const res = await post<APIResponse<{ role: CustomRole }>>(
    `/organizations/${orgId}/roles`,
    payload
  );
  if (!res.data.data?.role) throw new Error('Creation failed');
  return res.data.data.role;
};

export const updateCustomRole = async (
  orgId: string,
  roleId: string,
  payload: Partial<CustomRole>
): Promise<CustomRole> => {
  const res = await patch<APIResponse<{ role: CustomRole }>>(
    `/organizations/${orgId}/roles/${roleId}`,
    payload
  );
  if (!res.data.data?.role) throw new Error('Update failed');
  return res.data.data.role;
};

export const deleteCustomRole = async (
  orgId: string,
  roleId: string
): Promise<void> => {
  await del(`/organizations/${orgId}/roles/${roleId}`);
};

export const acceptInvite = async (
  token: string
): Promise<{
  organizationId: string;
  organizationName: string;
  role: string;
}> => {
  const res = await post<
    APIResponse<{
      organizationId: string;
      organizationName: string;
      role: string;
    }>
  >(API_CONFIG.ENDPOINTS.ORGANIZATIONS.ACCEPT_INVITE, { token });
  if (!res.data.data)
    throw new Error(res.data.message || 'Failed to accept invite');
  return res.data.data;
};

export const createCheckoutSession = async (
  orgId: string,
  plan: 'pro' | 'enterprise',
  successUrl: string,
  cancelUrl: string
): Promise<{ url: string }> => {
  const res = await post<APIResponse<{ url: string }>>('/billing/checkout', {
    orgId,
    plan,
    successUrl,
    cancelUrl,
  });
  if (!res.data.data?.url) throw new Error('Failed to create checkout session');
  return res.data.data;
};
