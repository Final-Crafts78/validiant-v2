'use client';
import React from 'react';
import { TypeColumn, ColumnType } from '@validiant/shared';
import {
  MapPin,
  Camera,
  FileSignature,
  CheckSquare,
  ChevronRight,
  Database,
  Star,
  Barcode,
  Calculator,
  Calendar,
  ChevronLeft,
  AlertCircle,
} from 'lucide-react';

interface MobileSchemaPreviewProps {
  typeName: string;
  columns: TypeColumn[];
}

/**
 * MobileSchemaPreview - High-fidelity mock of the Field App.
 * Provides real-time visual feedback of the schema being built.
 */
export function MobileSchemaPreview({
  typeName,
  columns,
}: MobileSchemaPreviewProps) {
  const [mockValues, setMockValues] = React.useState<Record<string, unknown>>(
    {}
  );
  const [currentPage, setCurrentPage] = React.useState(0);
  const sortedColumns = [...(columns || [])].sort(
    (a, b) => (a.order || 0) - (b.order || 0)
  );

  // Logic to determine if a field should be visible
  const isFieldVisible = (col: TypeColumn) => {
    if (!col.settings?.conditions || col.settings.conditions.length === 0)
      return true;

    return col.settings.conditions.every((cond) => {
      const val = mockValues[cond.fieldKey];
      switch (cond.operator) {
        case 'equals':
          return String(val) === String(cond.value);
        case 'not_equals':
          return String(val) !== String(cond.value);
        case 'is_set':
          return val !== undefined && val !== null && val !== '';
        case 'is_not_set':
          return val === undefined || val === null || val === '';
        case 'is_checked':
          return !!val;
        default:
          return true;
      }
    });
  };

  const visibleColumns = sortedColumns.filter(isFieldVisible);

  // Group by sections for multi-page flow
  const sections: { name: string; columns: TypeColumn[] }[] = [];
  visibleColumns.forEach((col) => {
    if (col.columnType === ColumnType.HEADING) {
      sections.push({ name: col.name, columns: [] });
    } else {
      if (sections.length === 0) {
        sections.push({ name: 'INITIAL_DETAILS', columns: [] });
      }
      const lastSection = sections[sections.length - 1];
      if (lastSection) {
        lastSection.columns.push(col);
      }
    }
  });

  const activeSection = sections[currentPage] || sections[0];
  const totalPages = sections.length;

  return (
    <div className="w-[320px] shrink-0 sticky top-8 h-[640px] bg-[#070d1f] rounded-[3rem] border-[8px] border-[#151b2d] shadow-2xl overflow-hidden flex flex-col group self-start shadow-obsidian-2xl">
      {/* Notch / Status Bar */}
      <div className="h-6 w-24 bg-[#151b2d] mx-auto rounded-b-2xl absolute top-0 left-1/2 -translate-x-1/2 z-20" />

      <div className="flex-1 flex flex-col relative overflow-hidden bg-gradient-to-b from-[#0c1324] to-[#070d1f]">
        {/* App Header */}
        <header className="px-6 pt-10 pb-4 bg-[#0c1324]/80 backdrop-blur-md border-b border-[var(--color-border-base)]/20 z-10 transition-all duration-500">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[9px] font-black text-[#5686f5] uppercase tracking-widest opacity-60">
              VALDIANT.EXE
            </span>
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
          </div>
          <h4 className="text-[15px] font-black text-[var(--color-text-base)] tracking-tight truncate leading-tight uppercase font-display">
            {typeName || 'New Universe Protocol'}
          </h4>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 scroller-hidden">
          {sortedColumns.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-10 py-20 grayscale scale-[0.9]">
              <Database className="w-16 h-16 mb-6" />
              <div className="space-y-2">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] font-mono">
                  Awaiting_Injection
                </p>
                <p className="text-[8px] font-mono tracking-widest uppercase">
                  Initialize Field Elements
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Record Metadata (Standard Mobile View) */}
              <div className="bg-[#151b2d]/50 rounded-2xl p-4 border border-[var(--color-border-base)]/20 space-y-3 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-2 opacity-5">
                  <Database className="w-8 h-8" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[8px] font-bold text-[var(--color-text-base)]/20 uppercase tracking-widest font-mono">
                    REC_NO
                  </span>
                  <span className="text-[10px] font-black text-[#adc6ff] font-mono">
                    #AUTO_SEQ
                  </span>
                </div>
                <div className="h-px bg-[var(--color-surface-muted)]/50" />
                <div className="flex items-center justify-between">
                  <span className="text-[8px] font-bold text-[var(--color-text-base)]/20 uppercase tracking-widest font-mono">
                    OPERATOR
                  </span>
                  <span className="text-[10px] font-black text-[var(--color-text-base)]/40 font-mono">
                    @system.node
                  </span>
                </div>
              </div>

              {/* Section Header Bar */}
              {activeSection && (
                <div className="bg-[#009688]/15 border-l-4 border-[#009688] p-3 rounded-r-xl mb-4 flex items-center justify-between group">
                  <span className="text-[9px] font-black text-[#009688] uppercase tracking-[0.2em] relative z-10">
                    {activeSection.name}
                  </span>
                  <div className="flex gap-1.5 opacity-40">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#009688]" />
                    <div className="w-1.5 h-1.5 rounded-full bg-[#009688]" />
                  </div>
                </div>
              )}

              {/* Dynamic Columns for current section */}
              {activeSection?.columns.map((col) => {
                const rule = col.settings?.validationRules?.[0];
                const val = String(mockValues[col.key] || '');
                const hasError =
                  rule &&
                  rule.type === 'preset' &&
                  val &&
                  !new RegExp(rule.value as string).test(val);

                return (
                  <div
                    key={col.id}
                    className={`bg-[#151b2d] rounded-2xl p-4 border border-[var(--color-border-base)]/20 hover:border-[#adc6ff]/20 transition-all duration-300 animate-in fade-in slide-in-from-bottom-3 ${col.settings?.isFullWidth ? 'col-span-full' : ''}`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-[9px] font-black text-[#8c909f] uppercase tracking-widest block">
                        {col.name}{' '}
                        {col.settings?.required && (
                          <span className="text-rose-400 opacity-80">*</span>
                        )}
                      </label>
                    </div>

                    {/* Field Rendering Logic */}
                    <div className="min-h-[44px] flex flex-col gap-1.5">
                      {col.columnType === ColumnType.TEXT ||
                      col.columnType === ColumnType.LONG_TEXT ||
                      col.columnType === ColumnType.NUMBER ||
                      col.columnType === ColumnType.CURRENCY ||
                      col.columnType === ColumnType.PHONE ||
                      col.columnType === ColumnType.EMAIL ||
                      col.columnType === ColumnType.URL ? (
                        <div className="relative w-full">
                          <input
                            type={
                              col.columnType === ColumnType.NUMBER ||
                              col.columnType === ColumnType.CURRENCY
                                ? 'number'
                                : col.columnType === ColumnType.EMAIL
                                  ? 'email'
                                  : 'text'
                            }
                            className={`w-full text-[11px] text-[var(--color-text-base)] bg-[#070d1f] p-3.5 rounded-xl border font-mono outline-none focus:border-[#adc6ff]/40 transition-all ${
                              hasError
                                ? 'border-rose-500/50 focus:border-rose-500/70'
                                : 'border-[var(--color-border-base)]/20'
                            }`}
                            placeholder={
                              col.settings?.placeholder || 'Enter value...'
                            }
                            value={val}
                            onChange={(e) =>
                              setMockValues({
                                ...mockValues,
                                [col.key]: e.target.value,
                              })
                            }
                          />
                          {hasError && (
                            <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-rose-500" />
                          )}
                        </div>
                      ) : col.columnType === ColumnType.SELECT ||
                        col.columnType === ColumnType.MULTI_SELECT ? (
                        <div className="w-full relative">
                          <select
                            className="w-full text-[11px] text-[var(--color-text-base)] bg-[#070d1f] p-3.5 rounded-xl border border-[var(--color-border-base)]/20 font-mono outline-none appearance-none"
                            value={val}
                            onChange={(e) =>
                              setMockValues({
                                ...mockValues,
                                [col.key]: e.target.value,
                              })
                            }
                          >
                            <option value="">Select option...</option>
                            {col.options?.choices?.map((c) => (
                              <option key={c.value} value={c.value}>
                                {c.label}
                              </option>
                            ))}
                          </select>
                          <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-base)]/20 rotate-90 pointer-events-none" />
                        </div>
                      ) : col.columnType === ColumnType.DATE ||
                        col.columnType === ColumnType.DATE_RANGE ? (
                        <div className="w-full p-3.5 rounded-xl bg-[#070d1f] border border-[var(--color-border-base)]/20 flex items-center justify-between text-[var(--color-text-base)]/40 hover:border-[#adc6ff]/20 transition-colors cursor-pointer">
                          <span className="text-[11px] font-mono">
                            Select Date...
                          </span>
                          <Calendar className="w-4 h-4" />
                        </div>
                      ) : col.columnType === ColumnType.RATING ? (
                        <div className="flex gap-2 p-2">
                          {[1, 2, 3, 4, 5].map((i) => (
                            <Star
                              key={i}
                              className="w-6 h-6 text-[#adc6ff]/10 hover:text-[#adc6ff] cursor-pointer transition-colors"
                            />
                          ))}
                        </div>
                      ) : col.columnType === ColumnType.FORMULA ? (
                        <div className="w-full p-3.5 rounded-xl bg-[#151b2d] border border-[#adc6ff]/20 flex items-center justify-between group/formula">
                          <span className="text-[11px] font-mono text-[#adc6ff] font-bold tracking-widest pl-1">
                            #CALC
                          </span>
                          <Calculator className="w-4 h-4 text-[#adc6ff]/50 group-hover/formula:text-[#adc6ff] transition-colors" />
                        </div>
                      ) : col.columnType === ColumnType.BARCODE_SCAN ? (
                        <div className="w-full p-3.5 rounded-xl bg-[#070d1f] border border-dashed border-[var(--color-border-base)]/40 flex flex-col items-center justify-center gap-2 hover:border-[#adc6ff]/20 transition-colors cursor-pointer h-20">
                          <Barcode className="w-6 h-6 text-[var(--color-text-base)]/20" />
                          <span className="text-[8px] font-black uppercase tracking-widest text-[var(--color-text-base)]/20">
                            Scan Code
                          </span>
                        </div>
                      ) : col.columnType === ColumnType.PHOTO_CAPTURE ? (
                        <div className="w-full h-32 rounded-2xl bg-[#070d1f] border border-dashed border-[var(--color-border-base)]/40 flex flex-col items-center justify-center gap-3 group/field cursor-pointer transition-all hover:bg-[#0c1324] hover:border-[#adc6ff]/20">
                          <div className="w-10 h-10 rounded-full bg-[var(--color-surface-muted)]/50 flex items-center justify-center group-hover/field:bg-[#adc6ff]/10">
                            <Camera className="w-5 h-5 text-[var(--color-text-base)]/20 group-hover/field:text-[#adc6ff] transition-colors" />
                          </div>
                          <span className="text-[8px] font-black text-[var(--color-text-base)]/10 uppercase tracking-[0.2em] group-hover/field:text-[var(--color-text-base)]/30">
                            Capture Forensic Photo
                          </span>
                        </div>
                      ) : col.columnType === ColumnType.GPS_LOCATION ? (
                        <div className="w-full p-3.5 rounded-xl bg-[#070d1f] border border-[var(--color-border-base)]/20 flex items-center justify-between group/field">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                              <MapPin className="w-4 h-4 text-emerald-400" />
                            </div>
                            <div>
                              <p className="text-[10px] font-black text-emerald-400/80 leading-none uppercase tracking-widest">
                                GPS Locked
                              </p>
                              <p className="text-[8px] text-[var(--color-text-base)]/20 mt-1 font-mono">
                                Accuracy: 3.2m
                              </p>
                            </div>
                          </div>
                          <ChevronRight className="w-3 h-3 text-[var(--color-text-base)]/10" />
                        </div>
                      ) : col.columnType === ColumnType.SIGNATURE ? (
                        <div className="w-full h-28 rounded-2xl bg-[#070d1f] border border-[var(--color-border-base)]/20 flex flex-col items-center justify-center gap-3 group/field transition-all hover:border-[#adc6ff]/10">
                          <FileSignature className="w-6 h-6 text-[var(--color-text-base)]/5 group-hover/field:text-[var(--color-text-base)]/10 transition-colors" />
                          <span className="text-[8px] font-black text-[var(--color-text-base)]/10 uppercase tracking-widest">
                            Draw Certification
                          </span>
                        </div>
                      ) : col.columnType === ColumnType.CHECKBOX ? (
                        <button
                          onClick={() =>
                            setMockValues((prev) => ({
                              ...prev,
                              [col.key]: !prev[col.key],
                            }))
                          }
                          className="flex items-center gap-4 w-full bg-[#070d1f] p-3.5 rounded-xl border border-[var(--color-border-base)]/20 active:scale-[0.98] transition-all"
                        >
                          <div
                            className={`w-6 h-6 rounded-lg border transition-all flex items-center justify-center shadow-inner ${
                              mockValues[col.key]
                                ? 'bg-emerald-500/20 border-emerald-500/40'
                                : 'bg-[#151b2d] border-[var(--color-border-base)]/40'
                            }`}
                          >
                            <CheckSquare
                              className={`w-3.5 h-3.5 text-emerald-400 transition-opacity ${mockValues[col.key] ? 'opacity-100' : 'opacity-10'}`}
                            />
                          </div>
                          <span
                            className={`text-[10px] font-black uppercase tracking-[0.15em] font-mono transition-colors ${
                              mockValues[col.key]
                                ? 'text-[var(--color-text-base)]'
                                : 'text-[var(--color-text-base)]/40'
                            }`}
                          >
                            {mockValues[col.key] ? 'YES' : 'NO'}
                          </span>
                        </button>
                      ) : (
                        <div className="w-full text-[10px] text-[var(--color-text-base)]/20 bg-[#070d1f] p-3.5 rounded-xl border border-[var(--color-border-base)]/20 uppercase tracking-widest font-mono">
                          {col.columnType.replace('_', ' ')}_INPUT
                        </div>
                      )}
                    </div>

                    {hasError && rule?.message && (
                      <div className="text-[9px] font-mono text-rose-500 font-bold px-1 mt-1">
                        {rule.message}
                      </div>
                    )}

                    {col.settings?.hint && (
                      <div className="mt-3 flex items-center gap-2 opacity-30 px-1 border-t border-[var(--color-border-base)]/20 pt-3">
                        <div className="w-1 h-1 rounded-full bg-[#adc6ff]" />
                        <span className="text-[9px] font-bold uppercase tracking-widest leading-none font-mono truncate">
                          {col.settings.hint}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </>
          )}
        </div>

        {/* Action Button */}
        <footer className="p-5 bg-[#0c1324] border-t border-[var(--color-border-base)]/40 relative z-10 shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
          <div className="flex gap-3">
            {currentPage > 0 && (
              <button
                onClick={() => setCurrentPage(currentPage - 1)}
                className="px-5 py-4.5 bg-[#151b2d] text-[var(--color-text-base)]/60 rounded-[1.25rem] text-[10px] font-black uppercase shadow-inner active:scale-[0.98] transition-all hover:bg-[#1a2238] hover:text-[var(--color-text-base)] border border-[var(--color-border-base)]/10"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}

            {currentPage < totalPages - 1 ? (
              <button
                onClick={() => setCurrentPage(currentPage + 1)}
                className="flex-1 py-4.5 bg-[#009688] text-white rounded-[1.25rem] text-[10px] font-black uppercase tracking-[0.25em] shadow-[0_10px_25px_rgba(0,150,136,0.3)] active:scale-[0.98] transition-all hover:bg-[#00796b]"
              >
                NEXT_SECTION
              </button>
            ) : (
              <button className="flex-1 py-4.5 bg-[#adc6ff] text-[#070d1f] rounded-[1.25rem] text-[10px] font-black uppercase tracking-[0.25em] shadow-[0_10px_25px_rgba(173,198,255,0.15)] active:scale-[0.98] transition-all hover:bg-white">
                Finalize Entry
              </button>
            )}
          </div>
        </footer>
      </div>

      {/* Frame Details */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-32 h-1.5 bg-[var(--color-surface-muted)] rounded-full blur-[0.5px]" />
    </div>
  );
}
