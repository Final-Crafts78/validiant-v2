/**
 * BulkActionBar Component
 *
 * Floating action bar that appears when rows are selected in the TasksTable.
 */

import React from 'react';
import { Users, Settings2, X, Trash2 } from 'lucide-react';

interface BulkActionBarProps {
  selectedCount: number;
  onClear: () => void;
  onAssign: () => void;
  onStatusChange: () => void;
  onDelete?: () => void;
}

export function BulkActionBar({
  selectedCount,
  onClear,
  onAssign,
  onStatusChange,
  onDelete,
}: BulkActionBarProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="bg-slate-900 text-white rounded-2xl shadow-2xl px-6 py-4 flex items-center gap-6 border border-slate-700/50 backdrop-blur-md bg-opacity-95">
        <div className="flex items-center gap-3 pr-6 border-r border-slate-700">
          <div className="bg-blue-600 text-white h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold">
            {selectedCount}
          </div>
          <span className="text-sm font-medium text-slate-200">
            {selectedCount === 1 ? 'Task' : 'Tasks'} selected
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onAssign}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-slate-800 transition-colors text-sm font-medium"
          >
            <Users className="h-4 w-4 text-blue-400" />
            Assign
          </button>

          <button
            onClick={onStatusChange}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-slate-800 transition-colors text-sm font-medium"
          >
            <Settings2 className="h-4 w-4 text-amber-400" />
            Update Status
          </button>

          {onDelete && (
            <button
              onClick={onDelete}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-red-900/40 text-red-100 transition-colors text-sm font-medium"
            >
              <Trash2 className="h-4 w-4 text-red-400" />
              Delete
            </button>
          )}
        </div>

        <button
          onClick={onClear}
          className="ml-2 p-1 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          title="Clear Selection"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
