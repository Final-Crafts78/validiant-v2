/**
 * User Service
 *
 * Client-side service for user management and preferences.
 */

import { patch, get, APIResponse } from '@/lib/api';
import type { User, UserPreferences } from '@validiant/shared';

export const userService = {
  /**
   * Get current user profile
   */
  getMe: async () => {
    const response = await get<APIResponse<User>>('/users/me');
    return response.data;
  },

  /**
   * Update current user preferences
   * Uses PATCH for partial updates (shallow merge handled on server)
   */
  updatePreferences: async (preferences: Partial<UserPreferences>) => {
    const response = await patch<APIResponse<User>>(
      '/users/me/preferences',
      preferences
    );
    return response.data;
  },
};
