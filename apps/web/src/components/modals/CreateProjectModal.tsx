'use client';

import { useState } from 'react';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { projectsApi, organizationsApi } from '@/lib/api';
import { FolderKanban, Plus, X } from 'lucide-react';
import type { Organization } from '@validiant/shared';

interface CreateProjectModalProps {
  open: boolean;
  onClose: () => void;
  // If we wanted to default to a specific organization we could pass it here,
  // but let's let the user select their organization
  defaultOrganizationId?: string;
}

function CreateProjectModal({
  open,
  onClose,
  defaultOrganizationId,
}: CreateProjectModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [organizationId, setOrganizationId] = useState(
    defaultOrganizationId || ''
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const queryClient = useQueryClient();

  // Fetch user's organizations to populate the dropdown
  const { data: orgResponse } = useQuery({
    queryKey: ['organizations', 'my'],
    queryFn: () => organizationsApi.getAll(),
    enabled: open, // Only fetch when modal opens
  });

  const organizations = (orgResponse?.data?.data?.organizations ||
    []) as unknown as Organization[];

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organizationId) {
      setError('Please select an organization');
      return;
    }

    setError('');
    setIsSubmitting(true);

    try {
      const projectKey =
        name
          .substring(0, 3)
          .toUpperCase()
          .replace(/[^A-Z]/g, 'X') + Math.floor(100 + Math.random() * 900);

      await projectsApi.create({
        name,
        key: projectKey,
        description,
        organizationId,
      });
      // Invalidate the projects query to trigger a refetch
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      // Reset form
      setName('');
      setDescription('');
      if (!defaultOrganizationId) setOrganizationId('');
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else if (typeof err === 'object' && err !== null && 'message' in err) {
        setError((err as { message: string }).message);
      } else {
        setError('Failed to create project');
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
              <FolderKanban className="w-4 h-4 text-primary-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">
              Create Project
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
                htmlFor="organizationId"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Organization <span className="text-red-500">*</span>
              </label>
              <select
                id="organizationId"
                value={organizationId}
                onChange={(e) => setOrganizationId(e.target.value)}
                required
                disabled={!!defaultOrganizationId}
                className="input w-full bg-white"
              >
                <option value="" disabled>
                  Select an organization
                </option>
                {organizations.map((org: Organization) => (
                  <option key={org.id} value={org.id}>
                    {org.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Project Name <span className="text-red-500">*</span>
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="input w-full"
                placeholder="e.g. Website Redesign"
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
                placeholder="What is this project about?"
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
              disabled={isSubmitting || !name.trim() || !organizationId}
            >
              {isSubmitting ? (
                <span className="loading loading-spinner loading-sm"></span>
              ) : (
                <Plus className="w-4 h-4" />
              )}
              <span>Create Project</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
interface CreateProjectModalTriggerProps {
  defaultOrganizationId?: string;
  className?: string;
}

export function CreateProjectModalTrigger({
  defaultOrganizationId,
  className,
}: CreateProjectModalTriggerProps) {
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
        <span>New Project</span>
      </button>

      <CreateProjectModal
        open={open}
        onClose={() => setOpen(false)}
        defaultOrganizationId={defaultOrganizationId}
      />
    </>
  );
}
