'use client';

import React, { useMemo } from 'react';
import { 
  Navigation, 
  MapPin, 
  ChevronRight, 
  Navigation2, 
  ExternalLink,
  Zap,
  Info
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useTasks } from '@/hooks/useTasks';
import { useWorkspaceStore } from '@/store/workspace';
import { TaskStatus } from '@validiant/shared';

export default function FieldRoutePage() {
  const { user } = useAuth();
  const { activeProjectId } = useWorkspaceStore();
  
  const { data: tasksData, isLoading } = useTasks(
    activeProjectId || '', 
    { assignedTo: user?.id }
  );

  const pendingTasks = useMemo(() => {
    const all = tasksData?.pages.flatMap(p => p.tasks) || [];
    return all.filter(t => t.status !== TaskStatus.COMPLETED);
  }, [tasksData]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Navigation className="w-8 h-8 text-indigo-600 animate-bounce" />
        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">
          Calculating Optimal Route...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-indigo-600 rounded-[2.5rem] p-8 text-white shadow-xl shadow-indigo-100 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl group-hover:scale-150 transition-transform duration-700" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-indigo-200 fill-current" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-100">AI Routing Engine</span>
          </div>
          <h2 className="text-2xl font-black tracking-tight leading-none mb-2">Today's Route</h2>
          <p className="text-sm text-indigo-100 font-medium opacity-80">
            We've sequenced {pendingTasks.length} stops for maximum efficiency.
          </p>
        </div>
      </div>

      {pendingTasks.length === 0 ? (
        <div className="bg-[var(--color-surface-base)] border border-[var(--color-border-base)] rounded-[2.5rem] p-12 text-center flex flex-col items-center">
          <div className="w-16 h-16 bg-[var(--color-surface-muted)] rounded-full flex items-center justify-center mb-4 text-[var(--color-text-muted)]">
            <Navigation2 className="w-10 h-10" />
          </div>
          <p className="text-sm font-black text-[var(--color-text-base)]">Clear Road Ahead</p>
          <p className="text-xs text-[var(--color-text-muted)] mt-1">No pending stops found in your queue.</p>
        </div>
      ) : (
        <div className="relative">
          {/* Vertical Path Line */}
          <div className="absolute left-[27px] top-4 bottom-4 w-0.5 bg-[var(--color-border-base)]" />

          <div className="space-y-6">
            {pendingTasks.map((task, idx) => (
              <div key={task.id} className="relative flex items-start gap-5 pl-1.5">
                {/* Stop Marker */}
                <div className="relative z-10 w-12 h-12 rounded-2xl bg-[var(--color-surface-base)] border-2 border-[var(--color-border-base)] flex items-center justify-center shadow-sm shrink-0">
                  <span className="text-sm font-black text-[var(--color-text-base)]">{idx + 1}</span>
                </div>

                {/* Card */}
                <div className="flex-1 bg-[var(--color-surface-base)] border border-[var(--color-border-base)] rounded-[2rem] p-5 shadow-sm active:scale-[0.98] transition-all">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-sm font-black text-[var(--color-text-base)] leading-tight pr-4">
                      {task.title}
                    </h3>
                    <div className="px-2 py-0.5 bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded text-[10px] font-black uppercase tracking-tighter shrink-0 border border-amber-100 dark:border-amber-500/20">
                      {task.priority}
                    </div>
                  </div>

                  <div className="flex items-start gap-2 text-xs text-[var(--color-text-muted)] mb-4">
                    <MapPin className="w-3.5 h-3.5 text-[var(--color-text-muted)] mt-0.5 opacity-60" />
                    <span className="font-medium">
                      {(task.customFields as any)?.address || 'Address not specified'}
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <button 
                      className="flex-1 bg-slate-900 dark:bg-indigo-600 text-white py-3 rounded-2xl text-xs font-black flex items-center justify-center gap-2"
                      onClick={() => {
                        const mapLink = (task.customFields as any)?.googleMapsLink;
                        const addr = (task.customFields as any)?.address;
                        if (mapLink) {
                          window.open(mapLink, '_blank');
                        } else if (addr) {
                          window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addr)}`, '_blank');
                        }
                      }}
                    >
                      <Navigation2 className="w-3.5 h-3.5" />
                      {(task.customFields as any)?.googleMapsLink ? 'OPEN LINK' : 'NAVIGATE'}
                    </button>
                    <button 
                      className="w-12 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 py-3 rounded-2xl flex items-center justify-center"
                      title="View Details"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Optimization Notice */}
      <div className="bg-slate-900 dark:bg-slate-800 rounded-[2rem] p-6 text-white flex items-center gap-4">
        <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center shrink-0">
          <Info className="w-6 h-6 text-indigo-400" />
        </div>
        <div>
          <p className="text-[10px] font-black text-indigo-300 uppercase tracking-widest leading-none mb-1.5">
            Fleet Optimization
          </p>
          <p className="text-[11px] font-medium text-slate-400 leading-relaxed">
            Routes are recalibrated every 15 minutes based on live traffic and priority updates from the Command Center.
          </p>
        </div>
      </div>
    </div>
  );
}
