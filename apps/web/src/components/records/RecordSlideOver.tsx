'use client';

import React, { useState, useEffect } from 'react';
import { X, Save, ShieldCheck, Database, Loader2, Lock } from 'lucide-react';
import { ProjectType, TypeColumn } from '@validiant/shared';
import { RecordFieldFactory } from './RecordFieldFactory';
import { useRecords } from '@/hooks/useRecords';
import { useAuthStore } from '@/store/auth';

interface RecordSlideOverProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  projectType: ProjectType;
  recordId?: string; // If editing
}

/**
 * RecordSlideOver - Phase 8 Precision Architect
 * Sliding panel for creating/editing high-fidelity records with real-time locking.
 */
export const RecordSlideOver: React.FC<RecordSlideOverProps> = ({
  isOpen,
  onClose,
  projectId,
  projectType,
  recordId,
}) => {
  const { createRecord, updateRecord, records, lockRecord, unlockRecord } = useRecords(projectId);
  const user = useAuthStore((state) => state.user);
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [isSaving, setIsSaving] = useState(false);

  const currentRecord = recordId ? records?.find((r) => r.id === recordId) : null;
  const isLockedByOthers = currentRecord?.lockedBy && currentRecord.lockedBy !== user?.userId;
  const isLockedByMe = currentRecord?.lockedBy === user?.userId;

  // Initialize form data if editing
  useEffect(() => {
    if (recordId && records) {
      const record = records.find((r) => r.id === recordId);
      if (record) {
        setFormData(record.data as Record<string, unknown>);
        
        // Auto-lock on open if not locked by others
        if (!record.lockedBy && isOpen) {
          lockRecord.mutate(recordId);
        }
      }
    } else {
      setFormData({});
    }

    // Unlock on close if locked by me
    return () => {
      if (recordId && isLockedByMe) {
        unlockRecord.mutate(recordId);
      }
    };
  }, [recordId, records, isOpen, isLockedByMe]);

  if (!isOpen) {
    return null;
  }

  const handleFieldChange = (key: string, value: unknown) => {
    if (isLockedByOthers) return;
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    if (isLockedByOthers) return;
    setIsSaving(true);
    try {
      if (recordId) {
        await updateRecord.mutateAsync({
          id: recordId,
          data: { data: formData },
        });
      } else {
        await createRecord.mutateAsync({
          typeId: projectType.id,
          data: formData,
        });
      }
      onClose();
    } catch (err) {
      console.error('Save failed', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-md transition-opacity duration-500"
        onClick={onClose}
      />

      <div className="absolute inset-y-0 right-0 max-w-full flex">
        <div className="w-screen max-w-xl flex flex-col bg-surface-base shadow-obsidian border-l border-white/5 animate-in slide-in-from-right duration-500 ease-premium">
          {/* Header */}
          <div className="p-8 pb-6 flex items-center justify-between border-b border-white/[0.02]">
            <div className="editorial-header">
              <label>Universal_Entry</label>
              <h1 className="text-3xl">
                {recordId ? 'Update Identity' : 'New Record'}
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <div className="p-1 rounded bg-primary/10">
                  <Database className="w-3 h-3 text-primary" />
                </div>
                <span className="text-[10px] text-white/30 font-mono uppercase tracking-[0.1em]">
                  {projectType.name} • Precision_v8.0
                </span>
                {isLockedByOthers && (
                  <div className="flex items-center gap-2 ml-4 px-2 py-1 bg-amber-500/10 border border-amber-500/20 rounded text-[9px] text-amber-500 font-bold uppercase tracking-widest">
                    <Lock className="w-3 h-3" />
                    Read Only - Session Occupied
                  </div>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-3 hover:bg-white/5 rounded-full transition-all text-white/20 hover:text-white hover:rotate-90"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Form Content */}
          <div className="flex-1 overflow-y-auto px-10 py-8 space-y-10 custom-scrollbar">
            {projectType.columns
              ?.sort((a, b) => (a.order || 0) - (b.order || 0))
              .map((column) => (
                <div key={column.key} className="space-y-3 group/field">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold text-primary/60 uppercase tracking-[0.2em] group-focus-within/field:text-primary transition-colors">
                      {column.name}
                      {column.settings?.required && (
                        <span className="text-primary ml-1">*</span>
                      )}
                    </label>
                    {column.settings?.hint && (
                      <span className="text-[9px] text-white/20 italic font-mono">
                        // {column.settings.hint}
                      </span>
                    )}
                  </div>

                  <div className="relative">
                    <RecordFieldFactory
                      column={column}
                      value={formData[column.key]}
                      onChange={(val) => handleFieldChange(column.key, val)}
                      disabled={isLockedByOthers}
                    />
                    <div className="absolute -left-4 top-0 bottom-0 w-0.5 bg-primary/0 group-focus-within/field:bg-primary transition-all duration-500" />
                  </div>
                </div>
              ))}
          </div>

          {/* Footer - The Glass Command */}
          <div className="p-8 bg-surface-container-low/50 backdrop-blur-xl border-t border-white/[0.02] flex flex-col gap-6">
            <div className={`flex items-center gap-3 px-4 py-3 rounded-lg border transition-all ${
              isLockedByOthers 
                ? 'bg-amber-500/5 border-amber-500/10' 
                : 'bg-white/[0.02] border-white/5'
            }`}>
              {isLockedByOthers ? (
                <Lock className="w-4 h-4 text-amber-500" />
              ) : (
                <ShieldCheck className="w-4 h-4 text-primary" />
              )}
              <div className="flex flex-col">
                <span className={`text-[10px] font-bold uppercase tracking-wider ${
                  isLockedByOthers ? 'text-amber-500/60' : 'text-white/60'
                }`}>
                  {isLockedByOthers ? 'Lock_Enforced' : 'Audit_Locked_Session'}
                </span>
                <span className="text-[9px] text-white/30 font-mono italic">
                  {isLockedByOthers 
                    ? 'Another operator is currently modifying this coordinate.' 
                    : 'Immutability enforced by Protocol_Xact'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button onClick={onClose} className="btn btn-ghost px-8">
                {isLockedByOthers ? 'Exit' : 'Abort'}
              </button>
              {!isLockedByOthers && (
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="btn btn-primary flex-1 py-4 text-base shadow-lg disabled:opacity-50"
                >
                  {isSaving ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Save className="w-5 h-5" />
                  )}
                  <span className="font-display tracking-tight uppercase">
                    {recordId ? 'Commit Changes' : 'Initialize Record'}
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
