'use client';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import {
  Loader2,
  Map as MapIcon,
  Navigation,
  Layers,
  Info,
} from 'lucide-react';

interface RoutingMapLayerProps {
  projectId: string;
}

// Dynamic import for Leaflet components to avoid SSR issues
const RoutingMapLayer = dynamic<RoutingMapLayerProps>(
  () => import('./RoutingMapLayer').then((mod) => mod.RoutingMapLayer),
  {
    ssr: false,
    loading: () => (
      <div className="h-[600px] w-full bg-slate-50 border border-slate-200 rounded-2xl flex flex-col items-center justify-center gap-4 animate-pulse">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
        <p className="text-sm font-bold tracking-tight text-slate-500 uppercase">
          Initializing Satellite Layers...
        </p>
      </div>
    ),
  }
);

interface RoutingMapTabProps {
  projectId: string;
}

/**
 * RoutingMapTab - Phase 4: Enterprise Smart Routing & Live Map
 * The central visualization hub for field operations.
 */
export function RoutingMapTab({ projectId }: RoutingMapTabProps) {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header Info Panel */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white p-6 border border-slate-200 rounded-2xl shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-50 rounded-xl border border-indigo-100 flex items-center justify-center shadow-inner">
            <MapIcon className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800 tracking-tight">
              Enterprise Routing Map
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100 uppercase tracking-widest leading-none">
                Live Telemetry Active
              </span>
              <p className="text-xs text-slate-400 font-medium tracking-tight leading-none">
                Visualizing task clusters and executive trajectories.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <button className="flex-1 md:flex-none inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold bg-indigo-600 text-[var(--color-text-base)] rounded-xl hover:bg-indigo-700 transition-all shadow-md active:scale-95">
            <Navigation className="w-3.5 h-3.5" />
            Optimize Route
          </button>
          <button className="flex-1 md:flex-none inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold bg-white text-slate-700 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all shadow-sm">
            <Layers className="w-3.5 h-3.5" />
            Layers
          </button>
        </div>
      </div>

      {/* Main Map Container */}
      <div className="relative group rounded-3xl overflow-hidden border-4 border-white shadow-2xl bg-white min-h-[600px]">
        <Suspense fallback={null}>
          <RoutingMapLayer projectId={projectId} />
        </Suspense>

        {/* Floating Attribution Overlay */}
        <div className="absolute bottom-4 left-4 z-[1000] flex items-center gap-3">
          <div className="bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full border border-slate-200/50 shadow-lg flex items-center gap-2 pointer-events-auto">
            <Info className="w-3.5 h-3.5 text-indigo-500" />
            <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">
              Live Protocol Data v2.0
            </span>
          </div>
        </div>
      </div>

      {/* Legend / Info Bar */}
      <div className="bg-slate-900 rounded-2xl p-4 flex items-center justify-between text-[var(--color-text-base)]/70 text-[10px] font-bold tracking-widest uppercase">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
            <span>Verified Site</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
            <span>Active Execution</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
            <span>Pending Access</span>
          </div>
        </div>
        <div className="hidden sm:block">OSRM Routing Protocol Integrated</div>
      </div>
    </div>
  );
}
