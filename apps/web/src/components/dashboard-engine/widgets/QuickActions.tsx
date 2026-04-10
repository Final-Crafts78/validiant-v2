'use client';

import React from 'react';
import { WidgetProps } from '../types';
import { FolderPlus, CheckSquare, Users, Settings, Activity } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function QuickActions({ orgId, isEditing }: WidgetProps) {
  const params = useParams();
  const orgSlug = params?.orgSlug as string;
  const actions = [
    { name: 'New Project', icon: FolderPlus, color: 'text-blue-500', bg: 'bg-blue-500/10', onClick: () => console.log('Create project') },
    { name: 'Add Task', icon: CheckSquare, color: 'text-green-500', bg: 'bg-green-500/10', onClick: () => console.log('Create task') },
    { name: 'Invite Member', icon: Users, color: 'text-purple-500', bg: 'bg-purple-500/10', onClick: () => console.log('Invite') },
    { name: 'Analytics', icon: Activity, color: 'text-orange-500', bg: 'bg-orange-500/10', href: `/${orgSlug}/analytics` },
    { name: 'Settings', icon: Settings, color: 'text-gray-500', bg: 'bg-gray-500/10', href: `/${orgSlug}/settings` },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
      {actions.map((action, idx) => {
        const Icon = action.icon;
        
        const content = (
          <div className="flex flex-col items-center justify-center p-4 text-center gap-2 h-full cursor-pointer group">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${action.bg} ${action.color} group-hover:scale-110 transition-transform`}>
              <Icon className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-[var(--color-text-base)] mt-1">
              {action.name}
            </span>
          </div>
        );

        const classNameString = `rounded-2xl border border-[var(--color-border-base)]/10 bg-[var(--color-surface-subtle)] hover:bg-[var(--color-surface-muted)] transition-colors ${isEditing ? 'pointer-events-none' : ''}`;

        if (action.href) {
          return (
             <Link key={idx} href={action.href} className={classNameString} onClick={(e) => { if(isEditing) e.preventDefault(); }}>
                {content}
             </Link>
          );
        }

        return (
          <button key={idx} onClick={action.onClick} className={classNameString}>
            {content}
          </button>
        );
      })}
    </div>
  );
}
