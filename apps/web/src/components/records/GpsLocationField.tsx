'use client';

import React, { useState } from 'react';
import { MapPin, Navigation, Map as MapIcon, RotateCcw } from 'lucide-react';
import { ProjectTypeColumn } from '@validiant/shared';

interface GpsValue {
  lat: number;
  lng: number;
  accuracy: number;
  timestamp: string;
  provider: string;
}

interface GpsLocationFieldProps {
  column: ProjectTypeColumn;
  value: unknown;
  onChange: (value: unknown) => void;
  disabled?: boolean;
}

/**
 * GPS_LOCATION Field - Phase 2 architect
 * One-tap geolocation with map preview and accuracy tracking.
 */
export const GpsLocationField: React.FC<GpsLocationFieldProps> = ({
  value: rawValue,
  onChange,
  disabled,
}) => {
  const value = rawValue as GpsValue | null;
  const [isLocating, setIsLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const captureLocation = () => {
    setIsLocating(true);
    setError(null);

    if (!navigator.geolocation) {
      setError('Geolocation not supported');
      setIsLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        onChange({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: new Date().toISOString(),
          provider: 'browser-gps',
        });
        setIsLocating(false);
      },
      (err) => {
        setError(err.message);
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  return (
    <div className="space-y-3">
      {value ? (
        <div className="bg-black/20 border border-white/10 rounded-xl overflow-hidden">
          {/* Map Preview (Simple Google Maps Iframe) */}
          <div className="w-full h-32 bg-zinc-900 border-b border-white/5 relative">
            <iframe
              title="GPS Preview"
              src={`https://www.google.com/maps/embed/v1/place?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY}&q=${value.lat},${value.lng}&zoom=15`}
              className="w-full h-full border-0 grayscale opacity-40 hover:grayscale-0 transition-all duration-500"
            />
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <MapPin className="w-6 h-6 text-red-500" />
            </div>
          </div>

          <div className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <div className="text-sm font-semibold text-white/90">
                {value.lat.toFixed(6)}, {value.lng.toFixed(6)}
              </div>
              <div className="text-[10px] text-white/30 font-mono uppercase tracking-widest leading-relaxed">
                Accuracy: ±{Math.round(value.accuracy)}m{' '}
                <span className="opacity-50">•</span> Captured{' '}
                {new Date(value.timestamp).toLocaleTimeString()}
              </div>
            </div>

            {!disabled && (
              <button
                onClick={captureLocation}
                className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors group"
                title="Refresh Location"
              >
                <RotateCcw className="w-4 h-4 text-white/40 group-hover:text-white" />
              </button>
            )}
          </div>
        </div>
      ) : (
        <button
          onClick={captureLocation}
          disabled={disabled || isLocating}
          className="w-full flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 hover:border-white/20 transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Navigation
                className={`w-5 h-5 text-blue-400 ${
                  isLocating
                    ? 'animate-pulse'
                    : 'group-hover:scale-110 transition-transform'
                }`}
              />
            </div>
            <div className="text-left">
              <div className="text-sm font-medium text-white/80 group-hover:text-white">
                Pin Current Location
              </div>
              <div className="text-[10px] text-white/40 font-mono uppercase tracking-widest italic group-hover:text-white/60">
                {isLocating ? 'Awaiting Satellite Lock...' : 'One-tap Capture'}
              </div>
            </div>
          </div>
          <MapIcon className="w-4 h-4 text-white/20" />
        </button>
      )}

      {error && (
        <div className="text-[10px] text-red-500 italic bg-red-500/5 p-2 rounded border border-red-500/10 flex items-center gap-2">
          <MapPin className="w-3 h-3" />
          {error}
        </div>
      )}
    </div>
  );
};
