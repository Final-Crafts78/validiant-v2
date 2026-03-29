'use client';

import React from 'react';
import { Layers, AlertCircle } from 'lucide-react';

export default function CaseConfigPage() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
      <div className="p-8 border-b border-slate-100 bg-slate-50/50">
        <div className="flex items-center gap-4 mb-2">
          <div className="p-3 bg-primary-100 rounded-xl text-primary-600">
            <Layers className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Case Configuration
            </h1>
            <p className="text-slate-500 text-sm italic">
              Configure system-wide case behaviors and automation rules.
            </p>
          </div>
        </div>
      </div>

      <div className="p-12 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-6 text-slate-400">
          <AlertCircle className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">
          Configuration Module Under Maintenance
        </h2>
        <p className="text-slate-500 max-w-md mx-auto mb-8">
          We are currently upgrading the Case Configuration engine to support advanced multi-layered workflows. This module will be available in the next release.
        </p>
        <div className="flex gap-4">
          <button 
            onClick={() => window.history.back()}
            className="px-6 py-2.5 bg-slate-900 text-white rounded-xl font-bold text-sm transition-all hover:bg-slate-800 shadow-lg shadow-slate-200"
          >
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
}
