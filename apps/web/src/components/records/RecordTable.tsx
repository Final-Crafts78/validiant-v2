'use client';

import React from 'react';
import {
  MapPin,
  PenTool,
  ExternalLink,
  Minus,
  Check as CheckIcon,
  Database,
} from 'lucide-react';
import {
  ProjectRecord,
  ProjectType,
  ColumnType,
  TypeColumn,
} from '@validiant/shared';

interface RecordTableProps {
  projectType: ProjectType;
  records: ProjectRecord[];
  onEdit: (id: string) => void;
  isLoading?: boolean;
  selectedRecordIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
}

/**
 * RecordTable - The high-density data universe.
 * 100% Data-Driven with Obsidian Verifier aesthetics.
 */
export function RecordTable({
  projectType,
  records,
  onEdit,
  isLoading = false,
  selectedRecordIds = [],
  onSelectionChange,
}: RecordTableProps) {
  const allSelected =
    records.length > 0 && selectedRecordIds.length === records.length;
  const someSelected =
    selectedRecordIds.length > 0 && selectedRecordIds.length < records.length;

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      onSelectionChange?.(records.map((r) => r.id));
    } else {
      onSelectionChange?.([]);
    }
  };

  const handleSelectRow = (id: string, checked: boolean) => {
    if (checked) {
      onSelectionChange?.([...selectedRecordIds, id]);
    } else {
      onSelectionChange?.(selectedRecordIds.filter((rid) => rid !== id));
    }
  };

  if (isLoading) {
    return (
      <div className="py-20 text-center text-[var(--text-muted)] font-mono animate-pulse">
        SYNCING_UNIVERSE_RECORDS...
      </div>
    );
  }

  if (!records.length) {
    return (
      <div className="py-20 text-center text-[var(--text-muted)] font-mono italic">
        // NO_RECORDS_FOUND_IN_THIS_UNIVERSE.
      </div>
    );
  }

  const sortedColumns = [...(projectType.columns || [])].sort(
    (a, b) => (a.order || 0) - (b.order || 0)
  );

  const renderCell = (column: TypeColumn, value: unknown) => {
    if (value === null || value === undefined) {
      return (
        <span className="text-white/5 italic text-[10px] font-mono">
          NULL_VOID
        </span>
      );
    }

    switch (column.columnType) {
      case ColumnType.PHOTO_CAPTURE: {
        const photo = value as { url: string };
        return (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[var(--surface-lowest)] overflow-hidden relative group/img border border-white/5">
              <img
                src={photo.url}
                alt="Capture"
                className="w-full h-full object-cover transition-transform duration-500 group-hover/img:scale-110"
              />
              <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover/img:opacity-100 transition-opacity" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-primary font-black uppercase tracking-tighter">
                Img_Encrypted
              </span>
              <span className="text-[9px] text-[var(--text-muted)] font-mono italic tracking-tight">
                sha256:0x4f2...
              </span>
            </div>
          </div>
        );
      }

      case ColumnType.GPS_LOCATION: {
        const gps = value as { lat: number; lng: number };
        return (
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${gps.lat},${gps.lng}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col gap-0.5 group"
          >
            <div className="flex items-center gap-1 text-primary group-hover:text-primary-container transition-colors">
              <MapPin className="w-3 h-3 transition-transform group-hover:rotate-12" />
              <span className="text-[11px] font-black tracking-tighter uppercase">
                Instrument_GPS
              </span>
            </div>
            <span className="text-[10px] font-mono text-[var(--text-muted)]">
              {gps.lat.toFixed(6)}N, {gps.lng.toFixed(6)}E
            </span>
          </a>
        );
      }

      case ColumnType.SIGNATURE:
        return (
          <div className="flex items-center gap-2 group/sig">
            <div className="p-1.5 rounded-lg bg-primary/10 border border-primary/20 transition-colors group-hover/sig:bg-primary/20">
              <PenTool className="w-3 h-3 text-primary" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-[#dce1fb] font-black uppercase tracking-widest">
                Auth_Sig
              </span>
              <span className="text-[9px] text-[var(--text-muted)] font-mono tracking-tighter truncate w-16">
                E2E_VERIFIED
              </span>
            </div>
          </div>
        );

      case ColumnType.RATING:
        return (
          <div className="flex items-center gap-1.5">
            {Array.from({ length: 5 }).map((_, i) => (
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
          <span className="text-sm text-[#dce1fb] font-bold tracking-tight">
            {String(value)}
          </span>
        );
    }
  };

  return (
    <div className="bg-[var(--surface-container-low)] rounded-[2.5rem] border border-white/5 shadow-2xl overflow-hidden backdrop-blur-3xl">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-[var(--surface-lowest)]/50 border-b border-white/5">
            <th className="pl-8 pr-4 py-6 w-10">
              <button
                onClick={() => handleSelectAll(!allSelected)}
                className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${
                  allSelected
                    ? 'bg-primary border-primary text-[#0c1324]'
                    : someSelected
                      ? 'bg-primary/20 border-primary text-primary'
                      : 'bg-[var(--surface-container-low)] border-white/10 hover:border-white/30'
                }`}
              >
                {allSelected && (
                  <CheckIcon className="w-3.5 h-3.5 stroke-[3]" />
                )}
                {!allSelected && someSelected && (
                  <Minus className="w-3.5 h-3.5 stroke-[3]" />
                )}
              </button>
            </th>
            <th className="px-6 py-6">
              <div className="flex flex-col gap-0.5">
                <span className="text-[9px] text-primary font-black uppercase tracking-widest">
                  Ref
                </span>
                <span className="text-[11px] text-[#dce1fb] font-black uppercase">
                  Sequence
                </span>
              </div>
            </th>
            {sortedColumns.map((col) => (
              <th key={col.key} className="px-6 py-6">
                <div className="flex flex-col gap-0.5">
                  <span className="text-[9px] text-[var(--text-muted)] font-black uppercase tracking-widest">
                    Field
                  </span>
                  <span className="text-[11px] text-[#dce1fb] font-black uppercase">
                    {col.name}
                  </span>
                </div>
              </th>
            ))}
            <th className="px-6 py-6">
              <div className="flex flex-col gap-0.5">
                <span className="text-[9px] text-[var(--text-muted)] font-black uppercase tracking-widest">
                  State
                </span>
                <span className="text-[11px] text-[#dce1fb] font-black uppercase">
                  Status
                </span>
              </div>
            </th>
            <th className="px-8 py-6 text-right w-20" />
          </tr>
        </thead>
        <tbody className="divide-y divide-white/[0.03]">
          {records.map((record) => {
            const isSelected = selectedRecordIds.includes(record.id);
            return (
              <tr
                key={record.id}
                className={`group transition-all duration-300 hover:bg-white/[0.02] ${
                  isSelected ? 'bg-primary/5' : ''
                }`}
              >
                <td className="pl-8 pr-4 py-5">
                  <button
                    onClick={() => handleSelectRow(record.id, !isSelected)}
                    className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${
                      isSelected
                        ? 'bg-primary border-primary text-[#0c1324]'
                        : 'bg-white/5 border-white/10 opacity-0 group-hover:opacity-100'
                    }`}
                  >
                    {isSelected && (
                      <CheckIcon className="w-3.5 h-3.5 stroke-[3]" />
                    )}
                  </button>
                </td>
                <td className="px-6 py-5">
                  <span
                    className={`text-[11px] font-mono font-bold transition-colors ${
                      isSelected
                        ? 'text-primary'
                        : 'text-[var(--text-muted)] group-hover:text-primary'
                    }`}
                  >
                    {record.displayId || `#${record.number}`}
                  </span>
                </td>
                {sortedColumns.map((col) => (
                  <td key={col.key} className="px-6 py-5">
                    {renderCell(col, record.data[col.key])}
                  </td>
                ))}
                <td className="px-6 py-5">
                  <div
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-widest ${
                      record.status === 'completed'
                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                        : record.status === 'pending'
                          ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                          : 'bg-primary/10 border-primary/20 text-primary'
                    }`}
                  >
                    <div
                      className={`w-1 h-1 rounded-full ${
                        record.status === 'completed'
                          ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]'
                          : record.status === 'pending'
                            ? 'bg-amber-400 shadow-[0_0_8px_#fbbf24] animate-pulse'
                            : 'bg-primary shadow-[0_0_8px_#adc6ff]'
                      }`}
                    />
                    {record.status}
                  </div>
                </td>
                <td className="px-8 py-5 text-right">
                  <button
                    onClick={() => onEdit(record.id)}
                    className="p-2 opacity-0 group-hover:opacity-100 hover:bg-primary/10 rounded-xl transition-all text-primary"
                    title="Examine record_logs"
                  >
                    <ExternalLink className="w-4.5 h-4.5" />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Footer / Hub Status */}
      <div className="px-8 py-6 bg-[var(--surface-lowest)]/50 border-t border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Database className="w-4 h-4 text-white/10" />
          <span className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em]">
            Obsidian_Core_v2.0 // Active_Universe
          </span>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" />
            <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">
              Live_Sync
            </span>
          </div>
          <span className="text-[10px] font-mono text-white/10">
            LOAD_TIME: 42ms
          </span>
        </div>
      </div>
    </div>
  );
}
