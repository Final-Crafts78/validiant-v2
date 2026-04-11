'use client';

import React from 'react';
import { WidgetProps } from '../types';
import { Check, Edit2, Play, Plus } from 'lucide-react';

const activities = [
  {
    id: 1,
    user: 'AM',
    type: 'created',
    target: 'Project Alpha',
    time: '10m ago',
    icon: Plus,
    bgColor: 'bg-blue-500/10',
    color: 'text-blue-500',
  },
  {
    id: 2,
    user: 'JS',
    type: 'completed',
    target: 'Design Phase',
    time: '1h ago',
    icon: Check,
    bgColor: 'bg-green-500/10',
    color: 'text-green-500',
  },
  {
    id: 3,
    user: 'AM',
    type: 'started',
    target: 'Client Review',
    time: '2h ago',
    icon: Play,
    bgColor: 'bg-purple-500/10',
    color: 'text-purple-500',
  },
  {
    id: 4,
    user: 'TJ',
    type: 'updated',
    target: 'Project Beta',
    time: '4h ago',
    icon: Edit2,
    bgColor: 'bg-orange-500/10',
    color: 'text-orange-500',
  },
];

export default function RecentActivity(_props: WidgetProps) {
  return (
    <div className="flex h-full w-full flex-col gap-4">
      {activities.map((item) => {
        const Icon = item.icon;
        return (
          <div key={item.id} className="flex items-start gap-3">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${item.bgColor} ${item.color}`}
            >
              <Icon className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0 pt-1">
              <p className="text-sm text-[var(--color-text-base)]">
                <span className="font-semibold">{item.user}</span> {item.type}{' '}
                <span className="font-semibold">{item.target}</span>
              </p>
              <span className="text-[10px] text-[var(--color-text-muted)] tracking-wider">
                {item.time}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
