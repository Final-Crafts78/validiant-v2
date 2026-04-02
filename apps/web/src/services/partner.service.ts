import { get, post, patch } from '@/lib/api';
import type { APIResponse } from '@/lib/api';

export interface BgvPartner {
  id: string;
  partnerKey: string;
  name: string;
  logoUrl?: string;
  status: 'active' | 'inactive' | string;
  isActive: boolean;
  inboundApiToken?: string;
  outboundApiKey?: string;
  webhookSigningSecret?: string;
  allowedIps: string[];
  rateLimit: number;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
}

export const listPartners = async (orgId: string): Promise<BgvPartner[]> =>
  get<APIResponse<{ partners: BgvPartner[] }>>(`/partners/${orgId}`).then(
    (res) => res.data.data?.partners ?? []
  );

export const createPartner = async (
  orgId: string,
  data: Partial<BgvPartner>
): Promise<BgvPartner> =>
  post<APIResponse<{ partner: BgvPartner }>>(`/partners/${orgId}`, data).then(
    (res) => {
      if (!res.data.data?.partner) throw new Error('Create failed');
      return res.data.data.partner;
    }
  );

export const updatePartner = async (
  id: string,
  data: Partial<BgvPartner>
): Promise<BgvPartner> =>
  patch<APIResponse<{ partner: BgvPartner }>>(
    `/partners/details/${id}`,
    data
  ).then((res) => {
    if (!res.data.data?.partner) throw new Error('Update failed');
    return res.data.data.partner;
  });

export const regenerateToken = async (id: string): Promise<{ token: string }> =>
  post<APIResponse<{ token: string }>>(
    `/partners/details/${id}/token`,
    {}
  ).then((res) => {
    if (!res.data.data?.token) throw new Error('Regeneration failed');
    return res.data.data;
  });
