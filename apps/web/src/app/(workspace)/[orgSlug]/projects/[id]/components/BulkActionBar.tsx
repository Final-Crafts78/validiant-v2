'use client';

import { Archive, Trash2, UserPlus, Download, X } from 'lucide-react';

interface BulkActionBarProps {
  selectedCount: number;
  onClear: () => void;
  onAction?: (action: string) => void;
}

export function BulkActionBar({
  selectedCount,
  onClear,
  onAction,
}: BulkActionBarProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="bg-[var(--surface-container)] border border-primary/20 rounded-3xl shadow-2xl shadow-[#0c1324]/80 px-6 py-4 flex items-center gap-6 backdrop-blur-xl">
        {/* Selection Count */}
        <div className="flex items-center gap-3 pr-6 border-r border-white/10">
          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-[#0c1324] font-black text-xs">
            {selectedCount}
          </div>
          <div>
            <p className="text-[10px] font-black text-primary uppercase tracking-widest leading-none">
              Records
            </p>
            <p className="text-[12px] font-bold text-[#dce1fb] leading-none mt-1">
              Selected
            </p>
          </div>
        </div>

        {/* Actions Group */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onAction?.('assign')}
            className="h-10 px-4 flex items-center gap-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-xl transition-all group"
          >
            <UserPlus className="w-4 h-4" />
            <span className="text-xs font-bold">Assign</span>
          </button>

          <button
            onClick={() => onAction?.('archive')}
            className="h-10 px-4 flex items-center gap-2 bg-white/5 hover:bg-white/10 text-[#dce1fb] rounded-xl transition-all"
          >
            <Archive className="w-4 h-4" />
            <span className="text-xs font-bold">Archive</span>
          </button>

          <button
            onClick={() => onAction?.('export')}
            className="h-10 px-4 flex items-center gap-2 bg-white/5 hover:bg-white/10 text-[#dce1fb] rounded-xl transition-all"
          >
            <Download className="w-4 h-4" />
            <span className="text-xs font-bold">Export</span>
          </button>

          <button
            onClick={() => onAction?.('delete')}
            className="h-10 px-4 flex items-center gap-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-xl transition-all"
          >
            <Trash2 className="w-4 h-4" />
            <span className="text-xs font-bold">Delete</span>
          </button>
        </div>

        {/* Clear Selection */}
        <button
          onClick={onClear}
          className="ml-2 p-2 hover:bg-white/10 rounded-full transition-colors text-[var(--text-muted)]"
          title="Clear selection"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
