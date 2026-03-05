'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { CreateTaskModal } from './CreateTaskModal';

interface CreateTaskModalTriggerProps {
  defaultProjectId?: string;
  className?: string;
  label?: string;
}

export function CreateTaskModalTrigger({
  defaultProjectId,
  className,
  label = 'New Task',
}: CreateTaskModalTriggerProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={
          className ||
          'inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shrink-0'
        }
      >
        <Plus className="h-4 w-4" />
        <span>{label}</span>
      </button>

      <CreateTaskModal
        open={open}
        onClose={() => setOpen(false)}
        defaultProjectId={defaultProjectId}
      />
    </>
  );
}
