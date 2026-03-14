/**
 * useGeoLocation Hook
 *
 * Safely extracts GPS coordinates and accuracy from the browser.
 */

import { useState, useCallback } from 'react';

export interface GeoLocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}

export interface GeoLocationState {
  location: GeoLocationData | null;
  error: string | null;
  isLoading: boolean;
}

export function useGeoLocation() {
  const [state, setState] = useState<GeoLocationState>({
    location: null,
    error: null,
    isLoading: false,
  });

  const getLocation = useCallback((): Promise<GeoLocationData> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        const error = 'Geolocation is not supported by your browser';
        setState((s) => ({ ...s, error }));
        reject(new Error(error));
        return;
      }

      setState((s) => ({ ...s, isLoading: true, error: null }));

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const data: GeoLocationData = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp,
          };
          setState({
            location: data,
            error: null,
            isLoading: false,
          });
          resolve(data);
        },
        (error) => {
          let message = 'An unknown error occurred while fetching location';
          switch (error.code) {
            case error.PERMISSION_DENIED:
              message = 'Location permission denied by user';
              break;
            case error.POSITION_UNAVAILABLE:
              message = 'Location information is unavailable';
              break;
            case error.TIMEOUT:
              message = 'The request to get user location timed out';
              break;
          }
          setState({
            location: null,
            error: message,
            isLoading: false,
          });
          reject(new Error(message));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    });
  }, []);

  return { ...state, getLocation };
}
