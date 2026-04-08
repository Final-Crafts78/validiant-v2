'use client';

import React from 'react';
import { History, User, Calendar, Activity, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';

export interface AuditEvent {
  id: string;
  type: 'creation' | 'assignment' | 'verification' | 'update';
  user: string;
  timestamp: string | Date;
  details: string;
  metadata?: Record<string, unknown>;
}

interface AuditTimelineProps {
  events: AuditEvent[];
}

/**
 * AuditTimeline - High-fidelity history trail for 100% data audit compliance.
 * Vertical timeline with Obsidian aesthetics.
 */
export function AuditTimeline({ events }: AuditTimelineProps) {
  if (!events || events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-[var(--color-border-base)]/20 rounded-[2.5rem] bg-white/[0.01]">
        <History className="w-8 h-8 text-[var(--color-text-base)]/10 mb-4" />
        <p className="text-[10px] font-black text-[var(--color-text-base)]/20 uppercase tracking-widest italic">
          NO_AUDIT_TRAIL_FOUND
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-8">
        <div className="space-y-1">
          <h5 className="text-xs font-black text-[var(--color-text-base)] uppercase tracking-widest">
            Protocol Ledger
          </h5>
          <p className="text-[9px] text-[var(--color-text-base)]/30 uppercase font-bold tracking-widest leading-relaxed">
            Immutable Audit History
          </p>
        </div>
        <div className="px-3 py-1 bg-[var(--color-surface-muted)]/50 rounded-full border border-[var(--color-border-base)]/20 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">
            LIVE_SYNC_ENABLED
          </span>
        </div>
      </div>

      <div className="relative pl-10 space-y-12">
        {/* The Protocol Line */}
        <div className="absolute left-[19px] top-2 bottom-2 w-px bg-gradient-to-b from-primary via-white/5 to-transparent" />

        {events.map((event, idx) => (
          <div
            key={event.id}
            className="relative animate-in fade-in slide-in-from-left-4 duration-500"
            style={{ animationDelay: `${idx * 150}ms` }}
          >
            {/* The Node */}
            <div
              className={`absolute -left-[30px] top-0 w-5 h-5 rounded-full border-2 flex items-center justify-center bg-surface-lowest z-10 ${
                event.type === 'verification'
                  ? 'border-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                  : event.type === 'creation'
                    ? 'border-primary shadow-[0_0_10px_rgba(173,198,255,0.3)]'
                    : 'border-[var(--color-border-base)]'
              }`}
            >
              {event.type === 'verification' ? (
                <CheckCircle2 className="w-2.5 h-2.5 text-emerald-500" />
              ) : event.type === 'creation' ? (
                <Activity className="w-2.5 h-2.5 text-primary" />
              ) : (
                <div className="w-1 h-1 rounded-full bg-white/40" />
              )}
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-black text-[var(--color-text-base)] uppercase tracking-widest bg-[var(--color-surface-muted)]/50 px-3 py-1 rounded-lg border border-[var(--color-border-base)]/20">
                  {event.type}
                </span>
                <span className="text-[9px] font-mono text-[var(--color-text-base)]/20 italic">
                  //{' '}
                  {format(new Date(event.timestamp), 'MMM dd, yyyy • HH:mm:ss')}
                </span>
              </div>

              <div className="bg-surface-container-high/30 p-5 rounded-[1.5rem] border border-[var(--color-border-base)]/20 group hover:border-[var(--color-border-base)]/40 transition-all">
                <p className="text-xs text-[var(--color-text-base)]/70 font-medium leading-relaxed italic mb-4">
                  "{event.details}"
                </p>

                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-primary/40" />
                    <span className="text-[10px] font-black text-[var(--color-text-base)]/40 uppercase tracking-widest">
                      {event.user}
                    </span>
                  </div>
                  {event.metadata && (
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-[var(--color-text-base)]/10" />
                      <span className="text-[9px] font-mono text-[var(--color-text-base)]/30 uppercase tracking-tighter">
                        REF_{event.id.slice(0, 8)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
