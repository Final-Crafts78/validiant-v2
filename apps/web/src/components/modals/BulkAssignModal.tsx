'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { organizationsApi } from '@/lib/api';
import { useBulkAssignTasks } from '@/hooks/useTasks';
import { X, Users, Loader2, Check } from 'lucide-react';
import { logger } from '@/lib/logger';

interface BulkAssignModalProps {
  open: boolean;
  onClose: () => void;
  selectedTaskIds: string[];
  projectId: string;
  orgId: string;
  onSuccess?: () => void;
}

export function BulkAssignModal({
  open,
  onClose,
  selectedTaskIds,
  projectId,
  orgId,
  onSuccess,
}: BulkAssignModalProps) {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const { data: membersResponse, isLoading: isLoadingMembers } = useQuery({
    queryKey: ['organization', orgId, 'members'],
    queryFn: () => organizationsApi.getMembers(orgId),
    enabled: open && !!orgId,
  });

  const members = membersResponse?.data?.data?.members || [];

  const mutation = useBulkAssignTasks();

  const handleConfirm = () => {
    if (!selectedUserId) return;

    mutation.mutate(
      {
        projectId,
        taskIds: selectedTaskIds,
        userId: selectedUserId,
      },
      {
        onSuccess: () => {
          logger.info('[MassAssign:Commit]', {
            taskCount: selectedTaskIds.length,
            assigneeId: selectedUserId,
          });
          onSuccess?.();
          onClose();
        },
      }
    );
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col border border-slate-200">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
              <Users className="w-4 h-4 text-indigo-600" />
            </div>
            <h2 className="text-lg font-bold text-slate-800">Assign Tasks</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
          <p className="text-sm text-slate-500">
            Select a field executive to assign to the{' '}
            <span className="font-bold text-slate-800">
              {selectedTaskIds.length}
            </span>{' '}
            selected tasks.
          </p>

          {isLoadingMembers ? (
            <div className="py-10 flex flex-col items-center justify-center text-indigo-500 gap-2">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span className="text-xs font-medium">
                Loading organization members...
              </span>
            </div>
          ) : (
            <div className="space-y-2">
              {members.map((member: any) => (
                <button
                  key={member.user.id}
                  onClick={() => setSelectedUserId(member.user.id)}
                  className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${
                    selectedUserId === member.user.id
                      ? 'bg-indigo-50 border-indigo-200'
                      : 'bg-white border-slate-100 hover:border-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600 border border-slate-200 uppercase">
                      {member.user.fullName.charAt(0)}
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-bold text-slate-800">
                        {member.user.fullName}
                      </p>
                      <p className="text-[10px] text-slate-400 uppercase font-bold tracking-tight">
                        {member.role}
                      </p>
                    </div>
                  </div>
                  {selectedUserId === member.user.id && (
                    <div className="w-5 h-5 rounded-full bg-indigo-600 flex items-center justify-center">
                      <Check className="w-3 h-3 text-[var(--color-text-base)]" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
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
            disabled={mutation.isPending || !selectedUserId}
            className="inline-flex items-center gap-2 px-6 py-2 text-sm font-bold bg-indigo-600 text-[var(--color-text-base)] rounded-lg hover:bg-indigo-700 transition-all shadow-md active:scale-95 disabled:opacity-50"
          >
            {mutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              'Confirm Assignment'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
