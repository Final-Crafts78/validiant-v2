'use client';

import React, { useRef, useState, useCallback } from 'react';
import { Camera, RefreshCcw, Upload, X, ShieldCheck } from 'lucide-react';
import { recordService } from '../../services/record.service';
import { ProjectTypeColumn } from '@validiant/shared';

interface PhotoValue {
  url: string;
  timestamp: string;
  capturedBy: string;
}

interface PhotoCaptureFieldProps {
  column: ProjectTypeColumn;
  value: unknown;
  onChange: (value: unknown) => void;
  disabled?: boolean;
}

/**
 * PHOTO_CAPTURE Field - Phase 2 architect
 * Supports Camera API + Gallery Upload fallback.
 */
export const PhotoCaptureField: React.FC<PhotoCaptureFieldProps> = ({
  column,
  value: rawValue,
  onChange,
  disabled,
}) => {
  const value = rawValue as PhotoValue | null;
  const [isCapturing, setIsCapturing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Capture Photo Logic
  const startCamera = async () => {
    setIsCapturing(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error('Camera access failed', err);
      setIsCapturing(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
    }
    setIsCapturing(false);
  };

  const handleFileUpload = async (file: File | Blob) => {
    setIsUploading(true);
    try {
      const publicUrl = await recordService.uploadMedia(
        column.projectId,
        column.key,
        file
      );

      onChange({
        url: publicUrl,
        timestamp: new Date().toISOString(),
        capturedBy: 'self', // TODO: user context
      });
    } catch (err) {
      console.error('Upload failed', err);
    } finally {
      setIsUploading(false);
    }
  };

  const capturePhoto = useCallback(() => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0);

        canvasRef.current.toBlob(
          async (blob) => {
            if (blob) {
              await handleFileUpload(blob);
            }
          },
          'image/jpeg',
          0.8
        );

        stopCamera();
      }
    }
  }, [videoRef, canvasRef, handleFileUpload]);

  return (
    <div className="space-y-3">
      {value ? (
        <div className="relative group rounded-xl overflow-hidden aspect-video bg-black/40 border border-[var(--color-border-base)]/40">
          <img
            src={value.url}
            alt="Captured"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
            <button
              onClick={() => onChange(null)}
              className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="text-xs text-[var(--color-text-base)]/50 absolute bottom-3 left-3 bg-black/40 px-2 py-1 rounded">
              Captured {new Date(value.timestamp).toLocaleTimeString()}
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {/* Camera Button */}
          <button
            onClick={startCamera}
            disabled={disabled || isUploading}
            className="flex flex-col items-center justify-center gap-3 p-6 bg-[var(--color-surface-muted)]/50 border border-[var(--color-border-base)]/40 rounded-xl hover:bg-[var(--color-surface-muted)] hover:border-[var(--color-border-base)] transition-all group"
          >
            <Camera className="w-8 h-8 text-[var(--color-text-base)]/40 group-hover:text-[var(--color-text-base)] transition-colors" />
            <span className="text-sm font-medium text-[var(--color-text-base)]/60 group-hover:text-[var(--color-text-base)] text-center">
              Take Photo
            </span>
          </button>

          {/* Upload Button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled || isUploading}
            className="flex flex-col items-center justify-center gap-3 p-6 bg-[var(--color-surface-muted)]/50 border border-[var(--color-border-base)]/40 rounded-xl hover:bg-[var(--color-surface-muted)] hover:border-[var(--color-border-base)] transition-all group"
          >
            <Upload className="w-8 h-8 text-[var(--color-text-base)]/40 group-hover:text-[var(--color-text-base)] transition-colors" />
            <span className="text-sm font-medium text-[var(--color-text-base)]/60 group-hover:text-[var(--color-text-base)] text-center">
              From Gallery
            </span>
          </button>
        </div>
      )}

      {/* Camera Capture Overlay */}
      {isCapturing && (
        <div className="fixed inset-0 z-[100] bg-black flex flex-col pt-12">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full flex-1 object-cover"
          />
          <div className="p-10 flex items-center justify-between bg-zinc-950/80 border-t border-[var(--color-border-base)]/40">
            <button
              onClick={stopCamera}
              className="p-4 bg-[var(--color-surface-muted)]/50 rounded-full hover:bg-[var(--color-surface-muted)] transition-colors"
            >
              <X className="w-8 h-8 text-[var(--color-text-base)]" />
            </button>
            <button
              onClick={capturePhoto}
              className="w-20 h-20 bg-white rounded-full border-4 border-zinc-900 shadow-xl active:scale-95 transition-transform"
            />
            <button className="p-4 bg-[var(--color-surface-muted)]/50 rounded-full opacity-50 cursor-not-allowed">
              <RefreshCcw className="w-8 h-8 text-[var(--color-text-base)]" />
            </button>
          </div>
        </div>
      )}

      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFileUpload(file);
        }}
      />

      <canvas ref={canvasRef} className="hidden" />

      {isUploading && (
        <div className="flex items-center gap-2 text-xs text-[var(--color-text-base)]/40 italic">
          <ShieldCheck className="w-3 h-3 animate-pulse" />
          Verifying and encrypting capture...
        </div>
      )}
    </div>
  );
};
