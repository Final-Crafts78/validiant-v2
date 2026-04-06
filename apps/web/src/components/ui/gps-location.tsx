import * as React from "react"
import { Navigation, MapPin, RefreshCw, CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"

export interface GPSLocationProps {
  value?: { lat: number; lng: number; accuracy?: number }
  onChange: (value: { lat: number; lng: number; accuracy?: number }) => void
  disabled?: boolean
  enableHighAccuracy?: boolean
  className?: string
}

export const GPSLocation: React.FC<GPSLocationProps> = ({
  value,
  onChange,
  disabled = false,
  enableHighAccuracy = true,
  className
}) => {
  const [locating, setLocating] = React.useState(false)

  const captureLocation = () => {
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onChange({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy
        })
        setLocating(false)
      },
      (err) => {
        console.error("GPS access denied", err)
        setLocating(false)
      },
      { enableHighAccuracy, timeout: 10000, maximumAge: 0 }
    )
  }

  return (
    <div className={cn("relative group overflow-hidden rounded-[2.5rem] bg-surface-lowest border border-white/5 p-6 shadow-obsidian-lg transition-all", className)}>
      <div className="flex items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <div className={cn(
            "w-16 h-16 rounded-[1.8rem] flex items-center justify-center border border-white/5 transition-all duration-700",
            value ? "bg-emerald-500/20 border-emerald-500/20" : "bg-surface-container-low"
          )}>
            {value ? (
              <CheckCircle2 className="w-8 h-8 text-emerald-500 drop-shadow-[0_0_12px_rgba(16,185,129,0.5)]" />
            ) : (
              <Navigation className={cn("w-7 h-7 text-white/20", locating && "animate-pulse text-primary")} />
            )}
          </div>
          <div>
            <h5 className="text-[11px] font-black text-white/60 uppercase tracking-widest">
              {value ? "Geospatial Verified" : "Location Pending"}
            </h5>
            <p className="text-[10px] font-bold text-white/20 mt-1 uppercase font-mono">
              {value 
                ? `${value.lat.toFixed(6)}, ${value.lng.toFixed(6)} (+/- ${Math.round(value.accuracy || 0)}m)`
                : locating ? "Intercepting satellites..." : "No coordinate data captured"}
            </p>
          </div>
        </div>

        <button
          onClick={captureLocation}
          disabled={disabled || locating}
          className={cn(
            "flex items-center gap-2 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all",
            value 
              ? "bg-white/5 hover:bg-white/10 text-white/60" 
              : "bg-primary text-slate-950 hover:scale-105 active:scale-95 shadow-glow-primary"
          )}
        >
          {locating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4" />}
          {value ? "Recapture" : "Capture GPS"}
        </button>
      </div>
      
      <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
        <Navigation className="w-24 h-24 text-white rotate-45" />
      </div>
    </div>
  )
}
