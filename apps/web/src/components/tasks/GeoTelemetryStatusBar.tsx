'use client';

import { MapPin, Clock, LocateFixed } from 'lucide-react';
import { formatDuration } from '@validiant/shared';

interface GeoTelemetryStatusBarProps {
  isTracking: boolean;
  isWithinRange: boolean;
  distanceToTarget: number | null;
  elapsedTime: number;
  accuracy: number | null;
}

/**
 * GeoTelemetryStatusBar HUD
 *
 * High-fidelity status bar for Field Executives.
 * Provides real-time feedback on GPS lock, geofence status, and execution timing.
 */
export function GeoTelemetryStatusBar({
  isTracking,
  isWithinRange,
  distanceToTarget,
  elapsedTime,
  accuracy,
}: GeoTelemetryStatusBarProps) {
  // Format distance for display
  const formatDistance = (m: number) => {
    if (m < 1000) return `${Math.round(m)}m`;
    return `${(m / 1000).toFixed(1)}km`;
  };

  // Convert milliseconds to seconds for shared formatDuration helper
  const durationInSeconds = Math.floor(elapsedTime / 1000);

  return (
    <div className="mb-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-500">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center">
        {/* GPS Section */}
        <div
          className={`flex flex-1 items-center gap-3 p-4 transition-colors duration-500 ${
            isWithinRange
              ? 'bg-emerald-50/50'
              : !isTracking
                ? 'bg-slate-50'
                : 'bg-amber-50/50'
          }`}
        >
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-xl shadow-sm transition-transform duration-500 ${
              isWithinRange
                ? 'bg-emerald-500 text-[var(--color-text-base)] scale-110'
                : !isTracking
                  ? 'bg-slate-200 text-slate-400'
                  : 'bg-amber-500 text-[var(--color-text-base)] animate-pulse'
            }`}
          >
            {isWithinRange ? (
              <MapPin className="h-5 w-5" />
            ) : (
              <LocateFixed className="h-5 w-5" />
            )}
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                Satellite Uplink
              </span>
              {isTracking && (
                <span
                  className={`flex h-1.5 w-1.5 rounded-full ${
                    accuracy && accuracy < 15
                      ? 'bg-emerald-500'
                      : 'bg-amber-500'
                  }`}
                />
              )}
            </div>
            <div className="flex items-center justify-between mt-0.5">
              <p
                className={`text-sm font-bold tracking-tight ${
                  isWithinRange ? 'text-emerald-700' : 'text-slate-700'
                }`}
              >
                {!isTracking
                  ? 'GPS DISCONNECTED'
                  : isWithinRange
                    ? 'WITHIN RANGE'
                    : 'SEARCHING...'}
              </p>
              {isTracking && distanceToTarget !== null && (
                <p className="text-xs font-mono font-bold text-slate-500">
                  {formatDistance(distanceToTarget)} TO SITE
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Vertical Divider */}
        <div className="hidden sm:block w-px h-10 bg-slate-100" />

        {/* Timer Section */}
        <div className="flex flex-1 items-center gap-3 p-4 bg-slate-50/30">
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-xl transition-all ${
              elapsedTime > 0
                ? 'bg-indigo-600 text-[var(--color-text-base)] shadow-indigo-100'
                : 'bg-slate-200 text-slate-400'
            }`}
          >
            <Clock
              className={`h-5 w-5 ${elapsedTime > 0 && 'animate-[spin_10s_linear_infinite]'}`}
            />
          </div>

          <div className="flex-1">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Execution Duration
            </p>
            <div className="flex items-center justify-between mt-0.5">
              <p className="text-sm font-mono font-bold text-slate-700 tracking-tighter">
                {formatDuration(durationInSeconds)}
              </p>
              <div className="flex items-center gap-1.5">
                <div
                  className={`h-1.5 w-1.5 rounded-full ${elapsedTime > 0 ? 'bg-indigo-500 animate-pulse' : 'bg-slate-300'}`}
                />
                <span className="text-[10px] font-bold text-slate-400 uppercase">
                  Live
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Line */}
      <div className="h-1 w-full bg-slate-50">
        <div
          className={`h-full transition-all duration-1000 ease-in-out ${
            isWithinRange ? 'bg-emerald-500' : 'bg-indigo-500'
          }`}
          style={{ width: isTracking ? '100%' : '0%' }}
        />
      </div>
    </div>
  );
}
