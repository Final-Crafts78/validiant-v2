/**
 * useUserPreferences Hook
 *
 * Manages user UI preferences with server-side persistence and optimistic updates.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { userService } from '@/services/user.service';
import { useAuthStore } from '@/store/auth';
import type { UserPreferences } from '@validiant/shared';

export function useUserPreferences() {
  const queryClient = useQueryClient();
  const { user, updateUser } = useAuthStore();

  const updatePreferencesMutation = useMutation({
    mutationFn: (preferences: Partial<UserPreferences>) =>
      userService.updatePreferences(preferences),
    onMutate: async (newPrefs) => {
      // Optimistic update in AuthStore
      if (user) {
        const updatedPrefs = {
          ...(user.preferences || {}),
          ...newPrefs,
        } as UserPreferences;
        updateUser({ preferences: updatedPrefs });
      }
    },
    onSuccess: (data) => {
      // Sync store with actual server response
      if (data?.data) {
        updateUser({ preferences: data.data.preferences as UserPreferences });
      }
      // Invalidate queries that might depend on user data
      queryClient.invalidateQueries({ queryKey: ['users', 'me'] });
    },
    onError: (error) => {
      console.error('[Preferences] Update failed:', error);
      // Rollback would happen if we re-fetched user,
      // but for UI polish we might just leave it or show error
    },
  });

  return {
    preferences: (user?.preferences || {}) as UserPreferences,
    updatePreferences: updatePreferencesMutation.mutate,
    isUpdating: updatePreferencesMutation.isPending,
  };
}
