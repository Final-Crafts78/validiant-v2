import React, { useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { Camera, Loader2, CheckCircle2, X } from 'lucide-react';
import { useGeoLocation } from '@/hooks/useGeoLocation';
import { applyWatermark } from '@/lib/watermark';
import { toast } from 'react-hot-toast';

interface EvidenceUploadFieldProps {
  onUpload: (file: File, geoTag: unknown) => void;
  label: string;
  watermarkEnabled?: boolean;
  isPending?: boolean;
}

export const EvidenceUploadField: React.FC<EvidenceUploadFieldProps> = ({
  onUpload,
  label,
  watermarkEnabled = true,
  isPending = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [capturedGeo, setCapturedGeo] = useState<unknown | null>(null);
  const { getLocation, isLoading: isLocating } = useGeoLocation();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsProcessing(true);
      setPreview(URL.createObjectURL(file));

      // 1. Capture precise location
      const geo = await getLocation();
      setCapturedGeo(geo);

      // 2. Apply watermark if enabled
      let finalFile = file;
      if (watermarkEnabled && file.type.startsWith('image/')) {
        finalFile = await applyWatermark(file, {
          latitude: geo.latitude,
          longitude: geo.longitude,
          accuracy: geo.accuracy,
          timestamp: new Date(geo.timestamp).toISOString(),
        });
      }

      // 3. Trigger upload
      onUpload(finalFile, geo);
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : 'Forensic capture failed'
      );
      setPreview(null);
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const clear = () => {
    setPreview(null);
    setCapturedGeo(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-2">
      <div
        className={cn(
          'relative border-2 border-dashed rounded-xl transition-all duration-200 overflow-hidden min-h-[120px]',
          preview
            ? 'border-primary-500/50 bg-primary-50/5'
            : 'border-slate-200 hover:border-slate-300 bg-slate-50'
        )}
      >
        {!preview ? (
          <button
            type="button"
            disabled={isPending || isProcessing || isLocating}
            onClick={() => fileInputRef.current?.click()}
            className="w-full py-8 flex flex-col items-center justify-center gap-2 text-slate-500 hover:text-primary-600 transition-colors"
          >
            {isProcessing || isLocating ? (
              <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
            ) : (
              <Camera className="h-8 w-8" />
            )}
            <span className="text-sm font-medium">Capture {label}</span>
            <span className="text-xs text-slate-400">
              {isLocating ? 'Locating...' : 'Forensic Geo-Tagging Enabled'}
            </span>
          </button>
        ) : (
          <div className="relative group">
            <img
              src={preview}
              alt="Evidence preview"
              className="w-full h-48 object-cover rounded-lg"
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <button
                type="button"
                onClick={clear}
                disabled={isPending}
                className="p-2 bg-red-500 text-[var(--color-text-base)] rounded-full hover:bg-red-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {!!capturedGeo && (
              <div className="absolute bottom-2 left-2 right-2 flex items-center gap-2 px-3 py-1.5 bg-green-500/90 backdrop-blur-sm text-[var(--color-text-base)] text-[10px] font-bold rounded-lg uppercase tracking-wider">
                <CheckCircle2 className="h-3 w-3" />
                Forensic Meta Captured
              </div>
            )}
          </div>
        )}
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />
    </div>
  );
};
