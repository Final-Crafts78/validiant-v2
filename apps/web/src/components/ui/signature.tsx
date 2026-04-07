import * as React from 'react';
import { Trash2, CheckCircle2, Pencil } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SignatureProps {
  value?: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
}

export const Signature: React.FC<SignatureProps> = ({
  value,
  onChange,
  disabled = false,
  className,
}) => {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = React.useState(false);

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    if (disabled || value) return;
    setIsDrawing(true);
    draw(e);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    const ctx = canvasRef.current?.getContext('2d');
    ctx?.beginPath();

    // Auto-save on stop
    const dataUrl = canvasRef.current?.toDataURL();
    if (
      dataUrl &&
      dataUrl !==
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=='
    ) {
      // onChange(dataUrl) // We usually wait for an explicit "Accept" or just auto-bind
    }
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || !canvasRef.current || disabled || value) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const touch = 'touches' in e ? e.touches[0] : null;
    const x =
      (touch ? touch.clientX : (e as React.MouseEvent).clientX) - rect.left;
    const y =
      (touch ? touch.clientY : (e as React.MouseEvent).clientY) - rect.top;

    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#64FFDA'; // Primary cyan

    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const clear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx?.clearRect(0, 0, canvas.width, canvas.height);
    onChange('');
  };

  const save = () => {
    const dataUrl = canvasRef.current?.toDataURL();
    if (dataUrl) onChange(dataUrl);
  };

  return (
    <div
      className={cn(
        'relative group overflow-hidden rounded-[2.5rem] bg-surface-lowest border border-white/5 p-8 shadow-obsidian-lg transition-all min-h-[250px]',
        className
      )}
    >
      {value ? (
        <div className="relative h-full w-full flex flex-col items-center justify-center gap-6">
          <img
            src={value}
            alt="Signature"
            className="max-h-[120px] grayscale contrast-125 transition-all group-hover:grayscale-0 duration-700 invert"
          />
          <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 rounded-full border border-emerald-500/20">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500">
              Legal Verification Locked
            </span>
          </div>
          <button
            onClick={() => onChange('')}
            className="text-[9px] font-black uppercase tracking-widest text-white/20 hover:text-rose-500/60 transition-colors mt-2"
          >
            Clear and Re-sign
          </button>
        </div>
      ) : (
        <div className="flex flex-col h-full gap-6">
          <div className="flex items-center justify-between">
            <h5 className="text-[10px] font-black uppercase tracking-widest text-white/40 flex items-center gap-2">
              <Pencil className="w-3 h-3 text-primary" />
              Electronic Authorization Pad
            </h5>
            <div className="flex gap-2">
              <button
                onClick={clear}
                className="p-3 bg-surface-container-low hover:bg-rose-500/10 text-white/20 hover:text-rose-500 rounded-2xl transition-all"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                onClick={save}
                className="px-6 py-3 bg-primary text-slate-950 text-[10px] font-black uppercase tracking-widest rounded-2xl shadow-glow-primary hover:scale-105 active:scale-95 transition-all"
              >
                Accept Signature
              </button>
            </div>
          </div>

          <canvas
            ref={canvasRef}
            width={800}
            height={300}
            className="w-full h-[150px] bg-slate-950/50 rounded-2xl border border-white/[0.03] cursor-crosshair touch-none"
            onMouseDown={startDrawing}
            onMouseUp={stopDrawing}
            onMouseMove={draw}
            onTouchStart={startDrawing}
            onTouchEnd={stopDrawing}
            onTouchMove={draw}
          />

          <div className="text-center">
            <p className="text-[9px] font-bold text-white/10 uppercase tracking-widest">
              Sign within the capture boundary
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
