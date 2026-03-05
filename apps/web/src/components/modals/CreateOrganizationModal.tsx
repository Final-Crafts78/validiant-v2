'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { organizationsApi } from '@/lib/api';
import { Building2, Plus, X } from 'lucide-react';

interface CreateOrganizationModalProps {
  open: boolean;
  onClose: () => void;
}

function CreateOrganizationModal({
  open,
  onClose,
}: CreateOrganizationModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const queryClient = useQueryClient();

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await organizationsApi.create({ name, description });
      // Invalidate the organizations query to trigger a refetch
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      // Reset form
      setName('');
      setDescription('');
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else if (typeof err === 'object' && err !== null && 'message' in err) {
        setError((err as { message: string }).message);
      } else {
        setError('Failed to create organization');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center">
              <Building2 className="w-4 h-4 text-primary-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">
              Create Organization
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Organization Name <span className="text-red-500">*</span>
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="input w-full"
                placeholder="e.g. Acme Inc."
              />
            </div>

            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Description
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="input w-full min-h-[100px] py-2"
                placeholder="What does your organization do?"
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-outline"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting || !name.trim()}
            >
              {isSubmitting ? (
                <span className="loading loading-spinner loading-sm"></span>
              ) : (
                <Plus className="w-4 h-4" />
              )}
              <span>Create Organization</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
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
