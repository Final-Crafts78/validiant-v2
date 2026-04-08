'use client';

import { useMemo, useState } from 'react';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { tasksApi, projectsApi } from '@/lib/api';
import { CheckSquare, Plus, X, ShieldAlert } from 'lucide-react';
import type { Project, VerificationType, FieldSchema } from '@validiant/shared';
import { TaskPriority } from '@validiant/shared';
import { useVerificationTypes } from '@/hooks/useVerificationTypes';
import { useWorkspaceStore } from '@/store/workspace';

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
  const [priority, setPriority] = useState<TaskPriority>(TaskPriority.MEDIUM);
  const [customData, setCustomData] = useState<Record<string, unknown>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const queryClient = useQueryClient();
  const { activeOrgId } = useWorkspaceStore();

  // Fetch projects to populate the dropdown
  const { data: projectsResponse } = useQuery({
    queryKey: ['projects', 'all'],
    queryFn: () => projectsApi.getAll(),
    enabled: open,
  });

  const projects = (projectsResponse?.data?.data?.projects || []) as Project[];

  // Fetch Verification Types (Field Schemas)
  const { data: vTypes } = useVerificationTypes(activeOrgId || '');

  // Extract relevant schema for the selected project
  const projectSchema = useMemo(() => {
    if (!vTypes || !projectId) return [];
    const workflow = vTypes.find(
      (v: VerificationType) => v.code === `PRJ_${projectId}_CUSTOM`
    );
    return workflow?.fieldSchema || [];
  }, [vTypes, projectId]);

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
        customData,
      });
      // Invalidate the tasks query to trigger a refetch
      queryClient.invalidateQueries({ queryKey: ['tasks'] });

      // Reset form
      setTitle('');
      setDescription('');
      setPriority(TaskPriority.MEDIUM);
      setCustomData({});
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

  const handleCustomFieldChange = (key: string, value: unknown) => {
    setCustomData((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="modal-surface w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-border-subtle flex items-center justify-between bg-surface-subtle/50 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <CheckSquare className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="text-lg font-semibold text-text-base">
              Create New Task
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-text-muted hover:text-text-base hover:bg-surface-muted rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
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
                  <option value={TaskPriority.LOW}>Low</option>
                  <option value={TaskPriority.MEDIUM}>Medium</option>
                  <option value={TaskPriority.HIGH}>High</option>
                  <option value={TaskPriority.URGENT}>Urgent</option>
                </select>
              </div>
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
                placeholder="e.g. ID Verification for John Doe"
              />
            </div>

            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-text-subtle mb-1"
              >
                Internal Description
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-[var(--color-surface-base)] border border-[var(--color-border-base)] rounded-lg text-sm text-[var(--color-text-base)] p-2 placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-base)] focus:border-transparent transition min-h-[60px]"
                placeholder="Additional notes for the field executive..."
              />
            </div>

            {/* Dynamic Custom Fields (EAV) */}
            {projectSchema.length > 0 && (
              <div className="pt-4 border-t border-slate-100">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <ShieldAlert className="w-3 h-3" /> Project Custom Fields
                </h3>
                <div className="space-y-3 bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                  {projectSchema.map((field: FieldSchema) => (
                    <div key={field.fieldKey}>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">
                        {field.label}{' '}
                        {field.required && (
                          <span className="text-red-500">*</span>
                        )}
                      </label>
                      {field.type === 'boolean' ? (
                        <div className="flex gap-4">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name={field.fieldKey}
                              onChange={() =>
                                handleCustomFieldChange(field.fieldKey, true)
                              }
                              className="text-indigo-600 focus:ring-indigo-500"
                            />
                            <span className="text-sm">Yes</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name={field.fieldKey}
                              onChange={() =>
                                handleCustomFieldChange(field.fieldKey, false)
                              }
                              className="text-indigo-600 focus:ring-indigo-500"
                            />
                            <span className="text-sm">No</span>
                          </label>
                        </div>
                      ) : (
                        <input
                          type={field.type === 'number' ? 'number' : 'text'}
                          className="input w-full bg-white"
                          placeholder={`Enter ${field.label}...`}
                          onChange={(e) =>
                            handleCustomFieldChange(
                              field.fieldKey,
                              e.target.value
                            )
                          }
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="mt-8 flex justify-end gap-3 sticky bottom-0 bg-white pt-4 border-t border-slate-50">
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
              className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-bold bg-indigo-600 text-[var(--color-text-base)] rounded-lg hover:bg-indigo-700 transition-all shadow-md active:scale-95 disabled:opacity-50 disabled:active:scale-100"
              disabled={isSubmitting || !title.trim() || !projectId}
            >
              {isSubmitting ? (
                <span className="h-4 w-4 border-2 border-[var(--color-border-base)] border-t-white rounded-full animate-spin"></span>
              ) : (
                <Plus className="w-4 h-4" />
              )}
              <span>Initialize Task</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function CreateTaskModalTrigger({
  defaultProjectId,
  className,
  label = 'New Task',
}: {
  defaultProjectId?: string;
  className?: string;
  label?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={
          className ||
          'inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-indigo-600 text-[var(--color-text-base)] rounded-lg hover:bg-indigo-700 transition-colors shrink-0 shadow-sm'
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
