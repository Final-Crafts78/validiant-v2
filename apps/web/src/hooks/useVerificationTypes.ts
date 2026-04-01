import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { verificationApi } from '../lib/api';
import toast from 'react-hot-toast';

export function useVerificationTypes(orgId: string) {
  return useQuery({
    queryKey: ['verificationTypes', orgId],
    queryFn: async () => {
      const res = await verificationApi.getAll(orgId);
      return res.data?.data?.types ?? [];
    },
    enabled: !!orgId,
  });
}

export function useSaveVerificationType(orgId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id?: string; data: any }) => {
      if (id) {
        return verificationApi.update(orgId, id, data);
      }
      return verificationApi.create(orgId, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['verificationTypes', orgId] });
      toast.success('Schema saved successfully');
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Failed to save schema');
    },
  });
}
