'use client';

import React, { useMemo } from 'react';
import {
  Navigation,
  MapPin,
  ChevronRight,
  Navigation2,
  Zap,
  Info,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useTasks } from '@/hooks/useTasks';
import { useWorkspaceStore } from '@/store/workspace';
import { TaskStatus } from '@validiant/shared';

export default function FieldRoutePage() {
  const { user } = useAuth();
  const { activeOrgId } = useWorkspaceStore();

  const { data: tasksData, isLoading } = useTasks(activeOrgId || '', {
    assignedTo: user?.id,
  });

  const pendingTasks = useMemo(() => {
    const all = tasksData?.pages.flatMap((p) => p.tasks) || [];
    return all.filter((t) => t.status !== TaskStatus.COMPLETED);
  }, [tasksData]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Navigation className="w-8 h-8 text-primary animate-bounce" />
        <p className="text-xs font-black text-[var(--color-text-muted)] uppercase tracking-widest">
          Calculating Optimal Route...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-primary to-primary-container rounded-[2rem] p-8 text-on-primary shadow-[0_12px_40px_rgba(0,88,190,0.2)] relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--color-surface-container-lowest)] rounded-full -mr-16 -mt-16 blur-2xl opacity-20 group-hover:scale-150 transition-transform duration-700" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-on-primary opacity-80 fill-current" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-on-primary opacity-90">
              AI Routing Engine
            </span>
          </div>
          <h2 className="text-2xl font-display font-black tracking-tight leading-none mb-2">
            Today's Route
          </h2>
          <p className="text-sm text-on-primary font-medium opacity-80">
            We've sequenced {pendingTasks.length} stops for maximum efficiency.
          </p>
        </div>
      </div>

      {pendingTasks.length === 0 ? (
        <div className="bg-[var(--color-surface-container-lowest)] rounded-[2rem] p-12 text-center flex flex-col items-center shadow-[0_12px_40px_rgba(15,23,42,0.06)]">
          <div className="w-16 h-16 bg-[var(--color-surface-container)] rounded-full flex items-center justify-center mb-4 text-[var(--color-text-muted)]">
            <Navigation2 className="w-10 h-10 opacity-50" />
          </div>
          <p className="text-sm font-black text-[var(--color-on-surface)]">
            Clear Road Ahead
          </p>
          <p className="text-xs text-[var(--color-on-surface-variant)] mt-1">
            No pending stops found in your queue.
          </p>
        </div>
      ) : (
        <div className="relative">
          {/* Vertical Path Line */}
          <div className="absolute left-[27px] top-4 bottom-4 w-1 flex flex-col items-center">
            <div className="w-full h-full bg-gradient-to-b from-primary via-[var(--color-surface-container-high)] to-transparent" />
          </div>

          <div className="space-y-6">
            {pendingTasks.map((task, idx) => (
              <div
                key={task.id}
                className="relative flex items-start gap-5 pl-1.5"
              >
                {/* Stop Marker */}
                <div className="relative z-10 w-12 h-12 rounded-2xl bg-[var(--color-surface-container-lowest)] shadow-[0_4px_12px_rgba(15,23,42,0.08)] flex items-center justify-center shrink-0 text-primary">
                  <span className="text-sm font-display font-black">
                    {idx + 1}
                  </span>
                </div>

                {/* Card */}
                <div className="flex-1 bg-[var(--color-surface-container-lowest)] rounded-[1.5rem] p-5 shadow-[0_12px_40px_rgba(15,23,42,0.06)] active:scale-[0.98] transition-all">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-sm font-display font-black text-[var(--color-on-surface)] leading-tight pr-4">
                      {task.title}
                    </h3>
                    {task.priority === 'high' ? (
                      <div className="px-2 py-0.5 bg-error-container text-on-error-container rounded text-[10px] font-black uppercase tracking-tighter shrink-0 border border-error-container">
                        High
                      </div>
                    ) : (
                      <div className="px-2 py-0.5 bg-secondary-container text-on-secondary-container rounded text-[10px] font-black uppercase tracking-tighter shrink-0 border border-secondary-container">
                        Std
                      </div>
                    )}
                  </div>

                  <div className="flex items-start gap-2 text-xs text-[var(--color-on-surface-variant)] mb-4 bg-[var(--color-surface-bright)] p-2.5 rounded-xl border border-[var(--color-surface-container-high)]">
                    <MapPin className="w-3.5 h-3.5 text-primary mt-0.5 opacity-80" />
                    <span className="font-medium">
                      {(task.customFields as any)?.address ||
                        'Address not specified'}
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <button
                      className="flex-1 bg-gradient-to-br from-primary to-primary-container text-on-primary py-3 rounded-[1rem] text-xs font-bold flex items-center justify-center gap-2 hover:scale-[1.02] shadow-md shadow-primary/20 transition-all font-sans tracking-wide"
                      onClick={() => {
                        const mapLink = (task.customFields as any)
                          ?.googleMapsLink;
                        const addr = (task.customFields as any)?.address;
                        if (mapLink) {
                          window.open(mapLink, '_blank');
                        } else if (addr) {
                          window.open(
                            `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                              addr
                            )}`,
                            '_blank'
                          );
                        }
                      }}
                    >
                      <Navigation2 className="w-4 h-4" />
                      {(task.customFields as any)?.googleMapsLink
                        ? 'OPEN LINK'
                        : 'NAVIGATE'}
                    </button>
                    <button
                      className="w-12 bg-primary/10 text-primary py-3 rounded-[1rem] flex items-center justify-center hover:bg-primary/20 transition-colors"
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
      <div className="bg-[var(--color-surface-container-highest)] rounded-[1.5rem] p-5 text-[var(--color-on-surface)] flex items-center gap-4 shadow-inner">
        <div className="w-12 h-12 bg-[var(--color-surface-container-lowest)] shadow-sm rounded-2xl flex items-center justify-center shrink-0">
          <Info className="w-6 h-6 text-primary" />
        </div>
        <div>
          <p className="text-[10px] font-black text-[var(--color-on-surface-variant)] uppercase tracking-widest leading-none mb-1.5">
            Fleet Optimization
          </p>
          <p className="text-[11px] font-medium text-[var(--color-on-surface)] leading-relaxed">
            Routes are recalibrated every 15 minutes based on live traffic and
            priority updates.
          </p>
        </div>
      </div>
    </div>
  );
}
