'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useCaseHub } from '@/hooks/useCaseHub';
import { CaseSlaBanner } from '@/components/cases/CaseSlaBanner';
import { CaseFieldGrid } from '@/components/cases/CaseFieldGrid';
import { ActionPanel } from '@/components/cases/ActionPanel';
import {
  ArrowLeft,
  History,
  Paperclip,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';

export default function CaseCommandCenterPage() {
  const { caseId } = useParams() as { caseId: string };
  const router = useRouter();
  const { data: task, isLoading, error } = useCaseHub(caseId);

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-8 animate-pulse text-left">
        <div className="h-48 w-full bg-gray-200 rounded-[2.5rem]" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="h-96 w-full bg-gray-200 rounded-3xl" />
          </div>
          <div className="space-y-6">
            <div className="h-64 w-full bg-gray-200 rounded-3xl" />
            <div className="h-64 w-full bg-gray-200 rounded-3xl" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !task) {
    return (
      <div className="container mx-auto p-12 text-center space-y-6">
        <div className="inline-flex p-4 rounded-full bg-rose-500/10 text-rose-500">
          <ShieldAlert className="w-12 h-12" />
        </div>
        <h2 className="text-2xl font-bold">Case Not Found</h2>
        <p className="text-muted-foreground max-w-md mx-auto text-sm">
          We couldn't find a case with ID{' '}
          <code className="bg-gray-100 px-1 rounded">{caseId}</code>. It might
          have been deleted or you may not have permission to view it.
        </p>
        <button
          onClick={() => router.back()}
          className="inline-flex items-center px-6 py-2 border rounded-full text-sm font-medium hover:bg-gray-50 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-8 animate-in slide-in-from-bottom-4 duration-700 text-left">
      {/* Navigation Breadcrumbs */}
      <div className="flex items-center gap-2 text-sm text-gray-400">
        <button
          onClick={() => router.push('/dashboard/tasks')}
          className="hover:text-primary-600 transition-colors"
        >
          Command Center
        </button>
        <ChevronRight className="w-4 h-4" />
        <span className="font-medium text-gray-900">{caseId}</span>
      </div>

      {/* Main SLA Hero Banner */}
      <CaseSlaBanner task={task} />

      {/* Two-Column Command Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Evidence & Analysis (Action-centric) */}
        <div className="lg:col-span-2 space-y-8">
          <div className="p-8 rounded-[2.5rem] border bg-white shadow-sm overflow-hidden">
            <CaseFieldGrid task={task} />
          </div>

          <div className="p-8 rounded-[2.5rem] border bg-gray-50">
            <h3 className="text-lg font-semibold flex items-center gap-2 mb-6 text-left">
              <Paperclip className="w-5 h-5 text-primary-600" />
              Intelligence & Evidence
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="aspect-square rounded-2xl bg-white flex flex-col items-center justify-center border-2 border-dashed border-gray-200 group hover:border-primary-500/50 transition-all cursor-pointer">
                <div className="p-3 rounded-xl bg-gray-50 shadow-sm mb-2 group-hover:scale-110 transition-transform">
                  <Paperclip className="w-5 h-5 text-gray-400" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider opacity-60">
                  Upload Evidence
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Metadata & Activity */}
        <div className="space-y-8">
          {/* Status Control Card */}
          <div className="p-6 rounded-[2.5rem] border bg-white shadow-lg shadow-primary-600/5">
            <ActionPanel task={task} />
          </div>

          {/* Description Card */}
          <div className="p-6 rounded-[2.5rem] border bg-white">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 mb-4 text-left">
              Context
            </h3>
            <p className="text-sm leading-relaxed text-gray-600 text-balance text-left">
              {task.description || 'No case brief provided.'}
            </p>
          </div>

          {/* Activity Log Preview */}
          <div className="p-6 rounded-[2.5rem] border bg-white h-[350px] flex flex-col">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 mb-6 flex items-center justify-between">
              Activity Stream
              <History className="w-4 h-4 opacity-50 cursor-pointer hover:opacity-100 transition-opacity" />
            </h3>
            <div className="flex-1 flex flex-col items-center justify-center opacity-30 text-center space-y-2">
              <History className="w-10 h-10" />
              <div>
                <p className="text-xs font-bold uppercase tracking-widest">
                  Live Stream
                </p>
                <p className="text-[10px]">No recent updates</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
