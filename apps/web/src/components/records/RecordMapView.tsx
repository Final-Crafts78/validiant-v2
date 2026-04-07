'use client';

import React, { useEffect } from 'react';
import { ProjectRecord, ProjectType } from '@validiant/shared';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Maximize2, Navigation } from 'lucide-react';
import { format } from 'date-fns';
import { useTheme } from '@/components/providers/ThemeProvider';

interface RecordMapViewProps {
  projectType: ProjectType;
  records: ProjectRecord[];
  onEdit: (recordId: string) => void;
}

// Fix for default Leaflet icons in Next.js
const createCustomIcon = (color: string) => {
  return new L.DivIcon({
    className: 'custom-div-icon',
    html: `
      <div style="
        background-color: ${color};
        width: 14px;
        height: 14px;
        border: 3px solid rgba(255,255,255,0.2);
        border-radius: 50%;
        box-shadow: 0 0 12px ${color};
        animation: pulse-ring 2s infinite;
      "></div>
      <style>
        @keyframes pulse-ring {
          0% { transform: scale(0.8); opacity: 0.5; }
          50% { transform: scale(1.2); opacity: 1; }
          100% { transform: scale(0.8); opacity: 0.5; }
        }
      </style>
    `,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });
};

const STATUS_COLORS: Record<string, string> = {
  pending: '#F59E0B', // amber-500
  in_progress: '#6366F1', // primary-500
  verified: '#10B981', // emerald-500
  flagged: '#F43F5E', // rose-500
};

export function RecordMapView({
  projectType: _projectType,
  records,
  onEdit,
}: RecordMapViewProps) {
  const { theme, resolvedTheme } = useTheme();
  const currentTheme = theme === 'system' ? resolvedTheme : theme;

  const recordsWithGps = records.filter((r) => r.gpsLat && r.gpsLng);

  // Default center (India) if no records
  const center: [number, number] =
    recordsWithGps.length > 0
      ? [
          recordsWithGps[0]?.gpsLat ?? 20.5937,
          recordsWithGps[0]?.gpsLng ?? 78.9629,
        ]
      : [20.5937, 78.9629];

  return (
    <div className="relative h-[calc(100vh-320px)] min-h-[500px] w-full rounded-[3rem] overflow-hidden border border-white/[0.05] shadow-obsidian-lg bg-surface-lowest group">
      {recordsWithGps.length === 0 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-md z-20 space-y-4">
          <div className="w-20 h-20 rounded-3xl bg-surface-container-low flex items-center justify-center border border-white/5 opacity-20">
            <Navigation className="w-10 h-10 text-white" />
          </div>
          <div className="text-center">
            <h4 className="text-lg font-bold text-white/60">
              No Geospatial Data
            </h4>
            <p className="text-xs text-white/20 uppercase tracking-widest font-black">
              Universe is non-located
            </p>
          </div>
        </div>
      )}

      <MapContainer
        center={center}
        zoom={13}
        scrollWheelZoom={false}
        className="h-full w-full grayscale opacity-80 contrast-125 saturate-50 hover:grayscale-0 hover:opacity-100 transition-all duration-700"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url={
            currentTheme === 'light'
              ? 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'
              : 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
          }
        />

        {recordsWithGps.map((record) => {
          const statusColor =
            STATUS_COLORS[record.status] ||
            STATUS_COLORS['pending'] ||
            '#F59E0B';

          return (
            <Marker
              key={record.id}
              position={[record.gpsLat || 0, record.gpsLng || 0]}
              icon={createCustomIcon(statusColor)}
            >
              <Popup className="obsidian-popup">
                <div className="p-2 min-w-[200px] space-y-4 bg-slate-900 border border-white/5 rounded-2xl">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-[10px] font-mono font-black text-primary tracking-tighter">
                      #{record.number}
                    </span>
                    <div
                      className="w-2 h-2 rounded-full shadow-[0_0_8px_currentColor]"
                      style={{ color: statusColor }}
                    />
                  </div>

                  <div>
                    <h5 className="text-[11px] font-bold text-white leading-tight">
                      {String(
                        record.data[Object.keys(record.data)[0] || ''] ||
                          'Untitled Node'
                      )}
                    </h5>
                    <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest mt-1">
                      Captured:{' '}
                      {format(new Date(record.createdAt), 'MMM dd, HH:mm')}
                    </p>
                  </div>

                  <button
                    onClick={() => onEdit(record.id)}
                    className="w-full flex items-center justify-center gap-2 py-2 bg-primary/20 hover:bg-primary/40 rounded-xl text-[9px] font-black uppercase tracking-widest text-primary transition-all"
                  >
                    <Maximize2 className="w-3 h-3" />
                    Explore Node
                  </button>
                </div>
              </Popup>
            </Marker>
          );
        })}

        <FitBounds records={recordsWithGps} />
      </MapContainer>

      {/* Map Overlay Stats */}
      <div className="absolute top-6 left-6 z-[1000] flex flex-col gap-2">
        <div className="bg-surface-lowest/80 backdrop-blur-xl border border-white/[0.05] p-1.5 rounded-2xl shadow-obsidian flex items-center gap-4 pr-6">
          <div className="w-10 h-10 rounded-[1.2rem] bg-emerald-500/20 flex items-center justify-center border border-emerald-500/20">
            <Navigation className="w-5 h-5 text-emerald-500" />
          </div>
          <div>
            <h5 className="text-[10px] font-black uppercase tracking-widest text-white/80">
              Spatial Distribution
            </h5>
            <p className="text-[9px] font-bold text-white/20 uppercase truncate">
              {recordsWithGps.length} Located Nodes
            </p>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .leaflet-container {
          background: ${currentTheme === 'light'
            ? '#f8fafc'
            : '#020617'} !important;
        }
        .obsidian-popup .leaflet-popup-content-wrapper {
          background: transparent !important;
          box-shadow: none !important;
          padding: 0 !important;
        }
        .obsidian-popup .leaflet-popup-tip {
          background: #0f172a !important;
          border: 1px solid rgba(255, 255, 255, 0.05) !important;
        }
        .obsidian-popup .leaflet-popup-content {
          margin: 0 !important;
        }
        .leaflet-popup-close-button {
          display: none !important;
        }
      `}</style>
    </div>
  );
}

function FitBounds({ records }: { records: ProjectRecord[] }) {
  const map = useMap();

  useEffect(() => {
    if (records.length === 0) return;

    const bounds = L.latLngBounds(
      records.map((r) => [r.gpsLat!, r.gpsLng!] as [number, number])
    );
    map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
  }, [records, map]);

  return null;
}
