'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { organizationsApi } from '@/lib/api';
import { AlertTriangle, Trash2, X } from 'lucide-react';

interface DeleteOrganizationModalProps {
  open: boolean;
  onClose: () => void;
  organizationId: string;
  organizationName: string;
}

export function DeleteOrganizationModal({
  open,
  onClose,
  organizationId,
  organizationName,
}: DeleteOrganizationModalProps) {
  const [confirmText, setConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');
  const queryClient = useQueryClient();

  if (!open) return null;

  const canDelete = confirmText === organizationName;

  const handleDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canDelete) return;

    setIsDeleting(true);
    setError('');

    try {
      await organizationsApi.delete(organizationId);
      // Invalidate to refresh the list
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else if (typeof err === 'object' && err !== null && 'message' in err) {
        setError((err as { message: string }).message);
      } else {
        setError('Failed to delete organization');
      }
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-red-50/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-red-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">
              Delete Organization
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleDelete} className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              This action <strong>cannot be undone</strong>. This will
              permanently delete the{' '}
              <strong className="text-gray-900">{organizationName}</strong>{' '}
              organization, along with all its projects, tasks, and member
              associations.
            </p>

            <div>
              <label
                htmlFor="confirmText"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Please type <strong>{organizationName}</strong> to confirm.
              </label>
              <input
                id="confirmText"
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                required
                className="input w-full border-red-200 focus:border-red-500 focus:ring-red-500"
                placeholder={organizationName}
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-outline"
              disabled={isDeleting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn bg-red-600 hover:bg-red-700 text-white border-transparent"
              disabled={isDeleting || !canDelete}
            >
              {isDeleting ? (
                <span className="loading loading-spinner loading-sm"></span>
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
              <span>Delete Organization</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
