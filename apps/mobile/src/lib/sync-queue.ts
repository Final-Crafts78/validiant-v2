import { storage } from './mmkv';
import api from './api';
import * as Haptics from 'expo-haptics';

export interface SyncQueueItem {
  id: string;
  caseId: string;
  type: 'CASE_SUBMISSION';
  payload: any;
  files: Array<{
    fieldId: string;
    uri: string;
    type: string;
    name: string;
    hash: string;
  }>;
  timestamp: number;
}

const SYNC_QUEUE_KEY = 'validiant_sync_queue';

/**
 * Mobile Sync Queue Service
 *
 * Manages offline submissions using MMKV.
 * Automatically flushes when network returns.
 */
class SyncQueueService {
  private isProcessing = false;

  getQueue(): SyncQueueItem[] {
    const raw = storage.getString(SYNC_QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  }

  private saveQueue(queue: SyncQueueItem[]) {
    storage.set(SYNC_QUEUE_KEY, JSON.stringify(queue));
  }

  async enqueue(item: SyncQueueItem) {
    const queue = this.getQueue();
    queue.push(item);
    this.saveQueue(queue);

    // Attempt processing if online (race condition protection)
    this.processQueue();
  }

  getQueueLength(): number {
    return this.getQueue().length;
  }

  async processQueue(onProgress?: (current: number, total: number) => void) {
    if (this.isProcessing) return;

    const queue = this.getQueue();
    if (queue.length === 0) return;

    this.isProcessing = true;
    const total = queue.length;
    let processed = 0;

    console.log(`[SyncQueue] Processing ${total} items...`);

    const remainingItems: SyncQueueItem[] = [...queue];

    for (const item of queue) {
      try {
        onProgress?.(processed + 1, total);

        // 1. Handle file uploads if any
        const uploadedFiles: Record<string, string> = {};

        for (const file of item.files) {
          // Obtain presigned URL
          const { data: presignedData } = await api.post('/storage/presign', {
            fileName: file.name,
            contentType: file.type,
            caseId: item.caseId,
            hash: file.hash,
          });

          const { uploadUrl, key } = presignedData.data;

          // Perform native upload (using fetch for blob support in RN)
          const blob = await fetch(file.uri).then((r) => r.blob());
          await fetch(uploadUrl, {
            method: 'PUT',
            body: blob,
            headers: { 'Content-Type': file.type },
          });

          uploadedFiles[file.fieldId] = key;
        }

        // 2. Submit the case data with uploaded storage keys
        const finalPayload = {
          ...item.payload,
          ...uploadedFiles,
        };

        await api.post(`/cases/${item.caseId}/submit`, finalPayload);

        // 3. Remove from queue
        remainingItems.shift();
        this.saveQueue(remainingItems);

        processed++;
        console.log(`[SyncQueue] Successfully synced item ${item.id}`);
      } catch (error) {
        console.error(`[SyncQueue] Failed to sync item ${item.id}:`, error);
        // Stop processing loop on first error to maintain order
        break;
      }
    }

    this.isProcessing = false;

    if (processed > 0) {
      // Success feedback
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }

  async clearQueue() {
    this.saveQueue([]);
  }
}

export const syncQueue = new SyncQueueService();
