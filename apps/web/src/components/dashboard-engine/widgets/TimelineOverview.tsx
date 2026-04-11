'use client';

import React from 'react';
import { WidgetProps } from '../types';

const milestones = [
  { id: 1, name: 'Kickoff', date: 'Jul 1', status: 'completed' },
  { id: 2, name: 'Design Fix', date: 'Jul 15', status: 'completed' },
  { id: 3, name: 'Beta Launch', date: 'Aug 10', status: 'active' },
  { id: 4, name: 'Release V1', date: 'Sep 1', status: 'pending' },
];

export default function TimelineOverview(_props: WidgetProps) {
  return (
    <div className="flex flex-col h-full w-full justify-center">
      <div className="relative flex items-center justify-between w-full mt-4 px-2">
        {/* Connecting Line */}
        <div className="absolute left-[10%] right-[10%] h-0.5 bg-[var(--color-border-base)]/20 top-1/2 -translate-y-1/2 z-0" />

        {/* Milestones */}
        {milestones.map((m) => (
          <div
            key={m.id}
            className="relative z-10 flex flex-col items-center group"
          >
            <div
              className={`w-4 h-4 rounded-full border-2 ${
                m.status === 'completed'
                  ? 'bg-primary border-primary'
                  : m.status === 'active'
                    ? 'bg-[var(--color-surface-base)] border-primary shadow-[0_0_10px_var(--color-accent-base)]'
                    : 'bg-[var(--color-surface-base)] border-[var(--color-border-base)]'
              } transition-all`}
            />
            <div className="absolute top-6 w-max text-center">
              <span className="block text-xs font-bold text-[var(--color-text-base)]">
                {m.name}
              </span>
              <span className="block text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider">
                {m.date}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
