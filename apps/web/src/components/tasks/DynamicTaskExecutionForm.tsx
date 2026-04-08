'use client';

import { useState, useEffect } from 'react';
import {
  Camera,
  Check,
  Upload,
  Save,
  Loader2,
  AlertCircle,
  MapPin,
  ShieldCheck,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useGeoTelemetry } from '@/hooks/useGeoTelemetry';
import { useTimeTracker } from '@/hooks/useTimeTracker';
import { logger } from '@/lib/logger';
import { FieldSchema } from '@validiant/shared';
import { GeoTelemetryStatusBar } from './GeoTelemetryStatusBar';

export function DynamicTaskExecutionForm({
  schema,
  initialData,
  onSave,
  taskId,
  targetLocation,
}: {
  schema: FieldSchema[];
  initialData?: Record<string, unknown>;
  onSave: (data: Record<string, unknown>) => Promise<void>;
  taskId?: string;
  targetLocation?: { latitude: number; longitude: number };
}) {
  const [formData, setFormData] = useState<Record<string, unknown>>(
    initialData || {}
  );
  const [isSaving, setIsSaving] = useState(false);

  // Initialize GPS Engine & Time Tracker
  const {
    currentLocation,
    isTracking,
    isWithinRange,
    distanceToTarget,
    startTracking,
    stopTracking,
  } = useGeoTelemetry({ targetLocation });

  const {
    elapsedTime,
    start: startTimer,
    stop: stopTimer,
  } = useTimeTracker(taskId);

  // Auto-start on mount
  useEffect(() => {
    startTracking();
    startTimer();
    return () => {
      stopTracking();
      // We don't stop timer on unmount to allow for persistence in TaskDetailSlideOver
    };
  }, [startTracking, startTimer, stopTracking]);

  const updateField = (key: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleCapture = (key: string, file: File) => {
    // Collect specific coordinate for this capture if GPS is active
    if (currentLocation) {
      logger.info('[GpsEngine:EvidenceCapture]', {
        key,
        lat: currentLocation.latitude,
        lng: currentLocation.longitude,
        accuracy: currentLocation.accuracy,
      });
      updateField(`${key}_lat`, currentLocation.latitude);
      updateField(`${key}_lng`, currentLocation.longitude);
    }

    const url = URL.createObjectURL(file);
    updateField(key, url);
    toast.success('Photo captured with geo-tag info');
  };

  const handleSave = async () => {
    // Basic required validation
    for (const field of schema) {
      if (
        field.required &&
        (formData[field.fieldKey] === undefined ||
          formData[field.fieldKey] === '')
      ) {
        toast.error(`Field "${field.label}" is required.`);
        return;
      }
    }

    // Geofence enforcement
    const geoEnforcedField = schema.find(
      (f) => f.validationRules?.requireGeoTag
    );
    if (geoEnforcedField && !isWithinRange) {
      toast.error(
        'GEOFENCE ERROR: You must be at the site to save this protocol.'
      );
      logger.warn('[GpsEngine:EnforcementBlock]', {
        taskId,
        distance: distanceToTarget,
      });
      return;
    }

    setIsSaving(true);
    try {
      const finalDuration = stopTimer();
      const submissionPayload = {
        ...formData,
        _telemetry: {
          executionLat: currentLocation?.latitude,
          executionLng: currentLocation?.longitude,
          durationMs: finalDuration,
          timestamp: new Date().toISOString(),
          accuracy: currentLocation?.accuracy,
        },
      };

      await onSave(submissionPayload);
      logger.info('[TimeTracker:FinalDuration]', {
        taskId,
        durationMs: finalDuration,
      });
      toast.success('Task execution data saved!');
    } catch (err) {
      toast.error('Failed to save data');
    } finally {
      setIsSaving(false);
    }
  };

  if (!schema || schema.length === 0) return null;

  return (
    <div className="mt-8 border-t border-slate-200 pt-6">
      {/* Geo-Telemetry HUD */}
      <GeoTelemetryStatusBar
        isTracking={isTracking}
        isWithinRange={isWithinRange}
        distanceToTarget={distanceToTarget}
        elapsedTime={elapsedTime}
        accuracy={currentLocation?.accuracy || null}
      />

      <div className="flex items-center gap-2 mb-4">
        <AlertCircle className="w-5 h-5 text-indigo-500" />
        <h3 className="text-lg font-bold text-slate-800">Execution Protocol</h3>
      </div>

      <p className="font-bold text-slate-800 text-lg mb-1">No tasks found</p>
      <p className="text-sm text-slate-500 mb-6">
        This session is being monitored via <b>Encrypted Geo-Telemetry</b>.
        Distance to site and execution duration are recorded for quality
        assurance.
      </p>

      <div className="space-y-6">
        {schema.map((field) => (
          <div
            key={field.fieldKey}
            className={`bg-slate-50 p-4 rounded-xl border transition-all ${
              field.validationRules?.requireGeoTag && !isWithinRange
                ? 'border-amber-200 bg-amber-50/20'
                : 'border-slate-200'
            }`}
          >
            <label className="flex items-center justify-between mb-2">
              <span className="text-sm font-bold text-slate-700">
                {field.label}{' '}
                {field.required && <span className="text-red-500">*</span>}
              </span>
              {field.validationRules?.requireGeoTag && (
                <div
                  className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                    isWithinRange
                      ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                      : 'bg-amber-100 text-amber-700 border-amber-200'
                  }`}
                >
                  <MapPin className="w-3 h-3" />
                  {isWithinRange ? 'Geo-Linked' : 'Out of Bounds'}
                </div>
              )}
            </label>

            {/* 1. Text Field */}
            {(field.type === 'text' || field.type === 'textarea') && (
              <input
                type={field.type === 'text' ? 'text' : 'textarea'}
                value={(formData[field.fieldKey] as string) || ''}
                onChange={(e) => updateField(field.fieldKey, e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm shadow-sm focus:ring-2 focus:ring-indigo-500"
                placeholder={`Enter ${field.label.toLowerCase()}...`}
              />
            )}

            {/* 2. Boolean Toggle */}
            {field.type === 'boolean' && (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => updateField(field.fieldKey, true)}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 ${formData[field.fieldKey] === true ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-white border-slate-300 text-slate-500'} border`}
                >
                  <Check className="w-4 h-4" /> Yes
                </button>
                <button
                  onClick={() => updateField(field.fieldKey, false)}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 ${formData[field.fieldKey] === false ? 'bg-red-100 text-red-800 border-red-300' : 'bg-white border-slate-300 text-slate-500'} border`}
                >
                  No
                </button>
              </div>
            )}

            {/* 3. Photo Request with Native enforcement */}
            {field.type === 'photo-request' && (
              <div>
                {formData[field.fieldKey] ? (
                  <div className="relative rounded-lg overflow-hidden border border-slate-200">
                    <img
                      src={formData[field.fieldKey] as string}
                      alt="Captured"
                      className="w-full h-48 object-cover"
                    />
                    <div className="absolute top-2 left-2 bg-black/60 text-[var(--color-text-base)] text-[10px] font-bold px-2 py-1 rounded backdrop-blur-md flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-emerald-400" />
                      GEO-TAGGED
                    </div>
                    <button
                      onClick={() => updateField(field.fieldKey, null)}
                      className="absolute top-2 right-2 bg-black/70 text-[var(--color-text-base)] text-xs px-2 py-1 rounded backdrop-blur-md hover:bg-black/90 transition-colors"
                    >
                      Retake
                    </button>
                  </div>
                ) : (
                  <label
                    className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                      field.validationRules?.requireGeoTag && !isWithinRange
                        ? 'border-amber-300 bg-amber-50 cursor-not-allowed opacity-60'
                        : 'border-indigo-200 bg-indigo-50/50 hover:bg-indigo-50'
                    }`}
                  >
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Camera
                        className={`w-8 h-8 mb-2 ${
                          field.validationRules?.requireGeoTag && !isWithinRange
                            ? 'text-amber-400'
                            : 'text-indigo-500'
                        }`}
                      />
                      <p
                        className={`text-sm font-semibold ${
                          field.validationRules?.requireGeoTag && !isWithinRange
                            ? 'text-amber-700'
                            : 'text-indigo-700'
                        }`}
                      >
                        {field.validationRules?.requireGeoTag && !isWithinRange
                          ? 'Awaiting Proximity Lock'
                          : 'Open Camera to Capture'}
                      </p>
                      {field.validationRules?.requireGeoTag && (
                        <p
                          className={`text-[10px] font-bold uppercase tracking-tight mt-1 ${
                            isWithinRange
                              ? 'text-emerald-600'
                              : 'text-amber-600'
                          }`}
                        >
                          {isWithinRange
                            ? 'Ready for Geo-Tagged Capture'
                            : 'Satellite Range Enforcement Active'}
                        </p>
                      )}
                    </div>
                    {!field.validationRules?.requireGeoTag || isWithinRange ? (
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            handleCapture(field.fieldKey, e.target.files[0]);
                          }
                        }}
                      />
                    ) : null}
                  </label>
                )}
              </div>
            )}

            {/* 4. PDF Upload */}
            {field.type === 'pdf-upload' && (
              <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-slate-300 bg-white rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3">
                  <Upload className="w-5 h-5 text-slate-400" />
                  <span className="text-sm font-medium text-slate-600">
                    Select PDF Document
                  </span>
                </div>
                <input
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                />
              </label>
            )}
          </div>
        ))}
      </div>

      <div className="mt-8 p-4 bg-indigo-50 rounded-2xl border border-indigo-100 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-indigo-600 mt-0.5" />
        <div>
          <p className="text-xs font-bold text-indigo-900 uppercase tracking-tight">
            Final Protocol Verification
          </p>
          <p className="text-[10px] text-indigo-700 leading-normal">
            Saving this protocol will permanently record your current GPS
            coordinates, site proximity, and a high-accuracy duration timestamp.
            This metadata is immutable once committed to the ledger.
          </p>
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={isSaving}
        className="mt-6 w-full py-4 bg-indigo-600 text-[var(--color-text-base)] rounded-2xl font-bold shadow-xl shadow-indigo-200 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
      >
        {isSaving ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <Save className="w-5 h-5" />
        )}
        Commit Protocol & Finalize
      </button>
    </div>
  );
}
