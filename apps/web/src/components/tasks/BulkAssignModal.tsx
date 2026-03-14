/**
 * BulkAssignModal Component
 *
 * Modal for selecting an assignee for multiple tasks.
 */

import React, { useState } from 'react';
import { Modal, Button, Select } from '@validiant/ui';
import { useWorkspaceStore } from '@/store/workspace';
import { useOrgMembers } from '@/hooks/useOrganizations';
import { Loader2, Users } from 'lucide-react';

interface BulkAssignModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (assigneeId: string) => void;
  count: number;
}

export function BulkAssignModal({
  open,
  onClose,
  onConfirm,
  count,
}: BulkAssignModalProps) {
  const [selectedAssignee, setSelectedAssignee] = useState('');
  const activeOrgId = useWorkspaceStore((s) => s.activeOrgId);
  const { data: members, isLoading } = useOrgMembers(activeOrgId);

  const handleConfirm = () => {
    if (selectedAssignee) {
      onConfirm(selectedAssignee);
    }
  };

  // Map org members to select options
  const memberOptions =
    members?.map((m) => ({
      label: m.user.fullName || m.user.email,
      value: m.userId,
    })) || [];

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Bulk Assign Tasks"
      description={`Choose an assignee for ${count} selected ${count === 1 ? 'task' : 'tasks'}.`}
    >
      <div className="space-y-6 pt-4">
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-start gap-3">
          <Users className="h-5 w-5 text-blue-600 mt-0.5" />
          <p className="text-sm text-blue-800">
            Selected tasks will be reassigned to the chosen member.
            Notifications will be sent to the new assignee.
          </p>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">
            New Assignee
          </label>
          {isLoading ? (
            <div className="h-10 border border-slate-200 rounded-lg flex items-center justify-center">
              <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
            </div>
          ) : (
            <Select
              value={selectedAssignee}
              onValueChange={setSelectedAssignee}
              options={memberOptions}
              placeholder="Search or select a member..."
            />
          )}
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleConfirm}
            disabled={!selectedAssignee}
          >
            Assign Tasks
          </Button>
        </div>
      </div>
    </Modal>
  );
}
