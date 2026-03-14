import { MMKV } from 'react-native-mmkv';

/**
 * Mobile Cache Layer
 * Uses MMKV for high-performance synchronous storage.
 */
export const storage = new MMKV({
  id: 'validiant-mobile-cache',
});

/**
 * Helper to get/set JSON values
 */
export const cache = {
  set: (key: string, value: any) => {
    storage.set(key, JSON.stringify(value));
  },
  get: <T>(key: string): T | null => {
    const value = storage.getString(key);
    return value ? JSON.parse(value) : null;
  },
  delete: (key: string) => {
    storage.delete(key);
  },
  clearAll: () => {
    storage.clearAll();
  },
};
