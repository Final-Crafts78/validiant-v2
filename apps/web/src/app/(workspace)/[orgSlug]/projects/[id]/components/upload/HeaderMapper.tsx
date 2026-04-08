'use client';

import React from 'react';
import {
  ArrowRight,
  Database,
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  Info,
} from 'lucide-react';
import { TypeColumn } from '@validiant/shared';

interface HeaderMapperProps {
  headers: string[];
  columns: TypeColumn[];
  mapping: Record<string, string>;
  onMappingChange: (mapping: Record<string, string>) => void;
  onNext: () => void;
}

/**
 * HeaderMapper - Component for connecting CSV columns to Archetype schema keys.
 * High-fidelity 'Map Point' UI with smart suggestions.
 */
export function HeaderMapper({
  headers,
  columns,
  mapping,
  onMappingChange,
  onNext,
}: HeaderMapperProps) {
  const unmappedCount =
    headers.length - Object.values(mapping).filter(Boolean).length;
  const requiredUnmapped = columns
    .filter((col) => col.settings?.required)
    .filter((col) => !Object.values(mapping).includes(col.key));

  const handleMap = (header: string, schemaKey: string) => {
    onMappingChange({ ...mapping, [header]: schemaKey });
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h4 className="text-xl font-bold text-white uppercase tracking-tight">
            Protocol Alignment
          </h4>
          <p className="text-[10px] text-white/30 uppercase font-black tracking-widest leading-relaxed">
            Match external data headers to internal system archetypes
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div
            className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${
              unmappedCount === 0
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
            }`}
          >
            {unmappedCount === 0
              ? 'ALL_MODULES_MAPPED'
              : `${unmappedCount} UNMAPPED_FIELDS`}
          </div>
          <button
            onClick={onNext}
            disabled={requiredUnmapped.length > 0}
            className={`flex items-center gap-3 px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-2xl transition-all ${
              requiredUnmapped.length === 0
                ? 'bg-primary text-[#0c1324] hover:bg-primary/80 hover:scale-105 active:scale-95'
                : 'bg-white/5 text-white/20 cursor-not-allowed grayscale'
            }`}
          >
            PROCEED_TO_VALIDATION <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {requiredUnmapped.length > 0 && (
        <div className="bg-rose-500/10 border border-rose-500/20 rounded-[2rem] p-6 flex items-start gap-4 animate-in slide-in-from-top-2 duration-300">
          <AlertCircle className="w-6 h-6 text-rose-400 mt-1" />
          <div className="space-y-2">
            <h5 className="text-[11px] font-black text-rose-400 uppercase tracking-widest">
              Protocol Integrity Failure
            </h5>
            <p className="text-xs text-rose-400/60 font-medium leading-relaxed italic">
              The and validation stage is blocked. The following required
              archetype modules have no mapped data source:
            </p>
            <div className="flex flex-wrap gap-2 pt-2">
              {requiredUnmapped.map((col) => (
                <span
                  key={col.id}
                  className="px-3 py-1 bg-rose-500/20 rounded-lg text-[9px] font-black text-rose-400 uppercase border border-rose-500/30"
                >
                  {col.name} *
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4">
        {headers.map((header, idx) => {
          const mappedKey = mapping[header];

          return (
            <div
              key={idx}
              className={`group relative bg-[#070d1f] hover:bg-[#070d1f]/60 border rounded-[2rem] p-6 flex items-center justify-between transition-all duration-300 ${
                mappedKey
                  ? 'border-primary/20 shadow-lg shadow-primary/5'
                  : 'border-white/5 opacity-80 hover:opacity-100'
              }`}
            >
              {/* Left: CSV Header Info */}
              <div className="flex items-center gap-6">
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center border transition-all ${
                    mappedKey
                      ? 'bg-primary/5 border-primary/20 text-primary'
                      : 'bg-white/5 border-white/5 text-white/10'
                  }`}
                >
                  <Database className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-black text-white/30 uppercase tracking-widest leading-none">
                      Source_Header
                    </span>
                  </div>
                  <h5 className="text-lg font-black text-white leading-none uppercase tracking-tight">
                    {header}
                  </h5>
                </div>
              </div>

              {/* Center: Connection Visual */}
              <div className="flex-1 px-12 opacity-5">
                <div className="w-full h-px bg-gradient-to-r from-transparent via-white to-transparent" />
              </div>

              {/* Right: Target Schema Mapping */}
              <div className="w-80 relative">
                <select
                  value={mappedKey || ''}
                  onChange={(e) => handleMap(header, e.target.value)}
                  className={`w-full bg-[#151b2d] border rounded-2xl p-4 text-[11px] font-bold uppercase tracking-widest outline-none transition-all appearance-none cursor-pointer pr-12 ${
                    mappedKey
                      ? 'border-primary/40 text-primary bg-primary/5'
                      : 'border-white/10 text-white/40 hover:border-white/20'
                  }`}
                >
                  <option value="">IGNORE_THIS_FIELD</option>
                  {columns.map((col) => (
                    <option key={col.id} value={col.key}>
                      MAP_TO: {col.name.toUpperCase()}{' '}
                      {col.settings?.required ? ' *' : ''}
                    </option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                  {mappedKey ? (
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-white/20" />
                  )}
                </div>
              </div>

              {/* Status Indicator Bar */}
              <div
                className={`absolute left-0 top-1/4 bottom-1/4 w-1 rounded-full transition-all ${
                  mappedKey ? 'bg-primary' : 'bg-transparent'
                }`}
              />
            </div>
          );
        })}
      </div>

      <footer className="pt-8 border-t border-white/[0.03] flex items-center gap-4">
        <Info className="w-4 h-4 text-[#adc6ff]/40" />
        <p className="text-[9px] text-[#adc6ff]/40 font-black uppercase tracking-[0.2em] italic">
          Automated intelligence has attempted to align standard protocols.
          Manual mapping is required for anomalies.
        </p>
      </footer>
    </div>
  );
}
