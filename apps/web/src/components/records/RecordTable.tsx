'use client';

import React from 'react';
import { ProjectRecord, ProjectType, ColumnType, TypeColumn } from '@validiant/shared';
import { MapPin, PenTool, ExternalLink } from 'lucide-react';

interface RecordTableProps {
  projectType: ProjectType;
  records: ProjectRecord[];
  onEdit: (id: string) => void;
  isLoading?: boolean;
}

/**
 * RecordTable - Dynamic table for Data Universe records
 * Displays columns based on the ProjectType definition.
 */
export const RecordTable: React.FC<RecordTableProps> = ({
  projectType,
  records,
  onEdit,
  isLoading,
}) => {
  if (isLoading) {
    return (
      <div className="py-20 text-center text-white/40">
        Syncing Universe Records...
      </div>
    );
  }

  if (!records.length) {
    return (
      <div className="py-20 text-center text-white/20">
        No records found in this universe.
      </div>
    );
  }

  const sortedColumns = [...(projectType.columns || [])].sort(
    (a, b) => (a.order || 0) - (b.order || 0)
  );

  const renderCell = (column: TypeColumn, value: any) => {
    if (!value) {
      return (
        <span className="text-white/10 italic text-[10px]">null_void</span>
      );
    }

    switch (column.columnType) {
      case ColumnType.PHOTO_CAPTURE:
        return (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-surface-container-highest overflow-hidden relative group/img">
              <img
                src={(value as any).url}
                alt="Capture"
                className="w-full h-full object-cover transition-transform duration-500 group-hover/img:scale-110"
              />
              <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover/img:opacity-100 transition-opacity" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-primary font-bold uppercase tracking-tighter">
                Verified_Img
              </span>
              <span className="text-[9px] text-white/30 font-mono italic">
                h_0x4f2...
              </span>
            </div>
          </div>
        );

      case ColumnType.GPS_LOCATION:
        return (
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${(value as any).lat},${(value as any).lng}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col gap-0.5 group"
          >
            <div className="flex items-center gap-1 text-primary">
              <MapPin className="w-3 h-3 transition-transform group-hover:rotate-12" />
              <span className="text-[11px] font-bold tracking-tight">
                Instrument_GPS
              </span>
            </div>
            <span className="text-[10px] font-mono text-white/30">
              {(value as any).lat.toFixed(6)}N, {(value as any).lng.toFixed(6)}E
            </span>
          </a>
        );

      case ColumnType.SIGNATURE:
        return (
          <div className="flex items-center gap-2 group/sig">
            <div className="p-1.5 rounded bg-primary/10 transition-colors group-hover/sig:bg-primary/20">
              <PenTool className="w-3 h-3 text-primary" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-white/60 font-bold uppercase">
                Hash_Auth
              </span>
              <span className="text-[9px] text-white/20 font-mono tracking-tighter truncate w-16">
                SIG_E2E_PRO
              </span>
            </div>
          </div>
        );

      case ColumnType.RATING:
        return (
          <div className="flex items-center gap-1">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                  i < (value as number)
                    ? 'bg-primary shadow-[0_0_8px_rgba(173,198,255,0.6)]'
                    : 'bg-white/5'
                }`}
              />
            ))}
          </div>
        );

      default:
        return (
          <span className="text-sm text-white/80 font-medium">
            {String(value)}
          </span>
        );
    }
  };

  return (
    <div className="bg-surface-container-low rounded-2xl shadow-obsidian overflow-hidden">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-surface-lowest/50">
            <th className="px-6 py-5">
              <div className="flex flex-col gap-0.5">
                <span className="text-[9px] text-primary font-bold uppercase tracking-[0.2em]">
                  Ref
                </span>
                <span className="text-[11px] text-white/60 font-display">
                  Sequence
                </span>
              </div>
            </th>
            {sortedColumns.map((col) => (
              <th key={col.key} className="px-6 py-5">
                <div className="flex flex-col gap-0.5">
                  <span className="text-[9px] text-primary/40 font-bold uppercase tracking-[0.2em]">
                    Field
                  </span>
                  <span className="text-[11px] text-white/60 font-display">
                    {col.name}
                  </span>
                </div>
              </th>
            ))}
            <th className="px-6 py-5">
              <div className="flex flex-col gap-0.5">
                <span className="text-[9px] text-primary/40 font-bold uppercase tracking-[0.2em]">
                  State
                </span>
                <span className="text-[11px] text-white/60 font-display">
                  Status
                </span>
              </div>
            </th>
            <th className="px-6 py-5"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/[0.02]">
          {records.map((record) => (
            <tr
              key={record.id}
              className="group hover:bg-surface-bright/30 transition-all duration-500"
            >
              <td className="px-6 py-4">
                <span className="text-xs font-mono text-white/40 group-hover:text-primary transition-colors">
                  {record.displayId || `#${record.number}`}
                </span>
              </td>
              {sortedColumns.map((col) => (
                <td key={col.key} className="px-6 py-4">
                  {renderCell(col, (record.data as any)[col.key])}
                </td>
              ))}
              <td className="px-6 py-4 font-mono">
                <div className="badge badge-primary">
                  <div
                    className={`badge-dot ${
                      record.status === 'completed'
                        ? 'bg-emerald-400'
                        : 'bg-primary animate-pulse'
                    }`}
                  />
                  {record.status}
                </div>
              </td>
              <td className="px-6 py-4">
                <button
                  onClick={() => onEdit(record.id)}
                  className="p-2 opacity-0 group-hover:opacity-100 bg-primary/10 hover:bg-primary/20 rounded-lg transition-all text-primary"
                >
                  <ExternalLink className="w-4 h-4" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
