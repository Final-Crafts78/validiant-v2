'use client';

import { useEffect, useState, useMemo } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap,
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useTasks, Task } from '@/hooks/useTasks';
import { useGeoTelemetry } from '@/hooks/useGeoTelemetry';
import { extractTaskCoordinates, Coordinates } from '@validiant/shared';
import { MapMarker, STATUS_COLORS } from '@/components/maps/MapMarker';
import { renderToStaticMarkup } from 'react-dom/server';
import { TaskStatus } from '@validiant/shared';
import { logger } from '@/lib/logger';

// Fix Leaflet marker icon issues in Next.js
// We use custom DIV icons anyway for Phase 4 'luxury' look
const createCustomIcon = (status: TaskStatus) => {
  return L.divIcon({
    html: renderToStaticMarkup(<MapMarker status={status} title="" />),
    className: 'custom-leaflet-marker',
    iconSize: [32, 40],
    iconAnchor: [16, 40],
  });
};

interface RoutingMapLayerProps {
  projectId: string;
}

/**
 * RoutingMapLayer - The core mapping heart of Phase 4.
 * Integrates Leaflet, OSRM, and Phase 3 Telemetry.
 */
export function RoutingMapLayer({ projectId }: RoutingMapLayerProps) {
  const { data, isLoading } = useTasks(projectId);
  const { currentLocation } = useGeoTelemetry();
  const [routeGeometry, setRouteGeometry] = useState<[number, number][]>([]);

  // 1. Flatten tasks from infinite query pages and extract points
  const taskPoints = useMemo(() => {
    if (!data?.pages) return [];

    // Flatten pages safely
    const allTasks = data.pages.flatMap((page) => page.tasks);

    return (allTasks as Task[])
      .map((task) => ({
        task,
        coords: extractTaskCoordinates(task as any),
      }))
      .filter(
        (p): p is { task: Task; coords: Coordinates } =>
          p.coords !== null &&
          p.coords.lat !== undefined &&
          p.coords.lng !== undefined
      );
  }, [data]);

  // 2. Center map on first task or current location
  const center: [number, number] = useMemo(() => {
    if (currentLocation)
      return [currentLocation.latitude, currentLocation.longitude];

    const firstPoint = taskPoints[0];
    if (firstPoint && firstPoint.coords) {
      return [firstPoint.coords.lat, firstPoint.coords.lng];
    }

    return [0, 0];
  }, [currentLocation, taskPoints]);

  // 3. Fetch OSRM Route (Phase 4 'Smart Routing')
  useEffect(() => {
    if (taskPoints.length < 2) return;

    async function fetchRoute() {
      try {
        const coordsStr = taskPoints
          .map((p) => `${p.coords.lng},${p.coords.lat}`)
          .join(';');

        logger.info('[Route:Optimize:Start]', {
          pointCount: taskPoints.length,
        });

        const response = await fetch(
          `https://router.project-osrm.org/route/v1/driving/${coordsStr}?overview=full&geometries=geojson`
        );
        const data = await response.json();

        if (data.code === 'Ok' && data.routes?.length > 0) {
          const geojson = data.routes[0].geometry.coordinates;
          const leafletCoords = geojson.map((c: [number, number]) => [
            c[1],
            c[0],
          ]);
          setRouteGeometry(leafletCoords);
        }
      } catch (err) {
        logger.error('[Route:Optimize:Error]', { error: err });
      }
    }

    fetchRoute();
  }, [taskPoints]);

  if (isLoading) return null;

  return (
    <MapContainer
      center={center}
      zoom={13}
      className="h-[600px] w-full z-0"
      scrollWheelZoom={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* Task Markers */}
      {taskPoints.map(({ task, coords }) => (
        <Marker
          key={task.id}
          position={[coords.lat, coords.lng]}
          icon={createCustomIcon(task.status)}
        >
          <Popup className="luxury-popup">
            <div className="p-2 min-w-[150px]">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                Ref: ID-{task.id.slice(0, 6).toUpperCase()}
              </p>
              <h4 className="text-sm font-bold text-slate-800 leading-tight mb-2">
                {task.title}
              </h4>
              <div className="flex items-center gap-2">
                <span
                  className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider"
                  style={{
                    backgroundColor: `${STATUS_COLORS[task.status]}20`,
                    color: STATUS_COLORS[task.status],
                  }}
                >
                  {task.status}
                </span>
                <button className="text-[9px] font-bold text-indigo-600 hover:text-indigo-700 underline">
                  View Details
                </button>
              </div>
            </div>
          </Popup>
        </Marker>
      ))}

      {/* Optimized Route Line (OSRM) */}
      {routeGeometry.length > 0 && (
        <Polyline
          positions={routeGeometry}
          pathOptions={{
            color: '#6366f1',
            weight: 4,
            opacity: 0.6,
            dashArray: '10, 10',
          }}
        />
      )}

      {/* Live Executive Trace */}
      {currentLocation && (
        <Marker
          position={[currentLocation.latitude, currentLocation.longitude]}
          icon={L.divIcon({
            html: `
              <div class="relative flex items-center justify-center">
                <div class="absolute w-6 h-6 bg-indigo-500 rounded-full animate-ping opacity-20"></div>
                <div class="relative w-4 h-4 bg-indigo-600 rounded-full border-2 border-white shadow-lg"></div>
              </div>
            `,
            className: 'live-trace-marker',
            iconSize: [24, 24],
          })}
        >
          <Popup>Current Location (Telemetry)</Popup>
        </Marker>
      )}

      <MapResizer center={center} />
    </MapContainer>
  );
}

/**
 * Utility to handle map resizing and auto-centering
 */
function MapResizer({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.invalidateSize();
    if (center[0] !== 0) {
      map.panTo(center);
    }
  }, [map, center]);
  return null;
}
