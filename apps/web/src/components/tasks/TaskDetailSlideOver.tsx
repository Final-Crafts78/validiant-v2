'use client';

import { cn } from '@/lib/utils';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tasksApi, type APIResponse } from '@/lib/api';
import type { AxiosResponse } from 'axios';
import { useWorkspaceStore } from '@/store/workspace';
import { useVerificationTypes } from '@/hooks/useVerificationTypes';
import { DynamicTaskExecutionForm } from './DynamicTaskExecutionForm';
import {
  Task,
  TaskStatus,
  VerificationType,
  VerificationTask,
} from '@validiant/shared';
import { logger } from '@/lib/logger';
import toast from 'react-hot-toast';
import {
  X,
  Clock,
  User,
  Calendar,
  Tag,
  AlertCircle,
  Search,
  Loader2,
  ChevronRight,
  Circle,
  CheckCircle2,
  Ban,
  ShieldCheck,
  Sparkles,
  Bot,
  RefreshCw,
  Timer,
  Navigation2,
  Fingerprint,
  Activity,
} from 'lucide-react';
import { summarizeTask } from '@/services/ai.service';

const STATUSES = [
  {
    value: TaskStatus.PENDING,
    label: 'Pending',
    icon: Circle,
    color: 'text-text-muted',
  },
  {
    value: TaskStatus.IN_PROGRESS,
    label: 'In Progress',
    icon: Clock,
    color: 'text-blue-600',
  },
  {
    value: TaskStatus.VERIFIED,
    label: 'Verified',
    icon: Search,
    color: 'text-amber-500',
  },
  {
    value: TaskStatus.COMPLETED,
    label: 'Completed',
    icon: CheckCircle2,
    color: 'text-emerald-600',
  },
  {
    value: TaskStatus.UNASSIGNED,
    label: 'Unassigned',
    icon: Ban,
    color: 'text-text-muted',
  },
];

const PRIORITY_STYLES: Record<string, string> = {
  none: 'bg-surface-muted text-text-muted border-border-base',
  low: 'bg-surface-muted text-text-subtle border-border-base',
  medium: 'bg-primary-500/10 text-primary-600 border-primary-500/20',
  high: 'bg-warning-500/10 text-warning-600 border-warning-500/20',
  urgent: 'bg-danger-500/10 text-danger-600 border-danger-500/20',
};

