'use client';

import React, { useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  Clock,
  PauseCircle,
  Play,
  AlertCircle,
  ChevronRight,
  Loader2,
  FileWarning,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Task } from '@/hooks/useTasks';
import { useRBAC } from '@/hooks/useRBAC';
import { getValidTransitions, StatusTransition } from '@validiant/shared';
import { useUpdateTask } from '@/hooks/useTasks';
import { toast } from 'sonner';
import { RejectionModal } from './RejectionModal';

interface FieldSchema {
  key: string;
  label: string;
  required?: boolean;
}

interface ActionPanelProps {
  task: Task;
}

export const ActionPanel: React.FC<ActionPanelProps> = ({ task }) => {
  const { mutate: updateTask, isPending } = useUpdateTask();
  const { orgRole, projectRole } = useRBAC(
    task.project?.organizationId,
    task.projectId
  );

  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isRejectionModalOpen, setIsRejectionModalOpen] = useState(false);

  // Get valid transitions based on shared logic
  const transitions = getValidTransitions(
    task.status,
    (task.project as any)?.organization?.settings || {},
    projectRole || orgRole || 'member'
  );

  const validateTransition = (targetStatus: string): boolean => {
    if (targetStatus === 'PENDING_REVIEW') {
      const fieldSchema =
        (task.verificationType?.fieldSchema as unknown as FieldSchema[]) || [];
      const values = (task as any).customFields || {};
      const missingFields = fieldSchema
        .filter((f) => f.required && !values[f.key])
        .map((f) => f.label);

      if (missingFields.length > 0) {
        setValidationErrors(missingFields);
        return false;
      }
    }
    setValidationErrors([]);
    return true;
  };

  const handleTransition = (transition: StatusTransition) => {
    if (transition.key === 'REJECTED') {
      setIsRejectionModalOpen(true);
      return;
    }

    if (!validateTransition(transition.key)) {
      toast.error('Cannot submit for review: Missing required fields');
      return;
    }

    updateTask(
      {
        taskId: task.id,
        projectId: task.projectId,
        data: { status: transition.key as any },
      },
      {
        onSuccess: () => {
          toast.success(`Status updated to ${transition.label}`);
        },
        onError: (err: any) => {
          toast.error(`Transition failed: ${err.message}`);
        },
      }
    );
  };

  const handleRejectionConfirm = (payload: {
    reasonId: string;
    reasonLabel: string;
    note: string;
  }) => {
    updateTask(
      {
        taskId: task.id,
        projectId: task.projectId,
        data: {
          status: 'REJECTED' as any,
          customFields: {
            ...((task as any).customFields || {}),
            rejection: payload,
          },
        },
      },
      {
        onSuccess: () => {
          setIsRejectionModalOpen(false);
          toast.success('Case rejected successfully');
        },
        onError: (err: any) => {
          toast.error(`Rejection failed: ${err.message}`);
        },
      }
    );
  };

  if (transitions.length === 0) {
    return (
      <div className="p-6 rounded-[2rem] border bg-gray-50 flex flex-col items-center justify-center text-center space-y-2">
        <Clock className="w-8 h-8 opacity-20" />
        <p className="text-xs font-semibold opacity-40 uppercase tracking-widest text-left">
          No actions available
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 mb-4 px-2 text-left">
        Workflow Actions
      </h3>

      {validationErrors.length > 0 && (
        <div className="p-4 rounded-2xl bg-rose-500/5 border border-rose-500/10 mb-4 animate-in slide-in-from-top-2 text-left">
          <div className="flex items-center gap-2 text-rose-500 mb-2">
            <FileWarning className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-wider">
              Missing Required Data
            </span>
          </div>
          <ul className="space-y-1">
            {validationErrors.map((field) => (
              <li
                key={field}
                className="text-[10px] text-rose-600/70 font-medium flex items-center gap-1.5"
              >
                <div className="w-1 h-1 rounded-full bg-rose-500" />
                {field}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid grid-cols-1 gap-2">
        {transitions.map((t: StatusTransition) => {
          const isPrimary =
            t.key === 'VERIFIED' ||
            t.key === 'PENDING_REVIEW' ||
            t.key === 'IN_PROGRESS';

          return (
            <button
              key={t.key}
              disabled={isPending}
              onClick={() => handleTransition(t)}
              className={cn(
                'group relative flex items-center justify-between p-4 rounded-2xl border transition-all duration-300 overflow-hidden text-left',
                isPrimary
                  ? 'bg-primary-600 border-primary-500 text-[var(--color-text-base)] shadow-lg shadow-primary-600/20 hover:scale-[1.02]'
                  : 'bg-white hover:bg-gray-50 text-gray-700'
              )}
            >
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    'p-2 rounded-xl transition-colors',
                    isPrimary
                      ? 'bg-[var(--color-surface-muted)]'
                      : 'bg-gray-100 group-hover:bg-primary-50 group-hover:text-primary-600'
                  )}
                >
                  {t.key === 'VERIFIED' && <CheckCircle2 className="w-4 h-4" />}
                  {t.key === 'REJECTED' && <XCircle className="w-4 h-4" />}
                  {t.key === 'PENDING_REVIEW' && <Clock className="w-4 h-4" />}
                  {t.key === 'ON_HOLD' && <PauseCircle className="w-4 h-4" />}
                  {t.key === 'IN_PROGRESS' && <Play className="w-4 h-4" />}
                  {![
                    'VERIFIED',
                    'REJECTED',
                    'PENDING_REVIEW',
                    'ON_HOLD',
                    'IN_PROGRESS',
                  ].includes(t.key) && <AlertCircle className="w-4 h-4" />}
                </div>
                <div className="flex flex-col items-start translate-y-[1px]">
                  <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">
                    Transition To
                  </span>
                  <span className="text-sm font-bold">{t.label}</span>
                </div>
              </div>

              {isPending ? (
                <Loader2 className="w-4 h-4 animate-spin opacity-50" />
              ) : (
                <ChevronRight
                  className={cn(
                    'w-4 h-4 transition-transform duration-300 group-hover:translate-x-1',
                    isPrimary
                      ? 'text-[var(--color-text-base)]/40'
                      : 'text-gray-300'
                  )}
                />
              )}

              {isPrimary && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:animate-shimmer" />
              )}
            </button>
          );
        })}
      </div>

      <RejectionModal
        task={task}
        isOpen={isRejectionModalOpen}
        isPending={isPending}
        onClose={() => setIsRejectionModalOpen(false)}
        onConfirm={handleRejectionConfirm}
      />
    </div>
  );
};
