'use client';

import React, { useMemo } from 'react';
import {
  CheckCircle2,
  MapPin,
  Clock,
  Loader2,
  ChevronRight,
  Filter,
} from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useTasks } from '@/hooks/useTasks';
import { useWorkspaceStore } from '@/store/workspace';
import { cn } from '@/lib/utils';
import { TaskStatus } from '@validiant/shared';
import { formatDistanceToNow } from 'date-fns';

export function FieldTasksPage() {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();
  const { activeProjectId } = useWorkspaceStore();

  const { data: tasksData, isLoading } = useTasks(activeProjectId || '', {
    assignedTo: user?.id,
  });

  const tasks = useMemo(() => {
    const all = tasksData?.pages.flatMap((p) => p.tasks) || [];
    return all.filter((t) => t.status !== TaskStatus.COMPLETED);
  }, [tasksData]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
        <p className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-widest">
          Syncing Field Tasks...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search & Filter Bar */}
      <div className="flex items-center gap-2">
        <div className="flex-1 bg-[var(--color-surface-base)] border border-[var(--color-border-base)] rounded-2xl px-4 py-2.5 flex items-center shadow-sm">
          <input
            type="text"
            placeholder="Search my tasks..."
            className="bg-transparent border-none outline-none text-sm w-full placeholder:text-[var(--color-text-muted)] font-medium text-[var(--color-text-base)]"
          />
        </div>
        <button className="w-11 h-11 bg-[var(--color-surface-base)] border border-[var(--color-border-base)] rounded-2xl flex items-center justify-center text-[var(--color-text-muted)] shadow-sm active:bg-[var(--color-surface-muted)]">
          <Filter className="w-4 h-4" />
        </button>
      </div>

      {/* Task List */}
      <div className="space-y-3">
        <h2 className="text-[10px] font-black text-[var(--color-text-muted)] uppercase tracking-[0.2em] px-1">
          Active Assignments ({tasks.length})
        </h2>

        {tasks.length === 0 ? (
          <div className="bg-[var(--color-surface-base)] border border-dashed border-[var(--color-border-base)] rounded-3xl p-12 text-center flex flex-col items-center">
            <CheckCircle2 className="w-12 h-12 text-[var(--color-text-muted)] mb-3" />
            <p className="text-sm font-bold text-[var(--color-text-base)]">
              No active tasks
            </p>
            <p className="text-xs text-[var(--color-text-muted)] mt-1">
              Check back later or contact your manager.
            </p>
          </div>
        ) : (
          tasks.map((task) => (
            <div
              key={task.id}
              onClick={() => {
                const params = new URLSearchParams();
                params.set('taskId', task.id);
                router.push(`${pathname}?${params.toString()}`);
              }}
              className="bg-[var(--color-surface-base)] border border-[var(--color-border-base)] rounded-[2rem] p-5 shadow-sm active:scale-[0.98] transition-all cursor-pointer group"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      'w-2.5 h-2.5 rounded-full',
                      task.status === TaskStatus.IN_PROGRESS
                        ? 'bg-blue-500 animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.5)]'
                        : task.status === TaskStatus.COMPLETED
                          ? 'bg-emerald-500'
                          : 'bg-[var(--color-border-base)]'
                    )}
                  />
                  <span className="text-[10px] font-black uppercase text-[var(--color-text-muted)] tracking-tighter">
                    {task.status}
                  </span>
                </div>
                <div className="text-[10px] font-bold text-[var(--color-text-muted)] flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatDistanceToNow(new Date(task.createdAt), {
                    addSuffix: true,
                  })}
                </div>
              </div>

              <h3 className="text-base font-bold text-[var(--color-text-base)] leading-tight mb-1 group-hover:text-indigo-600 transition-colors">
                {task.title}
              </h3>

              {(task.customFields as any)?.address && (
                <div className="flex items-start gap-1.5 text-xs text-[var(--color-text-muted)] mb-4">
                  <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0 text-[var(--color-text-muted)] opacity-60" />
                  <span className="line-clamp-1">
                    {(task.customFields as any)?.address || 'Remote Task'}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between mt-auto pt-4 border-t border-[var(--color-border-base)]">
                <div className="flex -space-x-1.5">
                  <div className="w-6 h-6 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 flex items-center justify-center text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase">
                    {task.priority.charAt(0)}
                  </div>
                </div>

                <button className="flex items-center gap-1 text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-3 py-1.5 rounded-full group-hover:bg-indigo-600 group-hover:text-[var(--color-text-base)] transition-all">
                  Details
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Quick Stats Summary */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-indigo-600 rounded-[2rem] p-5 text-[var(--color-text-base)] shadow-lg shadow-indigo-200">
          <p className="text-[10px] font-black opacity-60 uppercase tracking-widest mb-1">
            Total Done
          </p>
          <p className="text-3xl font-black">
            {tasksData?.pages
              .flatMap((p) => p.tasks)
              .filter((t) => t.status === TaskStatus.COMPLETED).length || 0}
          </p>
        </div>
        <div className="bg-[var(--color-surface-muted)] border border-[var(--color-border-base)] rounded-[2rem] p-6 text-center">
          <p className="text-[10px] uppercase font-black text-[var(--color-text-muted)] tracking-widest mb-1.5">
            Duty of Care
          </p>
          <p className="text-[11px] font-medium text-[var(--color-text-subtle)] leading-relaxed max-w-[240px] mx-auto">
            Assignment lifecycle is monitored in real-time. Please maintain
            active GPS signal for verification accuracy.
          </p>
        </div>
      </div>
    </div>
  );
}
