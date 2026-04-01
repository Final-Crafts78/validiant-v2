import { get, post } from '@/lib/api';
import type { APIResponse } from '@/lib/api';

export interface BackupRecord {
  key: string;
  size: number;
  uploadedAt: string;
  metadata?: Record<string, string>;
}

export const listBackups = async (): Promise<BackupRecord[]> => {
  const res = await get<APIResponse<BackupRecord[]>>('/backups');
  return res.data.data ?? [];
};

export const triggerBackup = async (): Promise<any> => {
  const res = await post<APIResponse<any>>('/backups/trigger', {});
  return res.data.data;
};

export const getSystemHealth = async (): Promise<any> => {
  // Placeholder for system health check
  // In a real scenario, this would call a health check endpoint
  return {
    status: 'healthy',
    api: 'online',
    database: 'connected',
    storage: 'connected',
    worker: 'active',
  };
};
