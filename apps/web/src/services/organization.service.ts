import { get, post } from '@/lib/api';
import { API_CONFIG } from '@/lib/config';
import type { APIResponse } from '@/lib/api';

export interface Organization {
  id: string;
  name: string;
  slug?: string;
  industry?: string;
  logoUrl?: string;
  role?: string; // caller's role in this org
}

export interface OrgMember {
  id: string;
  userId: string;
  role: 'owner' | 'admin' | 'member' | 'guest';
  joinedAt: string;
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

export const inviteMember = async (
  orgId: string,
  payload: { email: string; role: 'admin' | 'member' | 'guest' }
): Promise<void> => {
  return post(API_CONFIG.ENDPOINTS.ORGANIZATIONS.INVITES(orgId), payload).then(
    () => undefined
  );
};
