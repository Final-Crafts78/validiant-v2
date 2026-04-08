'use client';

import React from 'react';
import { WidgetProps } from '../types';
import { useProjects } from '@/hooks/useProjects';
import { useRealtime } from '@/hooks/useRealtime';

export default function KPIScorecard({}: WidgetProps) {
  const { data: projects = [] } = useProjects();
  // Realtime hook to ensure data is somewhat fresh if an event happens
  useRealtime();

  const activeProjects = projects.filter(p => !['completed', 'archived'].includes(p.status || '')).length;
  
  // derived from projects or mocked for now since global useTasks is not available
  const activeTasks = projects.length * 5 || 24; 
  const completedTasks = projects.length * 15 || 86;
  const totalTasks = activeTasks + completedTasks;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const metrics = [
    { label: 'Active Projects', value: activeProjects, trend: '+2', trendUp: true },
    { label: 'Active Tasks', value: activeTasks, trend: '-5', trendUp: true }, // less active is good?
    { label: 'Completion Rate', value: `${completionRate}%`, trend: '+4%', trendUp: true },
    { label: 'Total Members', value: 3, trend: '0', trendUp: true }, // Usually fetched from useMembers
  ];

  return (
    <div className="flex h-full w-full">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full content-center">
        {metrics.map((m, i) => (
          <div key={i} className="flex flex-col bg-[var(--color-surface-subtle)] p-4 rounded-2xl border border-[var(--color-border-base)]/5">
            <span className="text-[10px] font-black uppercase text-[var(--color-text-muted)] tracking-wider mb-2">
              {m.label}
            </span>
            <div className="flex items-end gap-3">
              <span className="text-3xl font-light text-[var(--color-text-base)]">
                {m.value}
              </span>
              <span className={`text-xs font-bold mb-1 ${m.trendUp ? 'text-green-500' : 'text-red-500'}`}>
                {m.trend}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
