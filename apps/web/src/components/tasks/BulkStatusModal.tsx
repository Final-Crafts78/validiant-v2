/**
 * BulkStatusModal Component
 *
 * Modal for changing the status of multiple tasks.
 */

import React, { useState } from 'react';
import { Modal, Button, Select } from '@validiant/ui';
import { TaskStatus, BGV_STATUSES } from '@validiant/shared';
import { AlertCircle } from 'lucide-react';

interface BulkStatusModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (status: TaskStatus) => void;
  count: number;
}

export function BulkStatusModal({
  open,
  onClose,
  onConfirm,
  count,
}: BulkStatusModalProps) {
  const [selectedStatus, setSelectedStatus] = useState<string>('');

  const statusOptions = BGV_STATUSES.map((s) => ({
    label: s.replace(/_/g, ' '),
    value: s,
  }));

  const handleConfirm = () => {
    if (selectedStatus) {
      onConfirm(selectedStatus as TaskStatus);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Bulk Status Update"
      description={`Update the workflow state for ${count} selected ${count === 1 ? 'task' : 'tasks'}.`}
    >
      <div className="space-y-6 pt-4">
        <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
          <p className="text-sm text-amber-800 font-medium">
            Transition Validation
          </p>
          <p className="text-xs text-amber-700 mt-1">
            Status changes are subject to the Transition Matrix. If a task
            cannot legally move to the new status, it will be skipped and
            reported in the summary.
          </p>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">
            New Status
          </label>
          <Select
            value={selectedStatus}
            onValueChange={setSelectedStatus}
            options={statusOptions}
            placeholder="Select workflow state..."
          />
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleConfirm}
            disabled={!selectedStatus}
          >
            Update Status
          </Button>
        </div>
      </div>
    </Modal>
  );
}
