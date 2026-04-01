import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as partnerService from '@/services/partner.service';
import toast from 'react-hot-toast';

export function usePartners(orgId: string) {
  return useQuery({
    queryKey: ['partners', orgId],
    queryFn: () => partnerService.listPartners(orgId),
    enabled: !!orgId,
  });
}

export function useCreatePartner(orgId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<partnerService.BgvPartner>) =>
      partnerService.createPartner(orgId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['partners', orgId] });
    },
  });
}

export function useUpdatePartner(orgId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Partial<partnerService.BgvPartner>;
    }) => partnerService.updatePartner(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['partners', orgId] });
    },
  });
}

export function useRegenerateToken(orgId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => partnerService.regenerateToken(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['partners', orgId] });
      toast.success('API Token regenerated successfully');
    },
    onError: () => {
      toast.error('Failed to regenerate token');
    },
  });
}
