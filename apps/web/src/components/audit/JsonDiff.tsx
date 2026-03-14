'use client';

import React from 'react';

/**
 * Structural JSON Diff Component
 * Renders old vs new values in a compact Git-style diff format.
 */

interface JsonDiffProps {
  oldValue: any;
  newValue: any;
}

export function JsonDiff({ oldValue, newValue }: JsonDiffProps) {
  if (!oldValue && !newValue) {
    return (
      <span className="text-slate-400 italic text-xs">No data changes</span>
    );
  }

  // Handle case where one is null
  const oldRef = oldValue || {};
  const newRef = newValue || {};

  // Simple diff logic: find keys that changed
  const allKeys = Array.from(
    new Set([...Object.keys(oldRef), ...Object.keys(newRef)])
  ).sort();

  const changes = allKeys.filter(
    (key) => JSON.stringify(oldRef[key]) !== JSON.stringify(newRef[key])
  );

  if (changes.length === 0 && oldValue && newValue) {
    return (
      <span className="text-slate-400 italic text-xs">No field changes</span>
    );
  }

  return (
    <div className="font-mono text-[11px] space-y-1 mt-2 bg-slate-50 p-2.5 rounded-lg border border-slate-200 overflow-x-auto">
      {changes.map((key) => {
        const oldVal = oldRef[key];
        const newVal = newRef[key];

        return (
          <div key={key} className="grid grid-cols-[120px_1fr] gap-2">
            <span className="text-slate-500 font-bold truncate">{key}:</span>
            <div className="space-y-0.5">
              {oldVal !== undefined && (
                <div className="bg-rose-50 text-rose-700 px-1.5 py-0.5 rounded leading-tight break-all">
                  <span className="opacity-50 mr-1">-</span>
                  {typeof oldVal === 'object'
                    ? JSON.stringify(oldVal)
                    : String(oldVal)}
                </div>
              )}
              {newVal !== undefined && (
                <div className="bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded leading-tight break-all">
                  <span className="opacity-50 mr-1">+</span>
                  {typeof newVal === 'object'
                    ? JSON.stringify(newVal)
                    : String(newVal)}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
