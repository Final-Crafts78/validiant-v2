'use client';

import React, { useState } from 'react';
import { X, MessageSquare, ShieldX } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Task } from '@/hooks/useTasks';

interface RejectionReason {
  id: string;
  label: string;
  requiresNote?: boolean;
}

interface RejectionModalProps {
  task: Task;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (payload: {
    reasonId: string;
    reasonLabel: string;
    note: string;
  }) => void;
  isPending?: boolean;
}

export const RejectionModal: React.FC<RejectionModalProps> = ({
  task,
  isOpen,
  onClose,
  onConfirm,
  isPending,
}) => {
  // Default rejection reasons (will be overridden by orgSettings in a real scenario)
  const defaultReasons: RejectionReason[] = [
    { id: 'missing_documents', label: 'Missing Documents' },
    { id: 'invalid_information', label: 'Invalid Information' },
    { id: 'poor_image_quality', label: 'Poor Image Quality' },
    { id: 'failed_verification', label: 'Failed Physical Verification' },
    { id: 'other', label: 'Other', requiresNote: true },
  ];

  // Map orgSettings rejection reasons if they exist
  const orgSettings = (task.project as any)?.organization?.settings || {};
  const reasons: RejectionReason[] =
    orgSettings.rejectionReasons || defaultReasons;
  const allowFreeformRejection = orgSettings.allowFreeformRejection ?? true;

  const [selectedReasonId, setSelectedReasonId] = useState<string>('');
  const [note, setNote] = useState<string>('');

  if (!isOpen) return null;

  const selectedReason = reasons.find((r) => r.id === selectedReasonId);
  const isSubmitDisabled =
    !selectedReasonId ||
    (selectedReason?.requiresNote && !note.trim()) ||
    isPending;

  const handleConfirm = () => {
    if (!selectedReason) return;
    onConfirm({
      reasonId: selectedReason.id,
      reasonLabel: selectedReason.label,
      note,
    });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
        <div className="p-8 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-rose-500/10 text-rose-500">
                <ShieldX className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Reject Verification</h2>
                <p className="text-xs text-muted-foreground">
                  Select a reason for rejecting Case {task.id}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 px-1">
              Rejection Reason
            </label>
            <div className="grid grid-cols-1 gap-2">
              {reasons.map((reason) => (
                <button
                  key={reason.id}
                  onClick={() => setSelectedReasonId(reason.id)}
                  className={cn(
                    'flex items-center justify-between p-4 rounded-2xl border transition-all text-left',
                    selectedReasonId === reason.id
                      ? 'bg-rose-50 border-rose-200 text-rose-900'
                      : 'bg-white hover:bg-gray-50 border-gray-100'
                  )}
                >
                  <span className="text-sm font-semibold">{reason.label}</span>
                  <div
                    className={cn(
                      'w-5 h-5 rounded-full border-2 flex items-center justify-center',
                      selectedReasonId === reason.id
                        ? 'border-rose-500 bg-rose-500'
                        : 'border-gray-200'
                    )}
                  >
                    {selectedReasonId === reason.id && (
                      <div className="w-1.5 h-1.5 rounded-full bg-white" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {(selectedReason?.requiresNote || allowFreeformRejection) && (
            <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-500 text-left">
              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 px-1 flex items-center justify-between">
                Additional Notes
                {selectedReason?.requiresNote && (
                  <span className="text-rose-500 lowercase font-medium">
                    Required
                  </span>
                )}
              </label>
              <div className="relative">
                <div className="absolute top-4 left-4 text-gray-400">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Explain exactly what is missing or needs correction..."
                  className="w-full min-h-[120px] p-4 pl-12 bg-gray-50 border-none focus:ring-1 focus:ring-rose-500 rounded-2xl text-sm"
                />
              </div>
            </div>
          )}

          <div className="flex items-center gap-3 pt-4">
            <button
              onClick={onClose}
              className="flex-1 py-4 px-6 rounded-2xl font-bold text-sm text-gray-500 hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
            <button
              disabled={isSubmitDisabled}
              onClick={handleConfirm}
              className={cn(
                'flex-[2] py-4 px-6 rounded-2xl font-bold text-sm text-white transition-all shadow-lg',
                isSubmitDisabled
                  ? 'bg-gray-200 shadow-none'
                  : 'bg-rose-500 hover:bg-rose-600 shadow-rose-500/20 active:scale-95'
              )}
            >
              {isPending ? 'Rejecting...' : 'Confirm Rejection'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
