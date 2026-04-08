'use client';

import React, { useMemo } from 'react';
import {
  Upload,
  AlertCircle,
  CheckCircle2,
  Table,
  ShieldCheck,
  ShieldAlert,
} from 'lucide-react';
import { TypeColumn, ColumnType } from '@validiant/shared';

interface ValidationPreviewProps {
  data: any[];
  columns: TypeColumn[];
  mapping: Record<string, string>;
  onBack: () => void;
  onIngest: () => void;
}

/**
 * ValidationPreview - High-speed record check with real-time schema alignment.
 * Highlights protocol breaches and validates data integrity.
 */
export function ValidationPreview({
  data,
  columns,
  mapping,
  onBack,
  onIngest,
}: ValidationPreviewProps) {
  // 1. Process and Validate
  const validationResults = useMemo(() => {
    const previewData = data.slice(0, 100); // Only preview first 100 rows for performance
    let errorCount = 0;

    const processed = previewData.map((row, rowIdx) => {
      const rowErrors: Record<string, string> = {};
      const transformedRow: Record<string, any> = {};

      Object.entries(mapping).forEach(([csvHeader, schemaKey]) => {
        const value = row[csvHeader];
        const col = columns.find((c) => c.key === schemaKey);

        if (col) {
          transformedRow[schemaKey] = value;

          // Validation Logic
          if (
            col.settings?.required &&
            (value === undefined || value === null || value === '')
          ) {
            rowErrors[schemaKey] = 'REQUIRED_FIELD_MISSING';
          }

          if (
            col.columnType === ColumnType.NUMBER &&
            isNaN(Number(value)) &&
            value !== ''
          ) {
            rowErrors[schemaKey] = 'INVALID_NUMERIC_PROTOCOL';
          }
        }
      });

      const hasErrors = Object.keys(rowErrors).length > 0;
      if (hasErrors) errorCount++;

      return {
        id: rowIdx,
        data: transformedRow,
        errors: rowErrors,
        hasErrors,
      };
    });

    return { rows: processed, errorCount, total: previewData.length };
  }, [data, columns, mapping]);

  const canIngest = validationResults.errorCount === 0;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500 pb-10">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h4 className="text-xl font-bold text-[var(--color-text-base)] uppercase tracking-tight">
            Validation Preview
          </h4>
          <p className="text-[10px] text-[var(--color-text-base)]/30 uppercase font-black tracking-widest leading-relaxed">
            Previewing {validationResults.total} rows against protocol schema
          </p>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest text-[var(--color-text-base)]/40 hover:text-[var(--color-text-base)] border border-[var(--color-border-base)]/20 hover:bg-[var(--color-surface-muted)]/50 transition-all"
          >
            MODIFY_MAPPING
          </button>
          <button
            onClick={onIngest}
            disabled={!canIngest}
            className={`flex items-center gap-3 px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-2xl transition-all ${
              canIngest
                ? 'bg-emerald-500 text-[#0c1324] hover:bg-emerald-400 hover:scale-105 active:scale-95'
                : 'bg-[var(--color-surface-muted)]/50 text-[var(--color-text-base)]/20 cursor-not-allowed border border-rose-500/20'
            }`}
          >
            {canIngest ? 'COMMIT_TO_LEDGER' : 'DATA_PROTOCOL_BREACH'}{' '}
            <Upload className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#070d1f] p-6 rounded-[2rem] border border-[var(--color-border-base)]/20 space-y-2 group hover:border-[#adc6ff]/20 transition-all">
          <p className="text-[9px] font-black text-[var(--color-text-base)]/30 uppercase tracking-[0.3em] group-hover:text-[#adc6ff]/40 transition-colors">
            TOTAL_RECORDS
          </p>
          <div className="flex items-end justify-between">
            <h5 className="text-3xl font-black text-[var(--color-text-base)] italic">
              {data.length}
            </h5>
            <Table className="w-6 h-6 text-[var(--color-text-base)]/5" />
          </div>
        </div>
        <div className="bg-[#070d1f] p-6 rounded-[2rem] border border-[var(--color-border-base)]/20 space-y-2 group hover:border-emerald-500/20 transition-all">
          <p className="text-[9px] font-black text-[var(--color-text-base)]/30 uppercase tracking-[0.3em] group-hover:text-emerald-500/40 transition-colors">
            IDENTIFIED_STABLE
          </p>
          <div className="flex items-end justify-between">
            <h5 className="text-3xl font-black text-emerald-400 italic">
              {validationResults.total - validationResults.errorCount}
            </h5>
            <ShieldCheck className="w-6 h-6 text-emerald-500/20" />
          </div>
        </div>
        <div className="bg-[#070d1f] p-6 rounded-[2rem] border border-[var(--color-border-base)]/20 space-y-2 group hover:border-rose-500/20 transition-all">
          <p className="text-[9px] font-black text-[var(--color-text-base)]/30 uppercase tracking-[0.3em] group-hover:text-rose-500/40 transition-colors">
            PROTOCOL_ERRORS
          </p>
          <div className="flex items-end justify-between">
            <h5 className="text-3xl font-black text-rose-400 italic">
              {validationResults.errorCount}
            </h5>
            <ShieldAlert className="w-6 h-6 text-rose-500/20" />
          </div>
        </div>
      </div>

      {/* Validation Table */}
      <div className="bg-[#070d1f] rounded-[2.5rem] border border-[var(--color-border-base)]/20 overflow-hidden shadow-obsidian-xl backdrop-blur-xl">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-white/[0.02]">
                <th className="px-6 py-5 text-[9px] font-black text-[var(--color-text-base)]/20 uppercase tracking-widest border-r border-[var(--color-border-base)]/20 w-16">
                  IDX
                </th>
                <th className="px-6 py-5 text-[9px] font-black text-[var(--color-text-base)]/20 uppercase tracking-widest border-r border-[var(--color-border-base)]/20 w-24 text-center whitespace-nowrap">
                  STATUS
                </th>
                {Object.values(mapping)
                  .filter(Boolean)
                  .map((schemaKey) => {
                    const col = columns.find((c) => c.key === schemaKey);
                    return (
                      <th
                        key={schemaKey}
                        className="px-6 py-5 text-[9px] font-black text-[var(--color-text-base)]/40 uppercase tracking-widest border-r border-[var(--color-border-base)]/20 italic"
                      >
                        {col?.name || schemaKey}
                      </th>
                    );
                  })}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.03]">
              {validationResults.rows.map((row) => (
                <tr
                  key={row.id}
                  className={`group ${row.hasErrors ? 'bg-rose-500/[0.02]' : 'hover:bg-white/[0.01]'}`}
                >
                  <td className="px-6 py-4 text-[10px] font-mono text-[var(--color-text-base)]/10 group-hover:text-[var(--color-text-base)]/30 border-r border-[var(--color-border-base)]/20">
                    {row.id + 1}
                  </td>
                  <td className="px-6 py-4 border-r border-[var(--color-border-base)]/20 text-center">
                    {row.hasErrors ? (
                      <AlertCircle className="w-4 h-4 text-rose-500 inline-block drop-shadow-[0_0_8px_rgba(244,63,94,0.4)]" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 inline-block" />
                    )}
                  </td>
                  {Object.values(mapping)
                    .filter(Boolean)
                    .map((schemaKey) => {
                      const value = row.data[schemaKey];
                      const error = row.errors[schemaKey];
                      return (
                        <td
                          key={schemaKey}
                          className={`px-6 py-4 border-r border-[var(--color-border-base)]/20 relative group/cell ${
                            error ? 'bg-rose-500/10' : ''
                          }`}
                        >
                          <span
                            className={`text-xs font-medium tracking-tight ${error ? 'text-rose-400' : 'text-[var(--color-text-base)]/60'}`}
                          >
                            {value === undefined ||
                            value === null ||
                            value === '' ? (
                              <span className="opacity-20 font-mono italic">
                                NULL_VOID
                              </span>
                            ) : (
                              String(value)
                            )}
                          </span>
                          {error && (
                            <div className="absolute inset-0 bg-rose-500/10 opacity-0 group-hover/cell:opacity-100 flex items-center justify-center transition-opacity cursor-help">
                              <span className="bg-rose-500 text-[#0c1324] text-[8px] font-black px-2 py-1 rounded uppercase tracking-widest shadow-xl">
                                {error}
                              </span>
                            </div>
                          )}
                        </td>
                      );
                    })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {data.length > 100 && (
          <div className="p-6 bg-[#151b2d]/50 text-center border-t border-[var(--color-border-base)]/20">
            <p className="text-[10px] text-[var(--color-text-base)]/20 font-black uppercase tracking-widest italic">
              // Preview limited to first 100 elements. Total payload:{' '}
              {data.length} records.
            </p>
          </div>
        )}
      </div>

      {validationResults.errorCount > 0 && (
        <div className="bg-rose-500/10 border border-rose-500/20 rounded-[2rem] p-6 flex items-start gap-4 animate-in slide-in-from-top-2 duration-300">
          <ShieldAlert className="w-6 h-6 text-rose-400 mt-1" />
          <div className="space-y-1">
            <h5 className="text-[11px] font-black text-rose-400 uppercase tracking-widest leading-none">
              PROTOCOL_BREACH_DETECTED
            </h5>
            <p className="text-xs text-rose-400/60 font-medium leading-relaxed italic">
              Ingestion is locked until data alignment errors are resolved in
              the source file. {validationResults.errorCount} records failed
              protocol validation.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
