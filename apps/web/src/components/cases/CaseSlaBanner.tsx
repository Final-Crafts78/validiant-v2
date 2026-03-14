import React from 'react';
import { ShieldCheck, Flag } from 'lucide-react';
import { SlaBadge } from './SlaBadge';
import { Task } from '@/hooks/useTasks';
import { cn } from '@/lib/utils';

interface CaseSlaBannerProps {
  task: Task;
}

export const CaseSlaBanner: React.FC<CaseSlaBannerProps> = ({ task }) => {
  const metrics = task.slaMetrics;

  const bgStyles = {
    on_track:
      'from-emerald-600/20 via-emerald-600/5 to-transparent border-emerald-500/20',
    at_risk:
      'from-amber-600/20 via-amber-600/5 to-transparent border-amber-500/20',
    breached:
      'from-rose-600/20 via-rose-600/5 to-transparent border-rose-500/20',
  };

  const status = metrics?.status || 'on_track';

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-[2.5rem] border bg-gradient-to-br p-8 transition-all duration-700',
        bgStyles[status]
      )}
    >
      {/* Background Decorative Elements */}
      <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none">
        <ShieldCheck className="w-64 h-64 -rotate-12" />
      </div>

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-primary/10 text-primary">
              <Flag className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                {task.title}
              </h1>
              <p className="text-sm opacity-60 font-medium">
                Case ID: {(task as any).caseId || task.id} •{' '}
                {task.verificationType?.name || 'Standard Verification'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold tracking-widest opacity-50">
                Priority
              </span>
              <span
                className={cn(
                  'text-sm font-semibold capitalize',
                  task.priority === 'urgent'
                    ? 'text-rose-500'
                    : task.priority === 'high'
                      ? 'text-amber-500'
                      : 'text-primary'
                )}
              >
                {task.priority}
              </span>
            </div>
            <div className="h-8 w-px bg-border" />
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold tracking-widest opacity-50">
                Project
              </span>
              <span className="text-sm font-semibold">
                {task.project?.name || 'Internal'}
              </span>
            </div>
            <div className="h-8 w-px bg-border" />
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold tracking-widest opacity-50">
                Assignees
              </span>
              <div className="flex -space-x-2 mt-0.5">
                {task.assignees?.map((a) => (
                  <div
                    key={a.id}
                    className="w-6 h-6 rounded-full bg-muted border-2 border-background flex items-center justify-center text-[10px] font-bold overflow-hidden"
                    title={a.fullName}
                  >
                    {a.avatarUrl ? (
                      <img src={a.avatarUrl} alt={a.fullName} />
                    ) : (
                      a.fullName.charAt(0)
                    )}
                  </div>
                ))}
                {!task.assignees?.length && (
                  <span className="text-xs font-medium opacity-50 italic">
                    Unassigned
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        <SlaBadge metrics={metrics} />
      </div>

      {/* SLA Progress Bar at bottom */}
      {metrics && (
        <div className="absolute bottom-0 left-0 right-0 h-1bg-border/30">
          <div
            className={cn(
              'h-full transition-all duration-1000 ease-out',
              status === 'on_track'
                ? 'bg-emerald-500'
                : status === 'at_risk'
                  ? 'bg-amber-500'
                  : 'bg-rose-500'
            )}
            style={{ width: `${metrics.percentage}%` }}
          />
        </div>
      )}
    </div>
  );
};
