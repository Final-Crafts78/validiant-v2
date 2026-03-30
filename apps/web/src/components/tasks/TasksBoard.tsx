/**
 * TasksBoard Component (Kanban View)
 *
 * Visualizes tasks across workflow stages.
 */

import React from 'react';
import {
  Circle,
  Clock,
  CheckCircle2,
  MoreHorizontal,
  Plus,
} from 'lucide-react';
import { Task } from '@/hooks/useTasks';
import { TaskStatus, TaskPriority } from '@validiant/shared';

interface TasksBoardProps {
  tasks: Task[];
  onTaskClick: (taskId: string) => void;
}

const statusConfig = {
  [TaskStatus.PENDING]: {
    label: 'To Do',
    icon: Circle,
    color: 'text-[var(--color-text-muted)]',
    bg: 'bg-[var(--color-surface-muted)]',
  },
  [TaskStatus.IN_PROGRESS]: {
    label: 'In Progress',
    icon: Clock,
    color: 'text-[var(--color-accent-base)]',
    bg: 'bg-primary-500/10',
  },
  [TaskStatus.COMPLETED]: {
    label: 'Completed',
    icon: CheckCircle2,
    color: 'text-[var(--color-positive-base)]',
    bg: 'bg-success-500/10',
  },
  [TaskStatus.VERIFIED]: {
    label: 'Verified',
    icon: CheckCircle2,
    color: 'text-[var(--color-warning-base)]',
    bg: 'bg-warning-500/10',
  },
  [TaskStatus.UNASSIGNED]: {
    label: 'Unassigned',
    icon: Circle,
    color: 'text-[var(--color-text-muted)]',
    bg: 'bg-[var(--color-surface-muted)]',
  },
};

export function TasksBoard({ tasks, onTaskClick }: TasksBoardProps) {
  // Group tasks by status
  const grouped = tasks.reduce(
    (acc, task) => {
      const status = task.status as TaskStatus;
      if (!acc[status]) acc[status] = [];
      acc[status].push(task);
      return acc;
    },
    {} as Record<string, Task[]>
  );

  const statuses = [
    TaskStatus.PENDING,
    TaskStatus.IN_PROGRESS,
    TaskStatus.COMPLETED,
    TaskStatus.VERIFIED,
  ];

  return (
    <div className="flex gap-6 overflow-x-auto pb-6 scrollbar-hide min-h-[600px]">
      {statuses.map((status) => {
        const config = statusConfig[status as keyof typeof statusConfig];
        const statusTasks = grouped[status] || [];
        const Icon = config.icon;

        return (
          <div key={status} className="flex-shrink-0 w-80 flex flex-col gap-4">
            {/* Column Header */}
            <div
              className={`flex items-center justify-between p-3 rounded-xl ${config.bg} border border-[var(--color-border-base)]/50 shadow-sm`}
            >
              <div className="flex items-center gap-2">
                <Icon className={`h-4 w-4 ${config.color}`} />
                <h3 className="text-sm font-bold text-[var(--color-text-subtle)]">
                  {config.label}
                </h3>
                <span className="text-[10px] font-bold bg-[var(--color-surface-base)] text-[var(--color-text-muted)] px-2 py-0.5 rounded-full border border-[var(--color-border-base)] shadow-sm">
                  {statusTasks.length}
                </span>
              </div>
              <button className="p-1 hover:bg-[var(--color-surface-base)] rounded-md text-[var(--color-text-muted)] transition-colors">
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </div>

            {/* Task List */}
            <div className="flex flex-col gap-3 min-h-[200px]">
              {statusTasks.map((task) => (
                <div
                  key={task.id}
                  onClick={() => onTaskClick(task.id)}
                  className="group bg-[var(--color-surface-base)] p-4 rounded-xl border border-[var(--color-border-base)] shadow-sm hover:shadow-md hover:border-[var(--color-accent-base)] transition-all cursor-pointer active:scale-[0.98]"
                >
                  <div className="flex flex-col gap-2">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold text-[var(--color-text-base)] leading-snug group-hover:text-[var(--color-accent-base)] transition-colors">
                        {task.title}
                      </p>
                    </div>

                    {task.description && (
                      <p className="text-xs text-[var(--color-text-muted)] line-clamp-2">
                        {task.description}
                      </p>
                    )}

                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-[var(--color-border-base)]/30">
                      <div className="flex -space-x-1.5 overflow-hidden">
                        {task.assignees?.map((a: any) => (
                          <div
                            key={a.id}
                            className="flex h-6 w-6 rounded-full ring-2 ring-[var(--color-surface-base)] bg-[var(--color-surface-muted)] items-center justify-center text-[10px] font-bold text-[var(--color-text-subtle)] uppercase"
                            title={a.fullName}
                          >
                            {a.fullName.charAt(0)}
                          </div>
                        ))}
                      </div>

                      {task.priority && (
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                            task.priority === TaskPriority.HIGH ||
                            task.priority === TaskPriority.URGENT
                              ? 'bg-danger-500/10 text-danger-600'
                              : 'bg-[var(--color-surface-muted)] text-[var(--color-text-muted)]'
                          }`}
                        >
                          {task.priority}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              <button className="w-full py-3 flex items-center justify-center gap-2 border-2 border-dashed border-[var(--color-border-base)] rounded-xl text-[var(--color-text-muted)] hover:text-[var(--color-accent-base)] hover:border-[var(--color-accent-base)] hover:bg-primary-500/5 transition-all font-medium text-xs">
                <Plus className="h-4 w-4" />
                Add Task
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
