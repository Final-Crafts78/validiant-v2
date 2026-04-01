'use client';

import { TaskStatus } from '@validiant/shared';
import { MapPin } from 'lucide-react';

interface MapMarkerProps {
  status: TaskStatus;
  title: string;
  isHovered?: boolean;
}

export const STATUS_COLORS: Record<TaskStatus, string> = {
  [TaskStatus.UNASSIGNED]: '#94a3b8', // slate-400
  [TaskStatus.PENDING]: '#f59e0b', // amber-500
  [TaskStatus.IN_PROGRESS]: '#3b82f6', // blue-500
  [TaskStatus.COMPLETED]: '#10b981', // emerald-500
  [TaskStatus.VERIFIED]: '#6366f1', // indigo-500
};

/**
 * luxury MapMarker - Phase 4
 * A high-fidelity, dynamic SVG marker for the Live Map.
 */
export function MapMarker({ status, isHovered }: MapMarkerProps) {
  const color = STATUS_COLORS[status] || STATUS_COLORS[TaskStatus.PENDING];

  return (
    <div
      className={`relative transition-all duration-300 transform ${
        isHovered ? 'scale-125 -translate-y-1' : 'scale-100'
      }`}
    >
      <div className="relative group">
        {/* Glow Effect */}
        <div
          className="absolute inset-0 rounded-full blur-md opacity-40 group-hover:opacity-70 transition-opacity"
          style={{ backgroundColor: color }}
        />

        {/* Main Pin */}
        <div
          className="relative flex items-center justify-center w-8 h-10"
          style={{ color }}
        >
          <MapPin
            className="w-full h-full drop-shadow-lg"
            fill="white"
            strokeWidth={2.5}
          />

          {/* Status Dot */}
          <div
            className="absolute top-2 w-2 h-2 rounded-full border border-white shadow-sm"
            style={{ backgroundColor: color }}
          />
        </div>
      </div>
    </div>
  );
}
