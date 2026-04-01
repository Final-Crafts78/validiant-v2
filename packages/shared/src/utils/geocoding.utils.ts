import { Task, CustomFieldValue } from '../types/project.types';

export interface Coordinates {
  lat: number;
  lng: number;
  accuracy?: number;
}

/**
 * Extract GPS Coordinates from Task EAV Schema - Phase 4 Geocoding Resolver
 * A 3-tier resolver built for 'perfection and precision'.
 */
export function extractTaskCoordinates(task: Task): Coordinates | null {
  // Tier 0: Direct properties (for web Task type compatibility)
  if (
    (task as any).targetLatitude !== undefined &&
    (task as any).targetLongitude !== undefined
  ) {
    return {
      lat: (task as any).targetLatitude,
      lng: (task as any).targetLongitude,
    };
  }

  if (!task.customFields) return null;

  // Tier 1: Explicit targetLatitude/targetLongitude (Phase 3 spec)
  const latField = findFieldValue(task.customFields, [
    'targetLatitude',
    'target_lat',
    'lat',
  ]);
  const lngField = findFieldValue(task.customFields, [
    'targetLongitude',
    'target_lng',
    'lng',
  ]);

  if (latField !== undefined && lngField !== undefined) {
    const lat = Number(latField);
    const lng = Number(lngField);
    if (!isNaN(lat) && !isNaN(lng)) {
      return { lat, lng };
    }
  }

  return null;
}

/**
 * Helper to find field values by key variations
 */
function findFieldValue(
  fields: CustomFieldValue[],
  keys: string[]
): string | number | boolean | Date | string[] | undefined {
  const field = fields.find((f) =>
    keys.some((k) => f.fieldId.toLowerCase() === k.toLowerCase())
  );
  return field?.value;
}

/**
 * Calculate distance between two coordinates in meters (Haversine)
 */
export function getDistance(p1: Coordinates, p2: Coordinates): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (p1.lat * Math.PI) / 180;
  const φ2 = (p2.lat * Math.PI) / 180;
  const Δφ = ((p2.lat - p1.lat) * Math.PI) / 180;
  const Δλ = ((p2.lng - p1.lng) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Enterprise Route Optimizer (Phase 4)
 * Implements a Nearest Neighbor TSP approximation for field efficiency.
 */
export function optimizeRoute(
  origin: Coordinates,
  points: Coordinates[]
): Coordinates[] {
  const unvisited = [...points];
  const route: Coordinates[] = [];
  let current = origin;

  while (unvisited.length > 0) {
    let nearestIdx = 0;
    let minDist = Infinity;

    console.debug( // eslint-disable-line no-console
      `[OptimizeRoute] Step ${route.length + 1}: ${unvisited.length} points remaining`
    );

    for (let i = 0; i < unvisited.length; i++) {
      const point = unvisited[i];
      if (!point) continue; // Safe indexing under strict mode

      const d = getDistance(current, point);
      if (d < minDist) {
        minDist = d;
        nearestIdx = i;
      }
    }

    const [next] = unvisited.splice(nearestIdx, 1);
    if (!next) {
      console.warn( // eslint-disable-line no-console
        '[OptimizeRoute] Failed to retrieve next point. Terminating optimization.'
      );
      break;
    }

    route.push(next);
    current = next;
  }

  return route;
}
