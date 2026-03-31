'use client';

import React from 'react';
import { 
  CheckSquare, 
  Plus, 
  Calendar,
  LayoutGrid,
  List as ListIcon,
  AlertCircle
} from 'lucide-react';
import { cn } from '@validiant/ui';

export default function GlobalTasksPage() {
  const [activeView] = React.useState<'grid' | 'list'>('grid');

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            Universal Worklist
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">
            Aggregated task telemetry across all active workspace environments
          </p>
        </div>
        <div className="flex gap-2">
            <div className="flex p-1 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
              <div 
                className={cn("p-1.5 rounded-lg transition-all", activeView === 'grid' ? "bg-white dark:bg-slate-800 shadow-sm text-blue-600" : "text-slate-400")}
              >
                <LayoutGrid className="w-4 h-4" />
              </div>
              <div 
                className={cn("p-1.5 rounded-lg transition-all", activeView === 'list' ? "bg-white dark:bg-slate-800 shadow-sm text-blue-600" : "text-slate-400")}
              >
                <ListIcon className="w-4 h-4" />
              </div>
            </div>
            <button className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 active:scale-95 group">
              <Plus className="w-4 h-4 transition-transform group-hover:rotate-90" />
              Task Entry
            </button>
        </div>
      </div>

      {/* Empty State / Initial Implementation Placeholder */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-16 shadow-sm overflow-hidden relative group">
           <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/5 rounded-full -mr-16 -mt-16 blur-2xl group-hover:scale-150 transition-transform duration-1000" />
           
           <div className="flex flex-col items-center text-center relative z-10">
              <div className="w-20 h-20 rounded-[2rem] bg-indigo-50 dark:bg-indigo-900/10 flex items-center justify-center mb-8 border border-indigo-100 dark:border-indigo-900/20">
                <CheckSquare className="w-10 h-10 text-indigo-600" />
              </div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2">No Active Task Telemetry</h2>
              <p className="text-slate-500 dark:text-slate-400 max-w-sm mb-10 font-medium">
                Your universal worklist will populate here once you are assigned markers across your workspace environments.
              </p>
              
              <div className="flex flex-wrap justify-center gap-3">
                 <div className="px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    BETA-v.0.1
                 </div>
                 <div className="px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    AGGREGATED_VIEW
                 </div>
              </div>
           </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12 pb-20">
          <div className="space-y-4">
             <div className="flex items-center gap-2 px-2">
                <Calendar className="w-4 h-4 text-slate-400" />
                <h3 className="text-sm font-black uppercase tracking-widest text-slate-500">Scheduled Priorities</h3>
             </div>
             <div className="p-8 bg-slate-100/50 dark:bg-slate-950/20 border border-dashed border-slate-200 dark:border-slate-800 rounded-[2rem] text-center">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter">Timeline Initialization Pending</p>
             </div>
          </div>
          <div className="space-y-4">
             <div className="flex items-center gap-2 px-2">
                <AlertCircle className="h-4 w-4 text-slate-400" />
                <h3 className="text-sm font-black uppercase tracking-widest text-slate-500">High Risk Markers</h3>
             </div>
             <div className="p-8 bg-slate-100/50 dark:bg-slate-950/20 border border-dashed border-slate-200 dark:border-slate-800 rounded-[2rem] text-center">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter">No Critical Risks Identified</p>
             </div>
          </div>
      </div>
    </div>
  );
}
