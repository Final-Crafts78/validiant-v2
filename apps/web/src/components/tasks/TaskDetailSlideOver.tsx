'use client';
/**
 * Task Detail Slide-Over (Phase 24 — Elite UX)
 *
 * Right-side drawer occupying 40% of the viewport.
 * URL-driven: opens only when ?taskId=XYZ is present.
 *
 * Features:
 * - Fetches task detail via tasksApi.getById
 * - Status dropdown with TanStack Query optimistic update
 * - Smooth slide-in / slide-out animation
 * - Backdrop overlay to dismiss
 */

import { useCallback, useEffect, useRef } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tasksApi } from '@/lib/api';
import type { Task } from '@validiant/shared';
import {
  X,
  Clock,
  User,
  Calendar,
  Tag,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Circle,
  Ban,
  Pause,
  Search,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Status config
// ---------------------------------------------------------------------------
const STATUSES = [
  { value: 'todo', label: 'To Do', icon: Circle, color: 'text-slate-500' },
  {
    value: 'in_progress',
    label: 'In Progress',
    icon: Clock,
    color: 'text-blue-600',
  },
  {
    value: 'in_review',
    label: 'In Review',
    icon: Search,
    color: 'text-amber-500',
  },
  {
    value: 'blocked',
    label: 'Blocked',
    icon: Pause,
    color: 'text-red-500',
  },
  {
    value: 'completed',
    label: 'Completed',
    icon: CheckCircle2,
    color: 'text-emerald-600',
  },
  {
    value: 'cancelled',
    label: 'Cancelled',
    icon: Ban,
    color: 'text-slate-400',
  },
];

const PRIORITY_STYLES: Record<string, string> = {
  none: 'bg-slate-100 text-slate-500 border-slate-200',
  low: 'bg-slate-100 text-slate-700 border-slate-200',
  medium: 'bg-blue-50 text-blue-700 border-blue-200',
  high: 'bg-amber-50 text-amber-700 border-amber-200',
  urgent: 'bg-red-50 text-red-700 border-red-200',
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function TaskDetailSlideOver() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const taskId = searchParams.get('taskId');
  const panelRef = useRef<HTMLDivElement>(null);

  // ── Fetch task detail ────────────────────────────────────────────────
  const {
    data: response,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['tasks', taskId],
    queryFn: () => tasksApi.getById(taskId!),
    enabled: !!taskId,
  });

  const task: Task | undefined = response?.data?.data as Task | undefined;

  // ── Close handler ────────────────────────────────────────────────────
  const close = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('taskId');
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [router, pathname, searchParams]);

  // Close on Escape key
  useEffect(() => {
    if (!taskId) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [taskId, close]);

  // ── Optimistic status mutation ───────────────────────────────────────
  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      tasksApi.updateStatus(id, status),

    // Optimistic update: instantly update UI before server responds
    onMutate: async ({ id, status }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['tasks', id] });
      await queryClient.cancelQueries({ queryKey: ['tasks', 'all'] });

      // Snapshot previous values for rollback
      const previousTask = queryClient.getQueryData(['tasks', id]);
      const previousAll = queryClient.getQueryData(['tasks', 'all']);

      // Optimistically update single task query
      queryClient.setQueryData(['tasks', id], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          data: {
            ...old.data,
            data: { ...old.data.data, status },
          },
        };
      });

      // Optimistically update task list query
      queryClient.setQueryData(['tasks', 'all'], (old: any) => {
        if (!old?.data?.data?.tasks) return old;
        return {
          ...old,
          data: {
            ...old.data,
            data: {
              ...old.data.data,
              tasks: old.data.data.tasks.map((t: Task) =>
                t.id === id ? { ...t, status } : t
              ),
            },
          },
        };
      });

      return { previousTask, previousAll };
    },

    // Rollback on error
    onError: (_err, { id }, context) => {
      if (context?.previousTask) {
        queryClient.setQueryData(['tasks', id], context.previousTask);
      }
      if (context?.previousAll) {
        queryClient.setQueryData(['tasks', 'all'], context.previousAll);
      }
    },

    // Refetch on settle to ensure consistency
    onSettled: (_data, _err, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['tasks', id] });
      queryClient.invalidateQueries({ queryKey: ['tasks', 'all'] });
    },
  });

  // Don't render if no taskId
  if (!taskId) return null;

  // Format date helper
  const fmtDate = (d: Date | string | undefined | null) => {
    if (!d) return '—';
    try {
      return new Date(d).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return '—';
    }
  };

  const currentStatus = STATUSES.find((s) => s.value === task?.status);
  const StatusIcon = currentStatus?.icon ?? Circle;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-40 transition-opacity"
        onClick={close}
        aria-hidden="true"
      />

      {/* Slide-Over Panel */}
      <div
        ref={panelRef}
        className="fixed top-0 right-0 h-full w-full sm:w-[50%] lg:w-[40%] bg-white shadow-2xl z-50 flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-300"
        role="dialog"
        aria-modal="true"
        aria-label="Task details"
      >
        {/* ─── Header ─────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 shrink-0">
          <h2 className="text-lg font-bold text-slate-900 truncate">
            Task Details
          </h2>
          <button
            onClick={close}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ─── Body ───────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto">
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-24 gap-3">
              <Loader2 className="h-7 w-7 text-blue-600 animate-spin" />
              <p className="text-sm text-slate-500">Loading task…</p>
            </div>
          )}

          {isError && (
            <div className="flex flex-col items-center justify-center py-24 gap-3">
              <AlertCircle className="h-8 w-8 text-red-500" />
              <p className="text-sm font-medium text-slate-700">
                Failed to load task
              </p>
              <p className="text-xs text-slate-400">
                The task may have been deleted or you don&apos;t have access.
              </p>
            </div>
          )}

          {task && (
            <div className="px-6 py-5 space-y-6">
              {/* Title + Priority */}
              <div>
                <h3 className="text-xl font-bold text-slate-900 leading-snug mb-2">
                  {task.title}
                </h3>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                    PRIORITY_STYLES[task.priority] ?? PRIORITY_STYLES['none']
                  }`}
                >
                  {task.priority?.charAt(0).toUpperCase() +
                    task.priority?.slice(1) || 'None'}
                </span>
              </div>

              {/* Status Dropdown — Optimistic */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Status
                </label>
                <div className="relative">
                  <StatusIcon
                    className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${currentStatus?.color ?? 'text-slate-400'}`}
                  />
                  <select
                    value={task.status}
                    onChange={(e) => {
                      statusMutation.mutate({
                        id: task.id,
                        status: e.target.value,
                      });
                    }}
                    className="w-full pl-10 pr-4 py-2.5 text-sm font-medium border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors appearance-none cursor-pointer"
                  >
                    {STATUSES.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
                {statusMutation.isPending && (
                  <p className="text-xs text-blue-500 mt-1 flex items-center gap-1">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Saving…
                  </p>
                )}
              </div>

              {/* Description */}
              {task.description && (
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Description
                  </label>
                  <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                    {task.description}
                  </p>
                </div>
              )}

              {/* Meta Grid */}
              <div className="grid grid-cols-2 gap-4">
                {/* Assignee */}
                <div className="bg-slate-50 rounded-lg p-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Assignee
                    </span>
                  </div>
                  <p className="text-sm font-medium text-slate-700 truncate">
                    {task.assigneeId ?? 'Unassigned'}
                  </p>
                </div>

                {/* Project */}
                <div className="bg-slate-50 rounded-lg p-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Tag className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Project
                    </span>
                  </div>
                  <p className="text-sm font-medium text-slate-700 truncate">
                    {task.projectId ?? '—'}
                  </p>
                </div>

                {/* Due Date */}
                <div className="bg-slate-50 rounded-lg p-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Due Date
                    </span>
                  </div>
                  <p className="text-sm font-medium text-slate-700">
                    {fmtDate(task.dueDate)}
                  </p>
                </div>

                {/* Created */}
                <div className="bg-slate-50 rounded-lg p-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Created
                    </span>
                  </div>
                  <p className="text-sm font-medium text-slate-700">
                    {fmtDate(task.createdAt)}
                  </p>
                </div>
              </div>

              {/* Tags */}
              {task.tags && task.tags.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Tags
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {task.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
