import React, { useState } from 'react';
import {
  X,
  ShieldCheck,
  Calendar,
  ChevronRight,
  Expand,
  Loader2,
  Save,
} from 'lucide-react';
import { ProjectRecord, ProjectType } from '@validiant/shared';
import { StatusActionBar } from './StatusActionBar';
import { AuditTimeline, AuditEvent } from './AuditTimeline';
import { ExecutiveSelector } from './ExecutiveSelector';
import { format } from 'date-fns';

interface VerificationSlideOverProps {
  isOpen: boolean;
  onClose: () => void;
  record: ProjectRecord;
  projectType: ProjectType;
  onStatusUpdate: (label: string) => Promise<void>;
  onUpdateRecord?: (data: Partial<ProjectRecord>) => Promise<void>;
  isUpdating?: boolean;
}

/**
 * VerificationSlideOver - The high-fidelity command center for record verification.
 * Implements a dual-layout responsive architecture:
 * - Desktop: Web-Optimized Grid for fast processing.
 * - Mobile: Mobile Form Layout mimicking the field app.
 */
export function VerificationSlideOver({
  isOpen,
  onClose,
  record,
  projectType,
  onStatusUpdate,
  onUpdateRecord,
  isUpdating = false,
}: VerificationSlideOverProps) {
  const [activeTab, setActiveTab] = useState<'details' | 'audit'>('details');
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState<Record<string, any>>(
    record.data || {}
  );

  if (!isOpen || !record) return null;

  // Mock Audit Events (Real implementation would fetch these)
  const auditEvents: AuditEvent[] = [
    {
      id: '1',
      type: 'creation',
      user: 'System_Ingest',
      timestamp: record.createdAt,
      details: 'Record initialized via bulk protocol migration.',
    },
    {
      id: '2',
      type: 'assignment',
      user: 'Admin_Julian',
      timestamp: record.updatedAt,
      details: `Assigned to executive ${record.assignedTo || 'Unassigned'} for field verification.`,
    },
  ];

  return (
    <div className="fixed inset-0 z-[60] overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-xl transition-opacity animate-in fade-in duration-500"
        onClick={onClose}
      />

      <div className="absolute inset-y-0 right-0 max-w-full flex">
        <div className="w-screen max-w-4xl flex flex-col bg-background shadow-obsidian-xl border-l border-[var(--border-subtle)] animate-in slide-in-from-right duration-700 ease-premium relative">
          {/* Top Navigation Bar */}
          <div className="flex items-center justify-between p-6 border-b border-white/[0.03] bg-surface-lowest/50 backdrop-blur-md sticky top-0 z-20">
            <div className="flex items-center gap-6">
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">
                    RECORD_PROTOCOL_{record.id.slice(-6).toUpperCase()}
                  </span>
                  <ChevronRight className="w-3 h-3 text-[var(--color-text-base)]/10" />
                  <span className="text-[10px] font-black text-[var(--text-muted)]/60 uppercase tracking-[0.3em] font-mono">
                    {projectType.name}
                  </span>
                </div>
                <h2 className="text-2xl font-black text-[var(--color-text-base)] tracking-tight italic uppercase">
                  Case Verification
                </h2>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex bg-[var(--surface-container-low)]/40 rounded-2xl p-1 border border-[var(--border-subtle)]">
                <button
                  onClick={() => setActiveTab('details')}
                  className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'details' ? 'bg-[var(--color-surface-muted)] text-[var(--color-text-base)] shadow-lg' : 'text-[var(--text-muted)] hover:text-[var(--color-text-base)]'}`}
                >
                  DETAILS
                </button>
                <button
                  onClick={() => setActiveTab('audit')}
                  className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'audit' ? 'bg-[var(--color-surface-muted)] text-[var(--color-text-base)] shadow-lg' : 'text-[var(--text-muted)] hover:text-[var(--color-text-base)]'}`}
                >
                  AUDIT_TRAIL
                </button>
              </div>
              <button
                onClick={() => setIsEditing(!isEditing)}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${isEditing ? 'bg-amber-500/10 border-amber-500/50 text-amber-500' : 'bg-primary/10 border-primary/50 text-primary hover:bg-primary/20'}`}
              >
                {isEditing ? 'CANCEL_EDIT' : 'EDIT_PROTOCOL'}
              </button>
            </div>
            <button
              onClick={onClose}
              className="p-3 hover:bg-[var(--surface-container-low)]/40 rounded-2xl border border-[var(--border-subtle)] transition-all group"
            >
              <X className="w-6 h-6 text-[var(--text-muted)] group-hover:text-[var(--color-text-base)] group-hover:rotate-90 transition-all duration-500" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-10 py-10 space-y-12 custom-scrollbar pb-32">
            {activeTab === 'details' ? (
              <div className="space-y-12">
                {/* 1. Header Metadata (Web-Optimized Stats) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-surface-container-low p-6 rounded-[2rem] border border-[var(--border-subtle)] space-y-2 group hover:border-primary/20 transition-all">
                    <p className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em]">
                      INITIAL_REGISTRATION
                    </p>
                    <div className="flex items-center gap-3">
                      <Calendar className="w-4 h-4 text-primary" />
                      <span className="text-sm font-black text-[var(--color-text-base)] italic">
                        {format(new Date(record.createdAt), 'MMM dd, yyyy')}
                      </span>
                    </div>
                  </div>
                  <div className="bg-surface-container-low p-6 rounded-[2rem] border border-[var(--border-subtle)] space-y-2 group hover:border-primary/20 transition-all">
                    <p className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em]">
                      ASSURANCE_PROTOCOL
                    </p>
                    <div className="flex items-center gap-3">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      <span className="text-sm font-black text-emerald-400 italic">
                        SECURE_LEVEL_8
                      </span>
                    </div>
                  </div>
                  <ExecutiveSelector
                    currentAssignee={record.assignedTo}
                    onAssign={(userId) =>
                      onUpdateRecord?.({ assignedTo: userId })
                    }
                    isUpdating={isUpdating}
                  />
                </div>

                {/* 2. Responsive Record Details Layout */}
                <div className="space-y-8">
                  <div className="flex items-center gap-4">
                    <h3 className="text-xs font-black text-[var(--color-text-base)] uppercase tracking-[0.3em]">
                      Protocol Dataset
                    </h3>
                    <div className="flex-1 h-px bg-[var(--surface-container-low)]/40" />
                  </div>

                  {/* DUAL-LAYOUT RECTIFICATION: Web Grid vs Mobile Form */}
                  <div className="space-y-12">
                    {(() => {
                      // Group fields by section name
                      const sections: Record<
                        string,
                        typeof projectType.columns
                      > = {};
                      projectType.columns?.forEach((col) => {
                        const sName =
                          col.settings?.sectionName || 'UNSPECIFIED_REGION';
                        if (!sections[sName]) sections[sName] = [];
                        sections[sName].push(col);
                      });

                      return Object.entries(sections).map(
                        ([sectionName, cols]) => (
                          <div
                            key={sectionName}
                            className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-700"
                          >
                            <div className="bg-[#009688]/10 border-l-4 border-[#009688] p-4 rounded-r-2xl flex items-center justify-between group">
                              <h4 className="text-[10px] font-black text-[#009688] uppercase tracking-[0.2em]">
                                {sectionName}
                              </h4>
                              <span className="text-[8px] font-mono text-[#009688]/40 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                                // SECTION_BLOCK_{sectionName.slice(0, 3)}
                              </span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                              {cols?.map((col) => {
                                const value = isEditing
                                  ? editedData[col.key]
                                  : (record.data as Record<string, unknown>)?.[
                                      col.key
                                    ];
                                const isFullWidth = col.settings?.isFullWidth;

                                return (
                                  <div
                                    key={col.key}
                                    className={`space-y-3 group/field relative ${isFullWidth ? 'md:col-span-2' : ''}`}
                                  >
                                    <div className="flex items-center justify-between">
                                      <label className="text-[9px] font-black text-[var(--text-muted)]/20 uppercase tracking-[0.2em] group-focus-within/field:text-primary transition-colors italic">
                                        {col.name}
                                      </label>
                                      <div className="opacity-0 group-hover/field:opacity-100 transition-opacity flex gap-2">
                                        {col.settings?.required && (
                                          <span className="text-[8px] text-rose-500 font-black">
                                            REQUIRED
                                          </span>
                                        )}
                                        <span className="text-[8px] font-mono text-[var(--color-text-base)]/10 uppercase tracking-widest">
                                          {col.columnType}
                                        </span>
                                      </div>
                                    </div>

                                    <div
                                      className={`bg-surface-lowest p-5 rounded-[1.5rem] border transition-all min-h-[64px] flex items-center ${isEditing ? 'border-amber-500/20 shadow-inner' : 'border-[var(--border-subtle)] group-hover/field:border-primary/20'}`}
                                    >
                                      {isEditing ? (
                                        <input
                                          className="w-full bg-transparent outline-none text-sm font-bold text-amber-500 placeholder-amber-500/20"
                                          value={String(value || '')}
                                          onChange={(e) =>
                                            setEditedData({
                                              ...editedData,
                                              [col.key]: e.target.value,
                                            })
                                          }
                                          placeholder={`Enter ${col.name}...`}
                                        />
                                      ) : (
                                        <span className="text-sm font-medium text-[var(--color-text-base)]/80 tracking-tight leading-relaxed">
                                          {value === undefined ||
                                          value === null ||
                                          value === '' ? (
                                            <span className="opacity-10 font-mono text-[10px] uppercase tracking-widest italic">
                                              VOID_NULL
                                            </span>
                                          ) : (
                                            String(value)
                                          )}
                                        </span>
                                      )}
                                    </div>
                                    <div
                                      className={`absolute -left-4 top-4 bottom-4 w-0.5 transition-all duration-500 ${isEditing ? 'bg-amber-500' : 'bg-primary/0 group-hover/field:bg-primary'}`}
                                    />
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )
                      );
                    })()}
                  </div>
                </div>

                {/* 3. Media & Evidence (Placeholder) */}
                <div className="bg-white/[0.01] border border-[var(--border-subtle)] rounded-[2.5rem] p-10 flex flex-col items-center justify-center space-y-6 group hover:border-[var(--color-border-base)]/40 transition-all">
                  <div className="p-5 bg-[var(--surface-container-low)]/40 rounded-full border border-[var(--border-subtle)] group-hover:scale-110 transition-transform duration-500">
                    <Expand className="w-8 h-8 text-[var(--text-muted)]/20" />
                  </div>
                  <div className="text-center space-y-1">
                    <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em]">
                      MEDIA_EVIDENCE_REPOSITORY
                    </p>
                    <p className="text-[9px] text-[var(--color-text-base)]/10 uppercase font-bold tracking-widest leading-relaxed">
                      No multimedia captures attached to this protocol
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              /* Audit Timeline View */
              <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                <AuditTimeline events={auditEvents} />
              </div>
            )}
          </div>

          {/* Fixed Status Bar */}
          <div className="sticky bottom-0 z-30">
            {isEditing ? (
              <div className="p-8 bg-surface-lowest/90 backdrop-blur-2xl border-t border-amber-500/20 flex gap-4 animate-in slide-in-from-bottom duration-500">
                <button
                  onClick={async () => {
                    await onUpdateRecord?.({ data: editedData });
                    setIsEditing(false);
                  }}
                  disabled={isUpdating}
                  className="flex-1 bg-amber-500 hover:bg-amber-600 text-[#0c1324] font-black py-4 rounded-[1.5rem] flex items-center justify-center gap-3 transition-all shadow-xl shadow-amber-500/20"
                >
                  {isUpdating ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Save className="w-5 h-5" />
                  )}
                  COMMIT_CHANGES
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-8 bg-surface-container-low text-[var(--text-muted)] font-black py-4 rounded-[1.5rem] border border-[var(--border-subtle)]"
                >
                  DISCARD
                </button>
              </div>
            ) : (
              <StatusActionBar
                projectType={projectType}
                currentStatus={record.status}
                onUpdateStatus={onStatusUpdate}
                isUpdating={isUpdating}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
