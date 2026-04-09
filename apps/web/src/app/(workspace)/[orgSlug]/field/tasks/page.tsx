'use client';

import React, { useMemo, useState } from 'react';
import {
  CheckCircle2,
  MapPin,
  Clock,
  Loader2,
  ChevronRight,
  Search,
  Users
} from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useTasks } from '@/hooks/useTasks';
import { useWorkspaceStore } from '@/store/workspace';
import { cn } from '@/lib/utils';
import { TaskStatus } from '@validiant/shared';
import { isToday, isTomorrow, format } from 'date-fns';

export default function FieldTasksPage() {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();
  const { activeOrgId } = useWorkspaceStore();
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('pending');

  const { data: tasksData, isLoading } = useTasks(activeOrgId || '', {
    assignedTo: user?.id,
  });

  const tasks = useMemo(() => {
    const all = tasksData?.pages.flatMap((p) => p.tasks) || [];
    if (filter === 'pending') return all.filter((t) => t.status !== TaskStatus.COMPLETED);
    if (filter === 'completed') return all.filter((t) => t.status === TaskStatus.COMPLETED);
    return all;
  }, [tasksData, filter]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <p className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-widest">
          Syncing Field Tasks...
        </p>
      </div>
    );
  }

  const completedCount = tasksData?.pages.flatMap((p) => p.tasks).filter((t) => t.status === TaskStatus.COMPLETED).length || 0;
  const activeCount = tasksData?.pages.flatMap((p) => p.tasks).filter((t) => t.status !== TaskStatus.COMPLETED).length || 0;

  const formatDate = (dateValue: string | Date | undefined | null) => {
      if (!dateValue) return 'Unknown';
      try {
        const date = new Date(dateValue);
        if (isToday(date)) return 'Today';
        if (isTomorrow(date)) return 'Tomorrow';
        return format(date, 'MMM d, yyyy');
      } catch {
        return 'Unknown';
      }
  };

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="space-y-1">
          <h1 className="text-3xl font-display font-black text-[var(--color-text-base)] tracking-tight">Active Assignments</h1>
          <p className="text-sm font-medium text-[var(--color-on-surface-variant)]">{activeCount} tasks requiring immediate action</p>
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-2">
        <div className="flex-1 bg-[var(--color-surface-container-highest)] rounded-xl h-14 px-4 py-2.5 flex items-center transition-all focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-b-2 focus-within:border-primary">
          <Search className="w-5 h-5 text-[var(--color-on-surface-variant)] mr-3" />
          <input
            type="text"
            placeholder="Search applicants or IDs..."
            className="bg-transparent border-none outline-none text-sm w-full font-medium text-[var(--color-on-surface)] placeholder:text-[var(--color-on-surface-variant)]"
          />
        </div>
      </div>

      {/* Horizontal Filter Pills */}
      <div className="flex overflow-x-auto gap-2 pb-2 scroller-hidden">
         <button onClick={() => setFilter('pending')} className={cn("px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all", filter === 'pending' ? 'bg-primary text-on-primary' : 'bg-[var(--color-surface-container-high)] text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container-highest)]')}>
             Assigned ✓
         </button>
         <button onClick={() => setFilter('completed')} className={cn("px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all", filter === 'completed' ? 'bg-primary text-on-primary' : 'bg-[var(--color-surface-container-high)] text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container-highest)]')}>
             Completed
         </button>
      </div>

      {/* Task List */}
      <div className="space-y-4">
        {tasks.length === 0 ? (
          <div className="bg-[var(--color-surface-container-lowest)] rounded-2xl h-40 flex flex-col items-center justify-center shadow-[0_12px_40px_rgba(15,23,42,0.06)]">
            <CheckCircle2 className="w-10 h-10 text-[var(--color-text-muted)] mb-3 opacity-30" />
            <p className="text-sm font-bold text-[var(--color-on-surface-variant)]">
              No tasks found
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
              className="relative bg-[var(--color-surface-container-lowest)] rounded-[1.5rem] p-5 shadow-[0_12px_40px_rgba(15,23,42,0.06)] active:scale-[0.98] transition-all cursor-pointer group overflow-hidden"
            >
              {/* Card Side Accent */}
              <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-primary opacity-20" />

              <div className="flex items-start justify-between mb-2">
                <div className="flex flex-col gap-1">
                   <p className="font-mono text-[10px] font-black uppercase text-primary-container tracking-tighter">
                     CAS-{task.id?.split('-')?.[0]?.substring(0, 6)}
                   </p>
                   <h3 className="text-xl font-display font-bold text-[var(--color-on-surface)] leading-tight group-hover:text-primary transition-colors">
                     {task.title}
                   </h3>
                </div>
                {task.priority === 'high' ? (
                     <div className="bg-error-container text-on-error-container px-2.5 py-1 rounded font-black text-[10px] uppercase min-w-[70px] text-center shrink-0 ml-2">
                         High Priority
                     </div>
                ) : (
                     <div className="bg-secondary-container text-on-secondary-container px-2.5 py-1 rounded font-black text-[10px] uppercase min-w-[70px] text-center shrink-0 ml-2">
                         {task.priority}
                     </div>
                )}
              </div>

              {/* Grid Metadata */}
              <div className="grid grid-cols-2 gap-4 mt-6 mb-4">
                 <div className="flex flex-col">
                     <span className="text-[10px] uppercase font-bold text-[var(--color-on-surface-variant)] mb-1">Type</span>
                     <div className="flex items-center gap-1 text-[var(--color-on-surface)] text-sm font-medium">
                        <MapPin className="w-3.5 h-3.5 text-primary opacity-70" />
                        <span className="line-clamp-1">{(task.customFields as any)?.address ? 'Location Check' : 'Doc Verification'}</span>
                     </div>
                 </div>
                 <div className="flex flex-col">
                     <span className="text-[10px] uppercase font-bold text-[var(--color-on-surface-variant)] mb-1">Due Date</span>
                     <div className="flex items-center gap-1 text-[var(--color-on-surface)] text-sm font-medium">
                        <Clock className="w-3.5 h-3.5 text-primary opacity-70" />
                        <span>{formatDate(task.createdAt)}</span>
                     </div>
                 </div>
              </div>

              {/* Bottom Action Section */}
              <div className="flex items-center justify-between pt-4 gap-4 border-t border-[var(--color-surface-container-high)]">
                <div className="flex -space-x-2">
                   <div className="w-8 h-8 rounded-full border-2 border-[var(--color-surface-container-lowest)] bg-[var(--color-surface-container-highest)] flex items-center justify-center text-[10px] font-bold z-20">FE</div>
                   <div className="w-8 h-8 rounded-full border-2 border-[var(--color-surface-container-lowest)] bg-[var(--color-surface-container-high)] flex items-center justify-center z-10"><Users className="w-3 h-3 text-[var(--color-text-muted)]"/></div>
                </div>

                <button className="flex-1 max-w-[140px] flex items-center justify-between bg-[var(--color-primary)] text-[var(--color-on-primary)] px-4 py-2.5 rounded-[1rem] font-bold text-xs shadow-md group-hover:scale-[1.02] transition-all bg-gradient-to-br from-primary to-primary-container">
                  <span>Begin Check</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Bento Analytics */}
      <div className="grid grid-cols-2 gap-3 pt-2">
         <div className="bg-[var(--color-surface-container-lowest)] rounded-2xl p-5 shadow-[0px_4px_16px_rgba(15,23,42,0.04)] flex flex-col justify-between h-[100px]">
            <div className="flex items-center gap-2">
               <span className="text-[10px] font-black uppercase text-[var(--color-on-surface-variant)] tracking-widest">Active</span>
               <MapPin className="w-3 h-3 text-primary opacity-60" />
            </div>
            <p className="text-2xl font-display font-black text-[var(--color-on-surface)]">{activeCount} <span className="text-sm font-medium text-[var(--color-on-surface-variant)]">tasks</span></p>
         </div>
         <div className="bg-[var(--color-surface-container-lowest)] rounded-2xl p-5 shadow-[0px_4px_16px_rgba(15,23,42,0.04)] flex flex-col justify-between h-[100px]">
            <div className="flex items-center gap-2">
               <span className="text-[10px] font-black uppercase text-[var(--color-on-surface-variant)] tracking-widest">Completed</span>
               <Clock className="w-3 h-3 text-primary opacity-60" />
            </div>
            <p className="text-2xl font-display font-black text-[var(--color-on-surface)]">{completedCount} <span className="text-sm font-medium text-[var(--color-on-surface-variant)]">tasks</span></p>
         </div>
      </div>
    </div>
  );
}
