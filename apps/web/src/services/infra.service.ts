import { get, post } from '@/lib/api';
import type { APIResponse } from '@/lib/api';

export interface BackupRecord {
  key: string;
  size: number;
  uploadedAt: string;
  metadata?: Record<string, string>;
}

export interface SystemHealth {
  status: string;
  api: string;
  database: string;
  storage: string;
  worker: string;
}

export const listBackups = async (): Promise<BackupRecord[]> => {
  const res = await get<APIResponse<BackupRecord[]>>('/backups');
  return res.data.data ?? [];
};

export const triggerBackup = async (): Promise<{
  success: boolean;
  message?: string;
}> => {
  const res = await post<
    APIResponse<{
      success: boolean;
      message?: string;
    }>
  >('/backups/trigger', {});
  return res.data.data ?? { success: true };
};

export const getSystemHealth = async (): Promise<SystemHealth> => {
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
