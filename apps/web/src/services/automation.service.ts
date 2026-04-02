import { get, post, put, del } from '@/lib/api';
import type { APIResponse } from '@/lib/api';

export interface AutomationRule {
  id: string;
  name: string;
  description?: string;
  triggerEvent: string;
  actionType: string;
  config: any;
  isActive: boolean;
  projectId: string;
}

export const listAutomations = async (
  orgId: string
): Promise<AutomationRule[]> =>
  get<APIResponse<{ automations: AutomationRule[] }>>(
    `/automations?orgId=${orgId}`
  ).then((res) => res.data.data?.automations ?? []);

export const createAutomation = async (
  data: Partial<AutomationRule>
): Promise<AutomationRule> =>
  post<APIResponse<{ automation: AutomationRule }>>('/automations', data).then(
    (res) => {
      if (!res.data.data?.automation) throw new Error('Create failed');
      return res.data.data.automation;
    }
  );

export const updateAutomation = async (
  id: string,
  data: Partial<AutomationRule>
): Promise<AutomationRule> =>
  put<APIResponse<{ automation: AutomationRule }>>(
    `/automations/${id}`,
    data
  ).then((res) => {
    if (!res.data.data?.automation) throw new Error('Update failed');
    return res.data.data.automation;
  });

export const deleteAutomation = async (id: string): Promise<void> =>
  del(`/automations/${id}`).then(() => undefined);
