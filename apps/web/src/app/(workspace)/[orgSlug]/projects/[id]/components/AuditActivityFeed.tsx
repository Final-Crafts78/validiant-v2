'use client';

import {
  History,
  CheckCircle,
  UserPlus,
  Edit3,
  FilePlus,
  ArrowRight,
} from 'lucide-react';
import { ProjectRecord } from '@validiant/shared';
import { formatDistanceToNow } from 'date-fns';

interface ActivityItemProps {
  type: 'created' | 'updated' | 'status_changed' | 'assigned';
  message: string;
  user: string;
  timestamp: string;
  recordId?: string;
}

function ActivityItem({
  type,
  message,
  user,
  timestamp,
  recordId,
}: ActivityItemProps) {
  const getIcon = () => {
    switch (type) {
      case 'created':
        return <FilePlus className="w-4 h-4 text-primary" />;
      case 'updated':
        return <Edit3 className="w-4 h-4 text-amber-400" />;
      case 'status_changed':
        return <CheckCircle className="w-4 h-4 text-emerald-400" />;
      case 'assigned':
        return <UserPlus className="w-4 h-4 text-violet-400" />;
      default:
        return <History className="w-4 h-4 text-[var(--text-muted)]" />;
    }
  };

  return (
    <div className="flex gap-4 group">
      <div className="flex flex-col items-center">
        <div className="w-8 h-8 rounded-full bg-white/5 border border-white/5 flex items-center justify-center group-hover:border-white/10 transition-colors">
          {getIcon()}
        </div>
        <div className="w-px h-full bg-white/5 group-last:bg-transparent mt-2" />
      </div>

      <div className="pb-6 w-full">
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm text-[#dce1fb] font-medium leading-tight">
            {message}
          </p>
          <span className="text-[10px] whitespace-nowrap font-bold text-[var(--text-muted)] uppercase tracking-widest leading-none">
            {timestamp}
          </span>
        </div>
        <div className="flex items-center gap-2 mt-2">
          <div className="w-4 h-4 rounded-full bg-[#adc6ff]/20 flex items-center justify-center">
            <span className="text-[8px] font-black text-primary">
              {user.charAt(0).toUpperCase()}
            </span>
          </div>
          <span className="text-xs text-[var(--text-muted)] font-medium">
            @{user}
          </span>

          {recordId && (
            <>
              <ArrowRight className="w-3 h-3 text-[var(--text-muted)]/40" />
              <span className="text-[10px] font-mono font-bold text-primary bg-[#adc6ff]/5 px-2 py-0.5 rounded border border-[#adc6ff]/10">
                {recordId}
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export function AuditActivityFeed({
  records,
}: {
  projectId: string;
  records: ProjectRecord[];
}) {
  // Generate data-driven activities from real records
  const activities: ActivityItemProps[] = records
    .sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    )
    .slice(0, 5)
    .map((r) => ({
      type: r.status === 'completed' ? 'status_changed' : 'updated',
      message:
        r.status === 'completed'
          ? `Record #${r.number} verified successfully`
          : `Record #${r.number} details modified`,
      user: 'system.node', // In a real app, this would come from activity logs
      timestamp: formatDistanceToNow(new Date(r.updatedAt), {
        addSuffix: true,
      }),
      recordId: r.displayId || `#${r.number}`,
    }));

  return (
    <div className="bg-[var(--surface-container-low)] rounded-[2.5rem] border border-white/5 p-8 h-full">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#adc6ff]/10 rounded-2xl flex items-center justify-center text-primary">
            <History className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-black text-[#dce1fb] tracking-tight">
              Recent Audit Activity
            </h3>
            <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mt-0.5">
              FORENSIC LOGS • REAL-TIME
            </p>
          </div>
        </div>

        <button className="text-xs font-bold text-primary hover:underline">
          View All Logs
        </button>
      </div>

      <div className="space-y-1">
        {activities.map((activity, idx) => (
          <ActivityItem key={idx} {...activity} />
        ))}
      </div>
    </div>
  );
}
