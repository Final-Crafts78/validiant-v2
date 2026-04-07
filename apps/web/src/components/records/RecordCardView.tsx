'use client';

import React from 'react';
import { ProjectRecord, ProjectType } from '@validiant/shared';
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  Zap,
  User,
  MapPin,
  Calendar,
  Eye,
} from 'lucide-react';
import { format } from 'date-fns';

interface RecordCardViewProps {
  projectType: ProjectType;
  records: ProjectRecord[];
  onEdit: (recordId: string) => void;
}

const STATUS_CONFIG: Record<
  string,
  { icon: React.ElementType; color: string; bg: string }
> = {
  pending: { icon: Clock, color: 'text-amber-500', bg: 'bg-amber-500/10' },
  in_progress: { icon: Zap, color: 'text-primary', bg: 'bg-primary/10' },
  verified: {
    icon: CheckCircle2,
    color: 'text-emerald-500',
    bg: 'bg-emerald-500/10',
  },
  flagged: { icon: AlertCircle, color: 'text-rose-500', bg: 'bg-rose-500/10' },
};

export function RecordCardView({
  projectType,
  records,
  onEdit,
}: RecordCardViewProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {records.map((record) => {
        const resolvedStatus =
          STATUS_CONFIG[record.status] || STATUS_CONFIG['pending'];
        const StatusIcon = resolvedStatus?.icon || Clock;
        const statusColor = resolvedStatus?.color || 'text-slate-400';
        const statusBg = resolvedStatus?.bg || 'bg-slate-400/10';

        // Find if there's a photo field for preview
        const photoKey = projectType.columns?.find(
          (c) => c.columnType === 'photo_capture'
        )?.key;
        const photoUrl = photoKey ? (record.data[photoKey] as string) : null;

        const firstKey = Object.keys(record.data)[0];
        const titleValue = firstKey
          ? String(record.data[firstKey])
          : 'Untitled Node';

        return (
          <div
            key={record.id}
            onClick={() => onEdit(record.id)}
            className="group relative flex flex-col bg-surface-lowest border border-white/[0.03] rounded-[2.5rem] overflow-hidden shadow-obsidian hover:shadow-obsidian-lg hover:border-primary/20 transition-all cursor-pointer active:scale-[0.98]"
          >
            {/* Visual Header / Photo Preview */}
            <div className="relative h-48 bg-surface-container-low overflow-hidden">
              {photoUrl ? (
                <img
                  src={photoUrl}
                  alt="Record Evidence"
                  className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-700"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center opacity-10 bg-gradient-to-br from-primary/5 to-transparent">
                  <DatabaseIcon className="w-12 h-12 mb-2" />
                  <span className="text-[10px] font-black uppercase tracking-widest">
                    No Visual Evidence
                  </span>
                </div>
              )}

              {/* Overlays */}
              <div className="absolute top-4 left-4">
                <div
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${statusBg} backdrop-blur-md border border-white/5`}
                >
                  <StatusIcon className={`w-3.5 h-3.5 ${statusColor}`} />
                  <span className="text-[9px] font-black uppercase tracking-widest text-white/90">
                    {record.status.replace('_', ' ')}
                  </span>
                </div>
              </div>

              <div className="absolute bottom-4 right-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-md border border-white/5 opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0">
                  <Eye className="w-4 h-4 text-white" />
                </div>
              </div>
            </div>

            {/* Content Body */}
            <div className="p-6 space-y-5">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-black text-primary tracking-tighter">
                    #{record.number}
                  </span>
                  {record.gpsLat && (
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-emerald-500" />
                      <span className="text-[8px] font-bold text-emerald-500 uppercase">
                        Geo Locked
                      </span>
                    </div>
                  )}
                </div>
                <h5 className="text-sm font-bold text-white/90 truncate drop-shadow-sm">
                  {titleValue}
                </h5>
              </div>

              {/* Data Grid Preview */}
              <div className="grid grid-cols-2 gap-3">
                {projectType.columns?.slice(1, 3).map((col) => (
                  <div key={col.id} className="space-y-1">
                    <p className="text-[8px] font-black uppercase tracking-[0.2em] text-white/20">
                      {col.name}
                    </p>
                    <p className="text-[10px] font-bold text-white/60 truncate">
                      {String(record.data[col.key] || '—')}
                    </p>
                  </div>
                ))}
              </div>

              {/* Footer Meta */}
              <div className="pt-2 border-t border-white/[0.03] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-surface-container-low flex items-center justify-center">
                    <User className="w-3 h-3 text-white/30" />
                  </div>
                  <span className="text-[9px] font-bold text-white/40 uppercase tracking-widest">
                    {record.createdVia}
                  </span>
                </div>
                <div className="flex items-center gap-2 opacity-40">
                  <Calendar className="w-3 h-3" />
                  <span className="text-[9px] font-bold uppercase tracking-widest">
                    {format(new Date(record.createdAt), 'MMM dd')}
                  </span>
                </div>
              </div>
            </div>

            {/* Accent Border */}
            <div className="absolute inset-0 border-2 border-primary/0 group-hover:border-primary/10 rounded-[2.5rem] transition-all pointer-events-none" />
          </div>
        );
      })}
    </div>
  );
}

function DatabaseIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <ellipse cx="12" cy="5" rx="9" ry="3" />
      <path d="M3 5V19A9 3 0 0 0 21 19V5" />
      <path d="M3 12A9 3 0 0 0 21 12" />
    </svg>
  );
}
