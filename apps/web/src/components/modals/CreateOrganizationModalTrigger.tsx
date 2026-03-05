'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { CreateOrganizationModal } from './CreateOrganizationModal';

interface CreateOrganizationModalTriggerProps {
  className?: string;
  variant?: 'primary' | 'outline';
  label?: string;
}

export function CreateOrganizationModalTrigger({
  className,
  variant = 'primary',
  label = 'Create',
}: CreateOrganizationModalTriggerProps) {
  const [open, setOpen] = useState(false);

  const defaultClassName =
    variant === 'primary' ? 'btn btn-primary btn-md' : 'btn btn-outline btn-md';

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={className || defaultClassName}
      >
        <Plus className="h-5 w-5" />
        <span>{label}</span>
      </button>

      <CreateOrganizationModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
