'use client';

import { useProjectTypes } from '@/hooks/useProjectTypes';
import { CheckCircle2, ChevronRight, Hash, Database, Search } from 'lucide-react';
import { useState } from 'react';

/**
 * Field Agent Portal - Dedicated for mobile record entry.
 * Minimalist, high-priority UI with Obsidian aesthetics.
 */
export default function FieldPortal() {
  const [projectId, setProjectId] = useState('');
  const { data: types } = useProjectTypes(projectId || 'dummy'); // We'll need a real project ID filter

  return (
    <div className="flex-1 flex flex-col pt-12 px-8 gap-8 animate-in fade-in slide-in-from-bottom-8 duration-1000">
      <header className="space-y-2">
        <div className="flex items-center gap-3">
           <div className="w-10 h-10 rounded-2xl bg-primary-600 flex items-center justify-center shadow-2xl shadow-primary-500/20">
             <Database className="w-5 h-5 text-white" />
           </div>
           <h1 className="text-2xl font-black tracking-tight text-white font-manrope">Verification Node</h1>
        </div>
        <p className="text-sm font-bold text-slate-500 uppercase tracking-[0.2em] px-1">Precision Record Entry</p>
      </header>

      {/* Global Lookup - Project Selection */}
      <div className="relative group">
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-700 group-focus-within:text-primary-500 transition-colors" />
        <input 
          type="text" 
          placeholder="Access Project Code..." 
          value={projectId}
          onChange={(e) => setProjectId(e.target.value)}
          className="w-full bg-slate-900/50 border border-slate-800 rounded-3xl pl-14 pr-6 py-5 text-[11px] font-black uppercase tracking-widest text-white focus:outline-none focus:ring-4 focus:ring-primary-500/10 transition-all font-mono"
        />
      </div>

      {!projectId ? (
        <div className="flex-1 flex flex-col items-center justify-center py-20 gap-6 opacity-30">
           <div className="w-20 h-20 rounded-[2.5rem] border-2 border-dashed border-slate-800 flex items-center justify-center">
             <Hash className="w-8 h-8 text-slate-800" />
           </div>
           <p className="text-[10px] font-black uppercase tracking-widest text-slate-800">Awaiting Project Authorization</p>
        </div>
      ) : (
        <div className="space-y-6">
           <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-600 px-1">Available Archetypes</h3>
           <div className="grid grid-cols-1 gap-4">
              {types?.map((type) => (
                <button
                  key={type.id}
                  className="group flex items-center justify-between p-6 bg-slate-900/40 border border-slate-800 hover:border-primary-500/30 rounded-[2.5rem] transition-all hover:bg-slate-900 hover:-translate-y-1 active:scale-95 duration-500"
                >
                  <div className="flex items-center gap-5">
                    <div 
                      className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-xl"
                      style={{ background: type.color || '#4F46E5', boxShadow: `0 8px 30px ${type.color}33` }}
                    >
                      <Database className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                       <p className="text-sm font-black text-white tracking-tight">{type.name}</p>
                       <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{type.columns?.length || 0} Fields Required</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-700 group-hover:text-primary-500 transition-colors" />
                </button>
              ))}
           </div>

           <div className="mt-8 bg-primary-500/5 border border-primary-500/10 rounded-[2.5rem] p-8 space-y-4">
              <div className="flex items-center gap-3 text-primary-500">
                <CheckCircle2 className="w-5 h-5" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80">Security Protocol</span>
              </div>
              <p className="text-[11px] font-bold text-slate-400 leading-relaxed">
                Biometric and GPS telemetry will be captured automatically during record injection.
              </p>
           </div>
        </div>
      )}
    </div>
  );
}
