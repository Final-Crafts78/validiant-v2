import * as React from 'react';
import { Camera, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface PhotoCaptureProps {
  value?: string;
  onChange: (value: string) => void;
  aspectRatio?: string;
  disabled?: boolean;
  className?: string;
}

export const PhotoCapture: React.FC<PhotoCaptureProps> = ({
  value,
  onChange,
  aspectRatio = 'aspect-video',
  disabled = false,
  className,
}) => {
  const [stream, setStream] = React.useState<MediaStream | null>(null);
  const [capturing, setCapturing] = React.useState(false);
  const videoRef = React.useRef<HTMLVideoElement>(null);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false,
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setCapturing(true);
    } catch (err) {
      console.error('Camera access denied', err);
    }
  };

  const stopCamera = () => {
    stream?.getTracks().forEach((track) => track.stop());
    setStream(null);
    setCapturing(false);
  };

  const takePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx?.drawImage(videoRef.current, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
    onChange(dataUrl);
    stopCamera();
  };

  return (
    <div
      className={cn(
        'relative group overflow-hidden rounded-[2.5rem] bg-surface-lowest border border-white/5 shadow-obsidian',
        aspectRatio,
        className
      )}
    >
      {value ? (
        <div className="relative h-full w-full">
          <img
            src={value}
            alt="Captured"
            className="h-full w-full object-cover grayscale contrast-125 transition-all group-hover:grayscale-0 duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-6">
            <button
              onClick={() => onChange('')}
              className="px-4 py-2 bg-rose-500/20 hover:bg-rose-500/40 text-rose-500 text-[10px] font-black uppercase tracking-widest rounded-xl border border-rose-500/20 transition-all backdrop-blur-md"
            >
              Discard Capture
            </button>
          </div>
        </div>
      ) : capturing ? (
        <div className="relative h-full w-full bg-black">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="h-full w-full object-cover opacity-80"
          />
          <div className="absolute inset-x-0 bottom-6 flex justify-center gap-4">
            <button
              onClick={takePhoto}
              className="w-16 h-16 rounded-full bg-white/20 border-4 border-white/40 flex items-center justify-center hover:scale-110 transition-transform active:scale-95"
            >
              <div className="w-10 h-10 rounded-full bg-primary shadow-[0_0_20px_rgba(100,255,218,0.5)]" />
            </button>
            <button
              onClick={stopCamera}
              className="absolute right-6 bottom-4 w-10 h-10 rounded-full bg-black/40 flex items-center justify-center hover:bg-black/60 transition-colors"
            >
              <X className="w-5 h-5 text-white/40" />
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={startCamera}
          disabled={disabled}
          className="h-full w-full flex flex-col items-center justify-center gap-4 hover:bg-white/[0.02] transition-colors group/btn disabled:opacity-50"
        >
          <div className="w-16 h-16 rounded-[1.8rem] bg-surface-container-low flex items-center justify-center border border-white/5 shadow-obsidian group-hover/btn:border-primary/20 group-hover/btn:scale-110 transition-all duration-500">
            <Camera className="w-7 h-7 text-white/20 group-hover/btn:text-primary transition-colors" />
          </div>
          <div className="text-center">
            <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] group-hover/btn:text-white/60 transition-colors">
              Initialize Visual Capture
            </span>
          </div>
        </button>
      )}
    </div>
  );
};