export function TaskDetailSlideOver() {
  const router = useRouter();
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const activeOrgSlug = useWorkspaceStore((s) => s.activeOrgSlug);
  const activeOrgId = useWorkspaceStore((s) => s.activeOrgId);
  const taskId = searchParams.get('taskId');
  const panelRef = useRef<HTMLDivElement>(null);

  const { data: vTypes } = useVerificationTypes(activeOrgId);

  const {
    data: response,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['tasks', taskId],
    queryFn: () => {
      if (!taskId) throw new Error('Task ID is required');
      return tasksApi.getById(taskId);
    },
    enabled: !!taskId,
  });

  const task: VerificationTask | undefined = response?.data?.data as
    | VerificationTask
    | undefined;

  const handleSummarize = async () => {
    if (!task) return;
    setIsAiLoading(true);
    try {
      const res = await summarizeTask(task.id);
      setAiSummary(res.summary);
      toast.success('Task summarized by Validiant AI');
    } catch (error) {
      toast.error('AI summarization unavailable');
    } finally {
      setIsAiLoading(false);
    }
  };

  const close = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('taskId');
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [router, pathname, searchParams]);

  useEffect(() => {
    if (taskId && typeof navigator !== 'undefined' && navigator.geolocation) {
      logger.info('[GpsEngine:PreWarm]', { taskId });
      navigator.geolocation.getCurrentPosition(
        () => logger.debug('[GpsEngine:WarmupSuccess]'),
        (err) => logger.warn('[GpsEngine:WarmupDenied]', err),
        { enableHighAccuracy: true, timeout: 5000 }
      );
    }
  }, [taskId]);

  useEffect(() => {
    if (!taskId) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [taskId, close]);

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      tasksApi.updateStatus(id, status),

    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: ['tasks', id] });
      await queryClient.cancelQueries({ queryKey: ['tasks', 'all'] });

      const previousTask = queryClient.getQueryData(['tasks', id]);
      const previousAll = queryClient.getQueryData(['tasks', 'all']);

      queryClient.setQueryData(
        ['tasks', id],
        (old: AxiosResponse<APIResponse<Task>> | undefined) => {
          if (!old) return old;
          return {
            ...old,
            data: {
              ...old.data,
              data: { ...old.data.data, status },
            },
          };
        }
      );

      queryClient.setQueryData(
        ['tasks', 'all'],
        (old: AxiosResponse<APIResponse<{ tasks: Task[] }>> | undefined) => {
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
        }
      );

      return { previousTask, previousAll };
    },

    onError: (_err, { id }, context) => {
      if (context?.previousTask) {
        queryClient.setQueryData(['tasks', id], context.previousTask);
      }
      if (context?.previousAll) {
        queryClient.setQueryData(['tasks', 'all'], context.previousAll);
      }
    },

    onSettled: (_data, _err, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['tasks', id] });
      queryClient.invalidateQueries({ queryKey: ['tasks', 'all'] });
    },
  });

  if (!taskId) return null;

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

  const customSchema =
    task?.projectId && vTypes
      ? vTypes.find(
          (v: VerificationType) => v.code === `PRJ_${task.projectId}_CUSTOM`
        )?.fieldSchema
      : null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-40 transition-opacity"
        onClick={close}
        aria-hidden="true"
      />

      <div
        ref={panelRef}
        className="fixed top-0 right-0 h-full w-full sm:w-[50%] lg:w-[40%] bg-[var(--color-surface-base)] shadow-2xl z-50 flex flex-col border-l border-[var(--color-border-base)] animate-in slide-in-from-right duration-300"
        role="dialog"
        aria-modal="true"
        aria-label="Task details"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border-base)] shrink-0">
          <h2 className="text-lg font-bold text-[var(--color-text-base)] truncate">
            Task Details
          </h2>
          <button
            onClick={close}
            className="p-2 text-[var(--color-text-muted)] hover:text-[var(--color-text-base)] hover:bg-[var(--color-surface-muted)] rounded-lg transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-24 gap-3">
              <Loader2 className="h-7 w-7 text-[var(--color-accent-base)] animate-spin" />
              <p className="text-sm text-[var(--color-text-muted)]">
                Loading task…
              </p>
            </div>
          )}

          {isError && (
            <div className="flex flex-col items-center justify-center py-24 gap-3">
              <AlertCircle className="h-8 w-8 text-[var(--color-critical-base)]" />
              <p className="text-sm font-medium text-[var(--color-text-subtle)]">
                Failed to load task
              </p>
              <p className="text-xs text-[var(--color-text-muted)]">
                The task may have been deleted or you don&apos;t have access.
              </p>
            </div>
          )}

          {task && (
            <>
              <section className="px-6 py-4 bg-indigo-50/30 border-y border-indigo-100/50">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3" /> Intelligent Summary
                  </h3>
                  <button
                    onClick={handleSummarize}
                    disabled={isAiLoading}
                    className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition-colors bg-white px-2 py-0.5 rounded-lg border border-indigo-100 shadow-sm"
                  >
                    {isAiLoading ? (
                      <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                    ) : (
                      <Bot className="w-2.5 h-2.5" />
                    )}
                    {aiSummary ? 'Regenerate' : 'Summarize with AI'}
                  </button>
                </div>

                {aiSummary ? (
                  <div className="p-3 bg-white border border-indigo-100 rounded-2xl shadow-sm">
                    <p className="text-xs text-slate-700 leading-relaxed font-medium italic">
                      &quot;{aiSummary}&quot;
                    </p>
                    <div className="mt-2 flex items-center gap-1.5 text-[9px] font-bold text-indigo-400">
                      <ShieldCheck className="w-2.5 h-2.5" />
                      VALIDIANT CORE-INTELLIGENCE VERIFIED
                    </div>
                  </div>
                ) : (
                  <p className="text-[10px] text-slate-400 italic">
                    Generate a concise, LLM-powered briefing of this case&apos;s
                    status and recent activity.
                  </p>
                )}
              </section>

              <div className="p-6 space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-[var(--color-text-base)] leading-snug mb-2">
                    {task.title}
                  </h3>
                  <span
                    className={cn(
                      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border',
                      PRIORITY_STYLES[task.priority] ?? PRIORITY_STYLES['none']
                    )}
                  >
                    {task.priority?.charAt(0).toUpperCase() +
                      task.priority?.slice(1) || 'None'}
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-2">
                    Status
                  </label>
                  <div className="relative">
                    <StatusIcon
                      className={cn(
                        'absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4',
                        currentStatus?.color ?? 'text-[var(--color-text-muted)]'
                      )}
                    />
                    <select
                      value={task.status}
                      onChange={(e) => {
                        statusMutation.mutate({
                          id: task.id,
                          status: e.target.value,
                        });
                      }}
                      className="w-full pl-10 pr-4 py-2.5 text-sm font-medium border border-[var(--color-border-base)] rounded-lg bg-[var(--color-surface-base)] text-[var(--color-text-base)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-base)] focus:border-transparent transition-colors appearance-none cursor-pointer"
                    >
                      {STATUSES.map((s) => (
                        <option key={s.value} value={s.value}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  {statusMutation.isPending && (
                    <p className="text-xs text-[var(--color-accent-base)] mt-1 flex items-center gap-1">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Saving…
                    </p>
                  )}
                </div>

                {task.customFields?.caseId && (
                  <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10 space-y-3">
                    <div className="flex items-center gap-2">
                      <Search className="w-4 h-4 text-primary" />
                      <span className="text-sm font-bold text-primary">
                        Verification Case detected
                      </span>
                    </div>
                    <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">
                      This task is part of a verification pipeline. Use the Case
                      Command Center for immersive field management and SLA
                      tracking.
                    </p>
                    <button
                      onClick={() =>
                        router.push(
                          `/${activeOrgSlug}/cases/${task.customFields?.caseId}`
                        )
                      }
                      className="w-full py-2 bg-primary text-[var(--color-text-base)] text-xs font-bold rounded-xl hover:shadow-lg hover:shadow-primary/20 transition-all flex items-center justify-center gap-2"
                    >
                      Open Case Command Center
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                )}

                {task.description && (
                  <div>
                    <label className="block text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-2">
                      Description
                    </label>
                    <p className="text-sm text-[var(--color-text-subtle)] leading-relaxed whitespace-pre-wrap">
                      {task.description}
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 rounded-lg p-3">
                    <div className="flex items-center gap-1.5 mb-1">
                      <User className="w-3.5 h-3.5 text-[var(--color-text-muted)]" />
                      <span className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
                        Assignee
                      </span>
                    </div>
                    <p className="text-sm font-medium text-[var(--color-text-subtle)] truncate">
                      {task.assigneeId ?? 'Unassigned'}
                    </p>
                  </div>

                  <div className="bg-slate-50 rounded-lg p-3">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Tag className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
                        Project
                      </span>
                    </div>
                    <p className="text-sm font-medium text-[var(--color-text-subtle)]">
                      {task.projectId ?? '—'}
                    </p>
                  </div>

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

                  <div className="bg-slate-50 rounded-lg p-3">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Clock className="w-3.5 h-3.5 text-[var(--color-text-muted)]" />
                      <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        Created
                      </span>
                    </div>
                    <p className="text-sm font-medium text-slate-700">
                      {fmtDate(task.createdAt)}
                    </p>
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-[var(--color-border-base)]">
                  <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Activity className="w-3 h-3" /> Professional Operations
                  </h3>

                  <div className="grid grid-cols-1 gap-3">
                    <div className="flex items-center justify-between p-4 bg-slate-900 rounded-2xl shadow-xl shadow-slate-100 group overflow-hidden relative">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-[var(--color-surface-muted)]/50 rounded-full -mr-12 -mt-12 blur-xl group-hover:scale-150 transition-transform duration-700" />
                      <div className="flex items-center gap-4 relative z-10">
                        <div className="w-10 h-10 bg-[var(--color-surface-muted)] rounded-xl flex items-center justify-center text-[var(--color-text-base)]">
                          <Timer className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">
                            Active Timer
                          </p>
                          <p className="text-xl font-mono font-black text-[var(--color-text-base)] leading-none">
                            {task.status === TaskStatus.IN_PROGRESS
                              ? '04:12:45'
                              : '00:00:00'}
                          </p>
                        </div>
                      </div>
                      <button
                        className={cn(
                          'px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all relative z-10',
                          task.status === TaskStatus.IN_PROGRESS
                            ? 'bg-red-500 text-[var(--color-text-base)] hover:bg-red-600'
                            : 'bg-white text-slate-900 hover:bg-slate-50'
                        )}
                        onClick={() => {
                          const next =
                            task.status === TaskStatus.IN_PROGRESS
                              ? TaskStatus.VERIFIED
                              : TaskStatus.IN_PROGRESS;
                          statusMutation.mutate({ id: task.id, status: next });
                        }}
                      >
                        {task.status === TaskStatus.IN_PROGRESS
                          ? 'Stop Clock'
                          : 'Start Clock'}
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      {/* Geocoding Trigger */}
                      <button
                        onClick={() => {
                          if (task.customFields?.googleMapsLink) {
                            window.open(
                              task.customFields.googleMapsLink,
                              '_blank'
                            );
                          } else {
                            toast.success('Geocoding coordinates triggered...');
                          }
                        }}
                        className={cn(
                          'flex flex-col items-center gap-3 p-5 rounded-3xl transition-all group border',
                          task.customFields?.googleMapsLink
                            ? 'bg-indigo-600 text-[var(--color-text-base)] border-transparent'
                            : 'bg-surface-base border-border-base hover:border-indigo-600 hover:shadow-lg hover:shadow-indigo-50/20'
                        )}
                      >
                        <div
                          className={cn(
                            'w-10 h-10 rounded-2xl flex items-center justify-center transition-all',
                            task.customFields?.googleMapsLink
                              ? 'bg-white/20 text-[var(--color-text-base)]'
                              : 'bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-[var(--color-text-base)]'
                          )}
                        >
                          <Navigation2 className="w-5 h-5" />
                        </div>
                        <span
                          className={cn(
                            'text-[10px] font-black uppercase tracking-tighter',
                            task.customFields?.googleMapsLink
                              ? 'text-[var(--color-text-base)]'
                              : 'text-text-muted group-hover:text-indigo-600'
                          )}
                        >
                          {task.customFields?.googleMapsLink
                            ? 'Open Map'
                            : 'Locate Case'}
                        </span>
                      </button>

                      {/* KYC Trigger (Didit) */}
                      <button
                        onClick={() =>
                          toast.success('Initializing Didit ID Verification...')
                        }
                        className="flex flex-col items-center gap-3 p-5 bg-surface-base border border-border-base rounded-3xl hover:border-emerald-600 hover:shadow-lg hover:shadow-emerald-50/20 transition-all group"
                      >
                        <div className="w-10 h-10 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 group-hover:bg-emerald-600 group-hover:text-[var(--color-text-base)] transition-all">
                          <Fingerprint className="w-5 h-5" />
                        </div>
                        <span className="text-[10px] font-black text-text-muted uppercase tracking-tighter group-hover:text-emerald-600">
                          Verify Identity
                        </span>
                      </button>
                    </div>
                  </div>
                </div>

                {task.tags && task.tags.length > 0 && (
                  <div>
                    <label className="block text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-2">
                      Tags
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {task.tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-[var(--color-surface-muted)] text-[var(--color-text-subtle)] border border-[var(--color-border-base)]"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {customSchema && customSchema.length > 0 && (
                  <DynamicTaskExecutionForm
                    taskId={task.id}
                    schema={customSchema}
                    initialData={task?.customData}
                    targetLocation={
                      task.customFields?.targetLatitude &&
                      task.customFields?.targetLongitude
                        ? {
                            latitude: Number(task.customFields.targetLatitude),
                            longitude: Number(
                              task.customFields.targetLongitude
                            ),
                          }
                        : undefined
                    }
                    onSave={async (data) => {
                      await tasksApi.update(task.id, {
                        customData: data,
                      });
                      queryClient.invalidateQueries({
                        queryKey: ['tasks', task.id],
                      });
                    }}
                  />
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
