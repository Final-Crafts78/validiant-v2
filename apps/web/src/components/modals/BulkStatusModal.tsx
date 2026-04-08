'use client';

import { useState } from 'react';
import { useBulkUpdateTaskStatus } from '@/hooks/useTasks';
import { X, Settings2, Loader2, Check } from 'lucide-react';
import { logger } from '@/lib/logger';
import { TaskStatus } from '@validiant/shared';

interface BulkStatusModalProps {
  open: boolean;
  onClose: () => void;
  selectedTaskIds: string[];
  projectId: string;
  onSuccess?: () => void;
}

const statuses = [
  { value: TaskStatus.UNASSIGNED, label: 'Unassigned', color: 'bg-slate-400' },
  { value: TaskStatus.PENDING, label: 'Pending', color: 'bg-amber-400' },
  { value: TaskStatus.IN_PROGRESS, label: 'In Progress', color: 'bg-blue-500' },
  { value: TaskStatus.COMPLETED, label: 'Completed', color: 'bg-emerald-500' },
  { value: TaskStatus.VERIFIED, label: 'Verified', color: 'bg-indigo-600' },
];

export function BulkStatusModal({
  open,
  onClose,
  selectedTaskIds,
  projectId,
  onSuccess,
}: BulkStatusModalProps) {
  const [selectedStatus, setSelectedStatus] = useState<TaskStatus | null>(null);
  const mutation = useBulkUpdateTaskStatus();

  const handleConfirm = () => {
    if (selectedStatus) {
      mutation.mutate(
        {
          projectId,
          taskIds: selectedTaskIds,
          status: selectedStatus,
        },
        {
          onSuccess: () => {
            logger.info('[MassStatus:Commit]', {
              taskCount: selectedTaskIds.length,
              newStatus: selectedStatus,
            });
            onSuccess?.();
            onClose();
          },
        }
      );
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col border border-slate-200">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
              <Settings2 className="w-4 h-4 text-amber-600" />
            </div>
            <h2 className="text-lg font-bold text-slate-800">Update Status</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-sm text-slate-500">
            Select a new workflow status for the{' '}
            <span className="font-bold text-slate-800">
              {selectedTaskIds.length}
            </span>{' '}
            selected tasks.
          </p>

          <div className="grid grid-cols-1 gap-2">
            {statuses.map((s) => (
              <button
                key={s.value}
                onClick={() => setSelectedStatus(s.value as TaskStatus)}
                className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${
                  selectedStatus === s.value
                    ? 'bg-indigo-50 border-indigo-200 shadow-sm'
                    : 'bg-white border-slate-100 hover:border-slate-200 hover:bg-slate-50/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${s.color}`} />
                  <span className="text-sm font-bold text-slate-700">
                    {s.label}
                  </span>
                </div>
                {selectedStatus === s.value && (
                  <div className="w-5 h-5 rounded-full bg-indigo-600 flex items-center justify-center shadow-lg">
                    <Check className="w-3 h-3 text-[var(--color-text-base)]" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-bold text-slate-500 hover:text-slate-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!selectedStatus || mutation.isPending}
            className="inline-flex items-center gap-2 px-6 py-2 text-sm font-bold bg-indigo-600 text-[var(--color-text-base)] rounded-lg hover:bg-indigo-700 transition-all shadow-md active:scale-95 disabled:opacity-50"
          >
            {mutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              'Apply Status Change'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
