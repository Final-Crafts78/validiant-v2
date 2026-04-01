'use client';

import { useActivityLogs } from '@/hooks/useActivityLogs';
import { useWorkspaceStore } from '@/store/workspace';
import {
  FileText,
  Clock,
  User,
  ShieldCheck,
  AlertTriangle,
  History,
  ArrowRight,
  Loader2,
} from 'lucide-react';
import { format } from 'date-fns';

export function ActivityLogTab({ projectId }: { projectId: string }) {
  const activeOrgId = useWorkspaceStore((s) => s.activeOrgId);

  // Fetch logs related to this project (entityType=project and entityId=projectId)
  // OR fetch all logs for the org (for now we filter by project in the query)
  const { data: logs, isLoading } = useActivityLogs({
    orgId: activeOrgId || '',
    entityId: projectId,
    entityType: 'project',
    limit: 50,
  });

  if (isLoading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center gap-4 text-slate-500">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
        <p className="font-bold text-sm uppercase tracking-widest">
          Recalling Audit History...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl pb-24">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <History className="w-5 h-5 text-indigo-500" />
            Project Audit Trail
          </h2>
          <p className="text-sm text-slate-500">
            Immutable operation logs for compliance and accountability.
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-bold uppercase tracking-wider border border-emerald-100">
          <ShieldCheck className="w-3 h-3" />
          Cryptographically Verified
        </div>
      </div>

      <div className="relative">
        {/* Timeline Vertical Line */}
        <div className="absolute left-[21px] top-4 bottom-0 w-0.5 bg-slate-100" />

        <div className="space-y-8 relative">
          {logs && logs.length > 0 ? (
            logs.map((log) => (
              <div key={log.id} className="flex gap-6 group">
                {/* Icon Container */}
                <div className="relative z-10">
                  <div
                    className={`w-11 h-11 rounded-full border-4 border-white shadow-sm flex items-center justify-center ${log.isChainBroken ? 'bg-rose-100 text-rose-600' : 'bg-slate-50 text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors'}`}
                  >
                    {log.isChainBroken ? (
                      <AlertTriangle className="w-5 h-5" />
                    ) : (
                      <FileText className="w-5 h-5" />
                    )}
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 pt-1 bg-white border border-slate-100 p-4 rounded-2xl shadow-sm hover:shadow-md transition-all">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest bg-indigo-50 px-2 py-0.5 rounded leading-none">
                      {log.action}
                    </span>
                    <span className="text-[10px] font-medium text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {format(new Date(log.createdAt), 'MMM d, yyyy · HH:mm:ss')}
                    </span>
                  </div>

                  <p className="text-sm text-slate-700 font-medium">
                    {log.details || 'No additional details recorded.'}
                  </p>

                  <div className="mt-3 flex items-center justify-between pt-3 border-t border-slate-50">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                        <User className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-xs text-slate-500 font-medium">
                        {log.userId || 'System Automator'}
                      </span>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-[9px] text-slate-300 font-mono">
                        Hash: {log.id.split('-')[0]}...
                      </div>
                      <button className="text-[10px] font-bold text-slate-400 hover:text-indigo-600 flex items-center gap-1 transition-colors">
                        View Raw <ArrowRight className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  </div>

                  {log.isChainBroken && (
                    <div className="mt-2 p-2 bg-rose-50 border border-rose-100 rounded-lg text-[10px] text-rose-600 font-bold flex items-center gap-2 animate-pulse">
                      <AlertTriangle className="w-3 h-3" />
                      INTEGRITY WARNING: Log chain continuity broken at this entry.
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="py-20 text-center bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
              <History className="w-12 h-12 text-slate-200 mx-auto mb-4" />
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">
                No recorded activity
              </p>
              <p className="text-xs text-slate-400 mt-2">
                Operations performed on this project will appear here in real-time.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
