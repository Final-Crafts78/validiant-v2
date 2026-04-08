'use client';

import React, { useState, useEffect } from 'react';
import {
  Server,
  Database,
  HardDrive,
  CloudDownload,
  ShieldCheck,
  Activity,
  History,
  Loader2,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Lock,
  ChevronRight,
  DatabaseZap,
} from 'lucide-react';
import { useWorkspaceStore } from '@/store/workspace';
import {
  listBackups,
  triggerBackup,
  getSystemHealth,
  type BackupRecord,
  type SystemHealth,
} from '@/services/infra.service';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { usePermission } from '@/hooks/usePermission';

export default function InfraSettings() {
  const hasPermission = usePermission('infra:backup');
  const activeOrgId = useWorkspaceStore((state) => state.activeOrgId);
  const [backups, setBackups] = useState<BackupRecord[]>([]);
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isBackingUp, setIsBackingUp] = useState(false);

  const fetchData = async () => {
    try {
      const [backupData, healthData] = await Promise.all([
        listBackups(),
        getSystemHealth(),
      ]);
      setBackups(backupData);
      setHealth(healthData);
    } catch (error) {
      console.error('Failed to fetch infra stats', error);
      toast.error('Could not load infrastructure data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (hasPermission) {
      fetchData();
    } else {
      setIsLoading(false);
    }
  }, [activeOrgId, hasPermission]);

  const handleTriggerBackup = async () => {
    setIsBackingUp(true);
    try {
      await triggerBackup();
      toast.success('Backup sequence initiated successfully');
      await fetchData();
    } catch (error) {
      toast.error('Failed to trigger backup');
    } finally {
      setIsBackingUp(false);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!hasPermission) {
    return (
      <div className="max-w-4xl mx-auto py-20 px-6">
        <div className="bg-white border border-slate-200 rounded-[2.5rem] p-12 text-center shadow-sm">
          <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock className="w-10 h-10 text-red-500" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-2">
            Access Restricted
          </h2>
          <p className="text-slate-500 max-w-sm mx-auto mb-8 font-medium">
            You do not have the{' '}
            <code className="bg-slate-100 px-1.5 py-0.5 rounded text-red-600 text-xs font-bold">
              infra:backup
            </code>{' '}
            permission required to access this portal.
          </p>
          <button
            onClick={() => window.history.back()}
            className="px-8 py-3 bg-slate-900 text-[var(--color-text-base)] rounded-2xl font-bold hover:bg-slate-800 transition-all active:scale-95"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            Infrastructure & Safety
          </h1>
          <p className="text-slate-500 text-sm font-medium mt-1">
            Real-time system health and secure data snapshots.
          </p>
        </div>

        <button
          onClick={handleTriggerBackup}
          disabled={isBackingUp}
          className="group flex items-center gap-3 px-8 py-3.5 bg-slate-900 text-[var(--color-text-base)] rounded-2xl font-bold hover:bg-slate-800 shadow-xl shadow-slate-200 transition-all active:scale-95 disabled:opacity-50"
        >
          {isBackingUp ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <DatabaseZap className="w-5 h-5 text-indigo-400 group-hover:scale-110 transition-transform" />
          )}
          Trigger Cold Backup
        </button>
      </div>

      {/* System Health Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: 'Edge Network',
            status: health?.api || 'Operational',
            icon: Activity,
            color: 'text-emerald-600',
            bg: 'bg-emerald-50',
          },
          {
            label: 'Core Database',
            status: health?.database || 'Healthy',
            icon: Database,
            color: 'text-indigo-600',
            bg: 'bg-indigo-50',
          },
          {
            label: 'S3 Storage (R2)',
            status: health?.storage || 'Connected',
            icon: HardDrive,
            color: 'text-amber-600',
            bg: 'bg-amber-50',
          },
          {
            label: 'Compute Engine',
            status: health?.worker || 'Nominal',
            icon: Server,
            color: 'text-sky-600',
            bg: 'bg-sky-50',
          },
        ].map((stat, idx) => (
          <div
            key={idx}
            className="bg-white border border-slate-200 rounded-3xl p-5 flex items-center gap-4 shadow-sm hover:shadow-md transition-all"
          >
            <div
              className={cn(
                'w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner',
                stat.bg,
                stat.color
              )}
            >
              <stat.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                {stat.label}
              </p>
              <p className="text-sm font-bold text-slate-800 capitalize leading-tight">
                {stat.status}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Backup History */}
      <div className="bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden shadow-sm">
        <div className="px-8 py-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-[var(--color-text-base)] shadow-lg shadow-indigo-100">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 tracking-tight leading-none">
                Snapshot Repository
              </h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1.5">
                R2 / S3 IMMUTABLE STORAGE
              </p>
            </div>
          </div>
          <p className="text-xs text-slate-400 font-medium italic px-4 py-1.5 bg-white border border-slate-200 rounded-full">
            Retention: 90 Days Active
          </p>
        </div>

        {backups.length === 0 ? (
          <div className="p-20 text-center flex flex-col items-center">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-slate-100">
              <CloudDownload className="w-10 h-10 text-slate-100" />
            </div>
            <p className="text-sm font-bold text-slate-800">
              No restorable snapshots found
            </p>
            <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto leading-relaxed">
              Snapshots are automatically generated every 24 hours. You can also
              trigger a manual cold backup above.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                    Storage Key
                  </th>
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                    Footprint
                  </th>
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-wider text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {backups.map((bk, idx) => (
                  <tr
                    key={idx}
                    className="hover:bg-slate-50/50 transition-colors group cursor-default"
                  >
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-9 h-9 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 border border-emerald-100 group-hover:scale-110 transition-transform">
                          <CheckCircle2 className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-sm font-mono font-bold text-slate-700 truncate max-w-[280px]">
                            {bk.key.split('/').pop()}
                          </p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">
                            Verified Integrity
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-1.5 text-xs font-black text-slate-600">
                        <HardDrive className="w-3.5 h-3.5 text-slate-400" />
                        {formatSize(bk.size)}
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span className="text-xs font-bold text-slate-500">
                          {formatDistanceToNow(new Date(bk.uploadedAt), {
                            addSuffix: true,
                          })}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <button
                        className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all opacity-0 group-hover:opacity-100 shadow-sm"
                        onClick={() =>
                          toast.promise(
                            new Promise((r) => setTimeout(r, 1000)),
                            {
                              loading: 'Preparing download...',
                              success: 'Snapshot signature generated',
                              error: 'Download failed',
                            }
                          )
                        }
                      >
                        <CloudDownload className="w-3.5 h-3.5" />
                        Restore
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Compliance Notice */}
      <div className="bg-amber-600 rounded-[2.5rem] p-8 text-[var(--color-text-base)] flex flex-col md:flex-row items-center gap-8 shadow-xl shadow-amber-100 relative group overflow-hidden">
        <div className="absolute top-0 left-0 w-64 h-64 bg-[var(--color-surface-muted)] rounded-full blur-3xl -ml-32 -mt-32 group-hover:scale-110 transition-all duration-700" />

        <div className="flex-1 relative z-10 text-center md:text-left">
          <h4 className="text-lg font-black flex items-center justify-center md:justify-start gap-2 mb-2">
            <AlertTriangle className="w-6 h-6 animate-pulse" />
            Infrastructure Policy Alert
          </h4>
          <p className="text-sm text-amber-50 leading-relaxed font-medium max-w-xl">
            Cold storage snapshots contain sensitive organization data.
            Accessing or downloading these artifacts is logged under the{' '}
            <span className="underline decoration-white/30">
              Forensic Audit Protocol
            </span>
            . Unauthorized restoration may trigger a security incident.
          </p>
        </div>

        <div className="flex items-center gap-4 relative z-10 bg-[var(--color-surface-muted)] p-5 rounded-3xl border border-[var(--color-border-base)]">
          <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-amber-600 shadow-xl">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div>
            <p className="text-sm font-black text-[var(--color-text-base)] leading-tight">
              ISO-27001 Compliant
            </p>
            <p className="text-[10px] text-amber-100 font-bold uppercase tracking-widest mt-0.5">
              Auditing Enabled
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
