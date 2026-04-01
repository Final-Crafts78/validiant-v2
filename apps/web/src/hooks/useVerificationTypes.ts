import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { verificationApi } from '../lib/api';
import toast from 'react-hot-toast';
import { VerificationType } from '@validiant/shared';

export function useVerificationTypes(orgId: string | null) {
  return useQuery<VerificationType[]>({
    queryKey: ['verificationTypes', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const res = await verificationApi.getAll(orgId);
      return res.data?.data?.types ?? [];
    },
    enabled: !!orgId,
  });
}

export function useSaveVerificationType(orgId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id?: string;
      data: Partial<VerificationType>;
    }) => {
      if (!orgId) throw new Error('Organization ID is required');
      if (id) {
        return verificationApi.update(orgId, id, data);
      }
      return verificationApi.create(orgId, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['verificationTypes', orgId] });
      toast.success('Schema saved successfully');
    },
    onError: (err: Error) => {
      toast.error(err?.message || 'Failed to save schema');
    },
  });
}
