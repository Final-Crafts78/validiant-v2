import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as automationService from '@/services/automation.service';
import { queryKeys } from '@/lib/query-keys';

export function useAutomations(orgId: string) {
  return useQuery({
    queryKey: ['automations', orgId],
    queryFn: () => automationService.listAutomations(orgId),
    enabled: !!orgId,
  });
}

export function useCreateAutomation(orgId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<automationService.AutomationRule>) =>
      automationService.createAutomation(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['automations', orgId] });
    },
  });
}

export function useUpdateAutomation(orgId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Partial<automationService.AutomationRule>;
    }) => automationService.updateAutomation(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['automations', orgId] });
    },
  });
}

export function useDeleteAutomation(orgId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => automationService.deleteAutomation(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['automations', orgId] });
    },
  });
}
