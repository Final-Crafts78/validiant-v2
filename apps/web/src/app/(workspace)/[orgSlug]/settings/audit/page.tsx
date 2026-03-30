'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ShieldAlert,
  Download,
  Terminal,
  Globe,
  Monitor,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  History,
} from 'lucide-react';
import { activityApi } from '@/lib/api';
import { JsonDiff } from '@/components/audit/JsonDiff';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

/**
 * Enterprise Audit Trail Page
 *
 * Displays cryptographic hash-chained activity records for forensic analysis.
 * Implements absolute timestamps and JSON diffing for compliance alignment.
 */

interface AuditLog {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  userId: string | null;
  ipAddress: string | null;
  deviceType: string | null;
  details: string | null;
  oldValue: Record<string, unknown> | null;
  newValue: Record<string, unknown> | null;
  createdAt: string;
  isChainBroken?: boolean;
}
export default function AuditLogPage() {
  const [page, setPage] = useState(1);
  const limit = 50;

  const {
    data: logsRes,
    isLoading,
    isRefetching,
  } = useQuery({
    queryKey: ['audit-logs', page],
    queryFn: () => activityApi.getLogs(page, limit),
    staleTime: 30000,
  });

  const logs = logsRes?.data?.data?.data || [];
  const meta = logsRes?.data?.data?.meta;

  const handleExport = () => {
    // Direct browser download for CSV
    window.location.href = activityApi.getExportUrl();
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      {/* Header section with export action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text-base)] tracking-tight flex items-center gap-3">
            <History className="w-6 h-6 text-[var(--color-accent-base)]" />
            Enterprise Audit Trail
          </h1>
          <p className="text-[var(--color-text-muted)] text-sm mt-1">
            Immutable, cryptographic records of all organization and user
            activities.
          </p>
        </div>
        <button
          onClick={handleExport}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-[var(--color-surface-base)] border border-[var(--color-border-base)] rounded-xl text-sm font-bold text-[var(--color-text-subtle)] hover:bg-[var(--color-surface-soft)] transition-all shadow-sm active:scale-95"
        >
          <Download className="w-4 h-4" />
          Compliance Export (CSV)
        </button>
      </div>

      {/* Main log table container */}
      <div className="card-surface overflow-hidden flex flex-col">
        {isLoading ? (
          <div className="p-24 text-center">
            <div className="inline-block w-8 h-8 border-4 border-[var(--color-border-base)] border-t-[var(--color-accent-base)] rounded-full animate-spin mb-4" />
            <p className="text-[var(--color-text-muted)] font-medium">
              Analyzing audit trail...
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead>
                <tr className="bg-[var(--color-surface-soft)]/50 border-b border-[var(--color-border-base)]">
                  <th className="px-6 py-4 text-[10px] font-black text-[var(--color-text-muted)] uppercase tracking-widest w-[220px]">
                    Chronology
                  </th>
                  <th className="px-6 py-4 text-[10px] font-black text-[var(--color-text-muted)] uppercase tracking-widest w-[200px]">
                    Actor & Source
                  </th>
                  <th className="px-6 py-4 text-[10px] font-black text-[var(--color-text-muted)] uppercase tracking-widest w-[180px]">
                    Entity Target
                  </th>
                  <th className="px-6 py-4 text-[10px] font-black text-[var(--color-text-muted)] uppercase tracking-widest">
                    Modification Summary
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border-base)]/50 italic-last-row">
                {logs.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-6 py-20 text-center text-[var(--color-text-muted)]"
                    >
                      <ShieldCheck className="w-12 h-12 mx-auto mb-4 opacity-10" />
                      <p className="text-sm">
                        No activity recorded for this period.
                      </p>
                    </td>
                  </tr>
                ) : (
                  logs.map((log: AuditLog) => (
                    <tr
                      key={log.id}
                      className={cn(
                        'group transition-colors',
                        log.isChainBroken
                          ? 'bg-critical-500/10 hover:bg-critical-500/20'
                          : 'hover:bg-[var(--color-surface-soft)]/50'
                      )}
                    >
                      {/* Chronology Column */}
                      <td className="px-6 py-5 align-top">
                        <div className="flex flex-col">
                          <span className="text-xs font-mono font-bold text-[var(--color-text-base)]">
                            {format(
                              new Date(log.createdAt),
                              'yyyy-MM-dd HH:mm:ss.SSS'
                            )}
                          </span>
                          <div className="flex flex-wrap items-center gap-2 mt-2">
                            <span
                              className={cn(
                                'px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-tight',
                                log.action.includes('DELETE') ||
                                  log.action.includes('PURGED')
                                  ? 'bg-critical-500/10 text-[var(--color-critical-base)]'
                                  : log.action.includes('CREATE')
                                    ? 'bg-success-500/10 text-success-600'
                                    : 'bg-primary-500/10 text-[var(--color-accent-base)]'
                              )}
                            >
                              {log.action}
                            </span>
                            {log.isChainBroken && (
                              <div className="flex items-center gap-1 text-[10px] font-black text-[var(--color-critical-base)] bg-critical-500/10 px-2 py-0.5 rounded border border-critical-500/20 animate-pulse">
                                <ShieldAlert className="w-3 h-3" />
                                Integrity Failed
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Actor Column */}
                      <td className="px-6 py-5 align-top">
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center gap-2 text-xs text-[var(--color-text-subtle)] font-bold">
                            <Terminal className="w-3.5 h-3.5 text-[var(--color-text-muted)]" />
                            {log.userId || (
                              <span className="text-[var(--color-accent-base)]">
                                SYSTEM
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1.5 text-[10px] text-[var(--color-text-muted)] font-medium">
                              <Globe className="w-3 h-3 text-[var(--color-text-muted)]/50" />
                              {log.ipAddress || 'Internal'}
                            </div>
                            <div className="flex items-center gap-1.5 text-[10px] text-[var(--color-text-muted)] font-medium">
                              <Monitor className="w-3 h-3 text-[var(--color-text-muted)]/50" />
                              {log.deviceType || 'Edge'}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Entity Column */}
                      <td className="px-6 py-5 align-top ">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-black text-[var(--color-text-muted)] uppercase tracking-widest">
                            {log.entityType || 'GLOBAL'}
                          </span>
                          <span className="text-[10px] font-mono text-[var(--color-text-muted)] mt-1 break-all bg-[var(--color-surface-soft)] px-1 py-0.5 rounded border border-[var(--color-border-base)]/50">
                            {log.entityId || 'N/A'}
                          </span>
                        </div>
                      </td>

                      {/* Modification Column */}
                      <td className="px-6 py-5 align-top">
                        {log.details && (
                          <p className="text-xs text-[var(--color-text-muted)] mb-3 leading-relaxed font-medium">
                            {log.details}
                          </p>
                        )}
                        <JsonDiff
                          oldValue={log.oldValue}
                          newValue={log.newValue}
                        />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Dynamic Pagination Controls */}
        <div className="px-6 py-4 border-t border-[var(--color-border-base)] flex items-center justify-between bg-[var(--color-surface-soft)]/20">
          <div className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider">
            Displaying {logs.length} forensic records
            {isRefetching && (
              <span className="ml-3 text-[var(--color-accent-base)] animate-pulse">
                Refreshing...
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1 || isLoading}
              className="p-2 bg-[var(--color-surface-base)] border border-[var(--color-border-base)] rounded-xl hover:bg-[var(--color-surface-soft)] disabled:opacity-30 transition-all shadow-sm active:scale-95"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-1 px-4 py-2 bg-[var(--color-surface-base)] border border-[var(--color-border-base)] rounded-xl shadow-sm">
              <span className="text-xs font-bold text-[var(--color-text-muted)] uppercase">
                Page
              </span>
              <span className="text-sm font-black text-[var(--color-text-base)]">
                {page}
              </span>
            </div>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={!meta || logs.length < limit || isLoading}
              className="p-2 bg-[var(--color-surface-base)] border border-[var(--color-border-base)] rounded-xl hover:bg-[var(--color-surface-soft)] disabled:opacity-30 transition-all shadow-sm active:scale-95"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
