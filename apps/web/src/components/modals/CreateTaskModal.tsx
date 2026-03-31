'use client';

import { useState } from 'react';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { tasksApi, projectsApi } from '@/lib/api';
import { CheckSquare, Plus, X } from 'lucide-react';
import type { Project, TaskPriority } from '@validiant/shared';

interface CreateTaskModalProps {
  open: boolean;
  onClose: () => void;
  defaultProjectId?: string;
}

export function CreateTaskModal({
  open,
  onClose,
  defaultProjectId,
}: CreateTaskModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [projectId, setProjectId] = useState(defaultProjectId || '');
  const [priority, setPriority] = useState<TaskPriority>(
    'medium' as TaskPriority
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const queryClient = useQueryClient();

  // Fetch projects to populate the dropdown
  const { data: projectsResponse } = useQuery({
    queryKey: ['projects', 'all'],
    queryFn: () => projectsApi.getAll(),
    enabled: open,
  });

  const projects = (projectsResponse?.data?.data?.projects || []) as Project[];

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId) {
      setError('Please select a project');
      return;
    }

    setError('');
    setIsSubmitting(true);

    try {
      await tasksApi.create({
        title,
        description,
        projectId,
        priority,
      });
      // Invalidate the tasks query to trigger a refetch
      queryClient.invalidateQueries({ queryKey: ['tasks'] });

      // Reset form
      setTitle('');
      setDescription('');
      setPriority('medium' as TaskPriority);
      if (!defaultProjectId) setProjectId('');
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else if (typeof err === 'object' && err !== null && 'message' in err) {
        setError((err as { message: string }).message);
      } else {
        setError('Failed to create task');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="modal-surface w-full max-w-md">
        <div className="px-6 py-4 border-b border-border-subtle flex items-center justify-between bg-surface-subtle/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <CheckSquare className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="text-lg font-semibold text-text-base">
              Create Task
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-text-muted hover:text-text-base hover:bg-surface-muted rounded-lg transition-colors"
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
                htmlFor="projectId"
                className="block text-sm font-medium text-text-subtle mb-1"
              >
                Project <span className="text-danger-500">*</span>
              </label>
              <select
                id="projectId"
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                required
                disabled={!!defaultProjectId}
                className="input w-full"
              >
                <option value="" disabled>
                  Select a project
                </option>
                {projects.map((proj) => (
                  <option key={proj.id} value={proj.id}>
                    {proj.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="title"
                className="block text-sm font-medium text-text-subtle mb-1"
              >
                Task Title <span className="text-danger-500">*</span>
              </label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full bg-[var(--color-surface-base)] border border-[var(--color-border-base)] rounded-lg text-sm text-[var(--color-text-base)] p-2 placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-base)] focus:border-transparent transition"
                placeholder="e.g. Update user authentication"
              />
            </div>

            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-text-subtle mb-1"
              >
                Description
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-[var(--color-surface-base)] border border-[var(--color-border-base)] rounded-lg text-sm text-[var(--color-text-base)] p-2 placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-base)] focus:border-transparent transition min-h-[80px]"
                placeholder="Details about this task..."
              />
            </div>

            <div>
              <label
                htmlFor="priority"
                className="block text-sm font-medium text-text-subtle mb-1"
              >
                Priority
              </label>
              <select
                id="priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="input w-full"
              >
                <option value="none">None</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
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
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              disabled={isSubmitting || !title.trim() || !projectId}
            >
              {isSubmitting ? (
                <span className="h-4 w-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
              ) : (
                <Plus className="w-4 h-4" />
              )}
              <span>Create Task</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
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
