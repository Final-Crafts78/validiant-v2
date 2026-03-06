'use client';
import { useState } from 'react';
import { useOrgMembers } from '@/hooks/useOrganizations';
import { useWorkspaceStore } from '@/store/workspace';
import { post } from '@/lib/api';
import { useQueryClient } from '@tanstack/react-query';

export function AssignTaskModal({
  taskId,
  onClose,
}: {
  taskId: string;
  onClose: () => void;
}) {
  const activeOrgId = useWorkspaceStore((s) => s.activeOrgId);
  const activeProjectId = useWorkspaceStore((s) => s.activeProjectId);
  const { data: members = [] } = useOrgMembers(activeOrgId);
  const [assigning, setAssigning] = useState(false);
  const qc = useQueryClient();

  const handleAssign = async (userId: string) => {
    setAssigning(true);
    try {
      await post(`/tasks/${taskId}/assign`, { userId });
      qc.invalidateQueries({ queryKey: ['tasks', 'project', activeProjectId] });
      onClose();
    } finally {
      setAssigning(false);
    }
  };

  return (
    <div className="absolute z-20 bg-white border border-slate-200 rounded-xl shadow-lg p-3 min-w-[220px]">
      <p className="text-xs font-semibold text-slate-500 mb-2 px-1">
        Assign to
      </p>
      <ul>
        {members.map((m) => (
          <li key={m.userId}>
            <button
              type="button"
              onClick={() => handleAssign(m.userId)}
              disabled={assigning}
              className="w-full text-left px-2 py-2 text-sm hover:bg-slate-50 rounded-lg flex items-center gap-2"
            >
              <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center">
                {m.user.fullName.charAt(0)}
              </div>
              <span>{m.user.fullName}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
