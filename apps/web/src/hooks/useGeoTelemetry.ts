'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { logger } from '@/lib/logger';

export interface GeoLocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
  speed?: number | null;
  heading?: number | null;
}

export interface GeoTelemetryState {
  currentLocation: GeoLocationData | null;
  error: string | null;
  isTracking: boolean;
  distanceToTarget: number | null; // in meters
  isWithinRange: boolean;
}

interface UseGeoTelemetryOptions {
  targetLocation?: { latitude: number; longitude: number };
  rangeThreshold?: number; // in meters, default 100
  enableHighAccuracy?: boolean;
}

/**
 * Haversine formula to calculate distance between two points in meters
 */
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * useGeoTelemetry Hook
 *
 * Provides real-time GPS tracking and geofencing capabilities.
 * Built for Phase 3 "Silent GPS Engine".
 */
export function useGeoTelemetry(options: UseGeoTelemetryOptions = {}) {
  const {
    targetLocation,
    rangeThreshold = 100,
    enableHighAccuracy = true,
  } = options;

  const [state, setState] = useState<GeoTelemetryState>({
    currentLocation: null,
    error: null,
    isTracking: false,
    distanceToTarget: null,
    isWithinRange: false,
  });

  const watchId = useRef<number | null>(null);
  const wasWithinRange = useRef<boolean>(false);

  const startTracking = useCallback(() => {
    if (!navigator.geolocation) {
      const error = 'Geolocation is not supported by your browser';
      setState((s) => ({ ...s, error }));
      return;
    }

    if (watchId.current !== null) return;

    logger.info('[GpsEngine:StartTracking]', {
      targetLocation,
      rangeThreshold,
    });

    watchId.current = navigator.geolocation.watchPosition(
      (position) => {
        const currentLoc: GeoLocationData = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp,
          speed: position.coords.speed,
          heading: position.coords.heading,
        };

        let distance: number | null = null;
        let withinRange = false;

        if (targetLocation) {
          distance = calculateDistance(
            currentLoc.latitude,
            currentLoc.longitude,
            targetLocation.latitude,
            targetLocation.longitude
          );
          withinRange = distance <= rangeThreshold;

          // Geofence Crossing Detection
          if (withinRange && !wasWithinRange.current) {
            logger.info('[GpsEngine:GeoFenceCrossed]', {
              type: 'ENTER',
              distance,
              timestamp: new Date().toISOString(),
            });
          } else if (!withinRange && wasWithinRange.current) {
            logger.warn('[GpsEngine:GeoFenceCrossed]', {
              type: 'EXIT',
              distance,
              timestamp: new Date().toISOString(),
            });
          }
          wasWithinRange.current = withinRange;
        }

        setState({
          currentLocation: currentLoc,
          error: null,
          isTracking: true,
          distanceToTarget: distance,
          isWithinRange: withinRange,
        });
      },
      (error) => {
        const message = error.message || 'Failed to get location';
        logger.error('[GpsEngine:Error]', {
          code: error.code,
          message,
        });
        setState((s) => ({ ...s, error: message, isTracking: false }));
      },
      {
        enableHighAccuracy,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  }, [targetLocation, rangeThreshold, enableHighAccuracy]);

  const stopTracking = useCallback(() => {
    if (watchId.current !== null) {
      logger.info('[GpsEngine:StopTracking]');
      navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
      setState((s) => ({ ...s, isTracking: false }));
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchId.current !== null) {
        navigator.geolocation.clearWatch(watchId.current);
      }
    };
  }, []);

  return {
    ...state,
    startTracking,
    stopTracking,
  };
}
