import React from 'react';
import { AlertTriangle, CheckCircle, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SlaBadgeProps {
  metrics?: {
    status: 'on_track' | 'at_risk' | 'breached';
    percentage: number;
    remainingHours: number;
  };
  className?: string;
}

export const SlaBadge: React.FC<SlaBadgeProps> = ({ metrics, className }) => {
  if (!metrics) return null;

  const { status, percentage, remainingHours } = metrics;

  const statusConfig = {
    on_track: {
      color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
      icon: CheckCircle,
      label: 'On Track',
      glow: 'shadow-emerald-500/20',
    },
    at_risk: {
      color: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
      icon: AlertTriangle,
      label: 'At Risk',
      glow: 'shadow-amber-500/20',
    },
    breached: {
      color: 'text-rose-500 bg-rose-500/10 border-rose-500/20',
      icon: Zap,
      label: 'SLA Breached',
      glow: 'shadow-rose-500/20',
    },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        'flex items-center gap-3 px-4 py-2 rounded-xl border backdrop-blur-md transition-all duration-500',
        config.color,
        config.glow,
        'shadow-lg',
        className
      )}
    >
      <div className="relative">
        <Icon className="w-5 h-5 animate-pulse" />
        {status === 'at_risk' && (
          <div className="absolute inset-0 bg-amber-500 rounded-full blur-md opacity-20 animate-ping" />
        )}
      </div>

      <div className="flex flex-col text-left">
        <span className="text-[10px] uppercase tracking-wider font-bold opacity-70">
          SLA Status
        </span>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold">{config.label}</span>
          <span className="text-xs opacity-50">•</span>
          <span className="text-xs font-mono font-medium whitespace-nowrap">
            {remainingHours > 0
              ? `${remainingHours}h remaining`
              : `${Math.abs(remainingHours)}h overdue`}
          </span>
        </div>
      </div>

      <div className="ml-4 w-12 h-12 relative flex items-center justify-center">
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx="24"
            cy="24"
            r="18"
            stroke="currentColor"
            strokeWidth="3"
            strokeDasharray={113}
            strokeDashoffset={113 - (113 * percentage) / 100}
            className="opacity-20"
            fill="transparent"
          />
          <circle
            cx="24"
            cy="24"
            r="18"
            stroke="currentColor"
            strokeWidth="3"
            strokeDasharray={113}
            strokeDashoffset={113 - (113 * percentage) / 100}
            strokeLinecap="round"
            fill="transparent"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-[10px] font-bold">
            {Math.round(percentage)}%
          </span>
        </div>
      </div>
    </div>
  );
};
