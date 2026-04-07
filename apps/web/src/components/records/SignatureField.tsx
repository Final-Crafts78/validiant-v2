'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Eraser, RotateCcw, ShieldCheck, PenTool } from 'lucide-react';
import { recordService } from '../../services/record.service';
import { ProjectTypeColumn } from '@validiant/shared';

interface SignatureValue {
  url: string;
  timestamp: string;
}

interface SignatureFieldProps {
  column: ProjectTypeColumn;
  value: unknown;
  onChange: (value: unknown) => void;
  disabled?: boolean;
}

/**
 * SIGNATURE Field - Phase 2 architect
 * Digital signature pad with R2 persistence.
 */
export const SignatureField: React.FC<SignatureFieldProps> = ({
  column,
  value: rawValue,
  onChange,
  disabled,
}) => {
  const value = rawValue as SignatureValue | null;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isEmpty, setIsEmpty] = useState(true);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
      }
    }
  }, []);

  const handleFileUpload = async (blob: Blob) => {
    setIsUploading(true);
    try {
      const publicUrl = await recordService.uploadMedia(
        column.projectId,
        column.key,
        blob
      );
      onChange({
        url: publicUrl,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      console.error('Signature upload failed', err);
    } finally {
      setIsUploading(false);
    }
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    if (disabled || isUploading) return;
    setIsDrawing(true);
    setIsEmpty(false);
    draw(e);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const touch = 'touches' in e ? e.touches[0] : null;
    const x =
      (touch ? touch.clientX : (e as React.MouseEvent).clientX) - rect.left;
    const y =
      (touch ? touch.clientY : (e as React.MouseEvent).clientY) - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.beginPath();
    }
  };

  const clear = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
      setIsEmpty(true);
      if (value) onChange(null);
    }
  };

  const save = async () => {
    if (isEmpty || !canvasRef.current || isUploading) return;
    const canvas = canvasRef.current;
    canvas.toBlob(async (blob) => {
      if (blob) {
        await handleFileUpload(blob);
      }
    }, 'image/png');
  };

  return (
    <div className="space-y-3">
      <div
        className={`relative aspect-[16/6] bg-black/40 border rounded-xl overflow-hidden touch-none transition-all duration-300
          ${
            isUploading
              ? 'opacity-50 animate-pulse border-white/20'
              : 'border-white/10 hover:border-white/20'
          }
          ${value ? 'border-green-500/30' : ''}`}
      >
        {value ? (
          <div className="w-full h-full flex items-center justify-center p-4">
            <img
              src={value.url}
              alt="Signature"
              className="max-w-full max-h-full object-contain invert opacity-90"
            />
            <div className="absolute top-2 right-2 flex items-center gap-2">
              <div className="p-1 px-2 bg-green-500/20 rounded border border-green-500/30 text-[10px] text-green-400 font-mono flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                VERIFIED CAPTURE
              </div>
              {!disabled && (
                <button
                  onClick={clear}
                  className="p-1 bg-white/5 hover:bg-white/10 rounded transition-colors"
                >
                  <RotateCcw className="w-3 h-3 text-white/40" />
                </button>
              )}
            </div>
          </div>
        ) : (
          <>
            <canvas
              ref={canvasRef}
              width={600}
              height={225}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
              className="w-full h-full cursor-crosshair"
            />

            <div className="absolute top-2 right-2 flex items-center gap-2 pointer-events-none opacity-40">
              <PenTool className="w-4 h-4 text-white" />
            </div>

            {isEmpty && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-[11px] font-mono tracking-[0.2em] uppercase text-white/20">
                  Sign Here With Mouse/Finger
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {!value && !isEmpty && !disabled && (
        <div className="flex items-center justify-between">
          <button
            onClick={clear}
            className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-xs text-white/60 transition-all active:scale-95"
          >
            <Eraser className="w-3.5 h-3.5" />
            Clear Pad
          </button>

          <button
            onClick={save}
            disabled={isUploading}
            className="flex items-center gap-2 px-4 py-1.5 bg-white text-black font-semibold rounded-lg text-xs transition-all hover:bg-white/90 active:scale-95 shadow-lg shadow-white/10"
          >
            {isUploading ? 'Locking Signature...' : 'Confirm Signature'}
          </button>
        </div>
      )}

      {isUploading && (
        <div className="text-[10px] text-blue-400/80 italic animate-pulse flex items-center gap-2">
          <ShieldCheck className="w-3 h-3" />
          Capturing Stroke Intelligence...
        </div>
      )}
    </div>
  );
};
