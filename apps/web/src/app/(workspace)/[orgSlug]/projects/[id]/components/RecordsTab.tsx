'use client';

import { useRecords } from '@/hooks/useRecords';
import { useProjectTypes } from '@/hooks/useProjectTypes';
import {
  Database,
  Plus,
  Grid,
  List as ListIcon,
  Trello,
  Map as MapIcon,
  Upload,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { RecordTable } from '@/components/records/RecordTable';
import { RecordKanbanView } from '@/components/records/RecordKanbanView';
import { RecordCardView } from '@/components/records/RecordCardView';
import { RecordMapView } from '@/components/records/RecordMapView';
import { ProjectRecord, ProjectType } from '@validiant/shared';

import { DashboardStatsRow } from './DashboardStatsRow';
import { RecordsFilterBar } from './RecordsFilterBar';
import { BulkActionBar } from './BulkActionBar';
import { AuditActivityFeed } from './AuditActivityFeed';
import { BulkUploadModal } from './upload/BulkUploadModal';
import { VerificationSlideOver } from './verification/VerificationSlideOver';

/**
 * RecordsTab - The primary data hub for the project universe.
 * High-density data table with Obsidian Verifier aesthetics.
 */
export function RecordsTab({ projectId }: { projectId: string }) {
  const [selectedTypeId, setSelectedTypeId] = useState<string | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<ProjectRecord | null>(
    null
  );
  const [isSlideOverOpen, setIsSlideOverOpen] = useState(false);
  const [activeView, setActiveView] = useState<
    'list' | 'kanban' | 'map' | 'cards'
  >('list');

  // Bulk Selection State
  const [selectedRecordIds, setSelectedRecordIds] = useState<string[]>([]);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  const { records = [], isLoading, updateRecord } = useRecords(projectId);
  const { data: types } = useProjectTypes(projectId);

  // 100% Data-Driven Operational Metrics
  const totalCount = records.length;
  const verifiedCount = records.filter((r) => r.status === 'completed').length;
  const pendingCount = records.filter((r) => r.status === 'pending').length;
  const healthScore =
    totalCount > 0 ? Math.round((verifiedCount / totalCount) * 100) : 100;
  const slaCompliant =
    totalCount > 0
      ? Math.round(
          ((totalCount -
            records.filter(
              (r) =>
                r.status === 'pending' &&
                new Date().getTime() - new Date(r.updatedAt).getTime() >
                  24 * 60 * 60 * 1000
            ).length) /
            totalCount) *
            100
        )
      : 100;

  // Auto-select first type if none selected
  useEffect(() => {
    if (!selectedTypeId && types && types.length > 0) {
      const defaultId = types[0]?.id;
      if (defaultId) {
        setSelectedTypeId(defaultId);
      }
    }
  }, [selectedTypeId, types]);

  const selectedType = types?.find((t) => t.id === selectedTypeId);

  const handleAddRecord = () => {
    setSelectedRecord(null);
    setIsSlideOverOpen(true);
  };

  const handleRecordClick = (recordId: string) => {
    const record = records?.find((r) => r.id === recordId);
    if (record) {
      setSelectedRecord(record as ProjectRecord);
      setIsSlideOverOpen(true);
    }
  };

  const handleStatusChange = (recordId: string, newStatus: string) => {
    updateRecord.mutate({ id: recordId, data: { status: newStatus } });
  };

  const handleBulkAction = (action: string) => {
    // Implementation for bulk actions will come in later phases
    return action;
  };

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-8 p-8">
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-[var(--color-surface-muted)]/50 rounded-2xl" />
          ))}
        </div>
        <div className="h-10 bg-[var(--color-surface-muted)]/50 rounded-xl w-1/4" />
        <div className="h-96 bg-[var(--color-surface-muted)]/50 rounded-[2.5rem]" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-32">
      {/* 1. Dashboard Stats Row */}
      <DashboardStatsRow records={records || []} />

      {/* 2. Type Selector Tabs & View Switcher */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 overflow-x-auto scroller-hidden">
          {types?.map((type) => (
            <button
              key={type.id}
              onClick={() => setSelectedTypeId(type.id)}
              className={`flex items-center gap-2.5 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.15em] transition-all relative whitespace-nowrap ${
                selectedTypeId === type.id
                  ? 'bg-[var(--surface-lowest)] text-primary shadow-2xl border border-white/[0.03]'
                  : 'text-[var(--color-text-base)]/20 hover:text-[var(--color-text-base)]/40 hover:bg-[var(--surface-lowest)]/30'
              }`}
            >
              <div
                className="w-1.5 h-1.5 rounded-full shadow-[0_0_8px_currentColor]"
                style={{ color: type.color || '#4d8eff' }}
              />
              {type.name}
            </button>
          ))}
          <button className="flex items-center gap-2 px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest text-[var(--color-text-base)]/10 hover:text-primary transition-all border border-dashed border-[var(--color-border-base)]/20 hover:border-primary/20">
            <Plus className="w-3 h-3" />
            New Archetype
          </button>
        </div>

        <div className="flex items-center gap-4 bg-[var(--surface-lowest)]/50 p-1.5 rounded-2xl border border-white/[0.02] shadow-2xl backdrop-blur-md">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setActiveView('list')}
              className={`p-2 rounded-xl transition-all ${
                activeView === 'list'
                  ? 'bg-primary text-[#0c1324] shadow-lg shadow-[#adc6ff]/20'
                  : 'text-[var(--color-text-base)]/20 hover:text-[var(--color-text-base)]/60'
              }`}
              title="List View"
            >
              <ListIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => setActiveView('kanban')}
              className={`p-2 rounded-xl transition-all ${
                activeView === 'kanban'
                  ? 'bg-primary text-[#0c1324] shadow-lg shadow-[#adc6ff]/20'
                  : 'text-[var(--color-text-base)]/20 hover:text-[var(--color-text-base)]/60'
              }`}
              title="Kanban Board"
            >
              <Trello className="w-4 h-4" />
            </button>
            <button
              onClick={() => setActiveView('map')}
              className={`p-2 rounded-xl transition-all ${
                activeView === 'map'
                  ? 'bg-primary text-[#0c1324] shadow-lg shadow-[#adc6ff]/20'
                  : 'text-[var(--color-text-base)]/20 hover:text-[var(--color-text-base)]/60'
              }`}
              title="Map View"
            >
              <MapIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => setActiveView('cards')}
              className={`p-2 rounded-xl transition-all ${
                activeView === 'cards'
                  ? 'bg-primary text-[#0c1324] shadow-lg shadow-[#adc6ff]/20'
                  : 'text-[var(--color-text-base)]/20 hover:text-[var(--color-text-base)]/60'
              }`}
              title="Card Grid"
            >
              <Grid className="w-4 h-4" />
            </button>
          </div>
          <div className="w-px h-4 bg-[var(--color-surface-muted)]/50 mx-1" />
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[var(--color-surface-muted)]/50 text-[var(--color-text-base)]/60 border border-[var(--color-border-base)]/20 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[var(--color-surface-muted)] transition-all group"
          >
            <Upload className="w-3.5 h-3.5" />
            Bulk Upload
          </button>
          <button
            onClick={handleAddRecord}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-[#0c1324] rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary/80 transition-all shadow-lg shadow-[#adc6ff]/10 group"
          >
            <Plus className="w-3.5 h-3.5" />
            Inject Record
          </button>
        </div>
      </div>

      {/* 3. Global Record Filter Bar */}
      <div className="bg-[var(--surface-container-low)] p-6 rounded-[2rem] border border-[var(--color-border-base)]/20 shadow-xl">
        <RecordsFilterBar />
      </div>

      {/* 4. Main Viewport (Table/Kanban/Map/Cards) */}
      {!records || records.length === 0 || !selectedType ? (
        <div className="flex flex-col items-center justify-center py-40 gap-8 bg-[var(--surface-lowest)] rounded-[3rem] border border-white/[0.01] shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-primary/5 blur-[120px] opacity-20" />
          <div className="relative w-28 h-28 rounded-[2.5rem] bg-[var(--surface-container-low)] flex items-center justify-center border border-white/[0.05] shadow-inner">
            <Database className="w-12 h-12 text-[var(--color-text-base)]/10" />
          </div>
          <div className="text-center space-y-3 relative z-10">
            <h3 className="text-2xl font-bold text-[var(--color-text-base)]/80 tracking-tight">
              Void Universe detected
            </h3>
            <p className="text-sm text-[var(--color-text-base)]/30 font-medium max-w-xs mx-auto italic font-mono">
              // No elements found in this coordinate. Select or create an
              archetype to begin injection.
            </p>
          </div>
        </div>
      ) : (
        <div className="animate-in fade-in duration-1000">
          {activeView === 'list' && (
            <RecordTable
              projectType={selectedType as unknown as ProjectType}
              records={(records as ProjectRecord[]).filter(
                (r) => r.typeId === selectedTypeId
              )}
              onEdit={handleRecordClick}
              selectedRecordIds={selectedRecordIds}
              onSelectionChange={setSelectedRecordIds}
            />
          )}

          {activeView === 'kanban' && (
            <RecordKanbanView
              projectType={selectedType as unknown as ProjectType}
              records={(records as ProjectRecord[]).filter(
                (r) => r.typeId === selectedTypeId
              )}
              onEdit={handleRecordClick}
              onStatusChange={handleStatusChange}
            />
          )}

          {activeView === 'map' && (
            <RecordMapView
              projectType={selectedType as unknown as ProjectType}
              records={(records as ProjectRecord[]).filter(
                (r) => r.typeId === selectedTypeId
              )}
              onEdit={handleRecordClick}
            />
          )}

          {activeView === 'cards' && (
            <RecordCardView
              projectType={selectedType as unknown as ProjectType}
              records={(records as ProjectRecord[]).filter(
                (r) => r.typeId === selectedTypeId
              )}
              onEdit={handleRecordClick}
            />
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-8 border-t border-[var(--color-border-base)]/20">
        <AuditActivityFeed projectId={projectId} records={records} />

        <div className="bg-[var(--surface-container-low)] rounded-[2.5rem] border border-[var(--color-border-base)]/20 p-8 flex flex-col items-center justify-center text-center">
          <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mb-6 border border-emerald-500/20">
            <CheckCircle2 className="w-10 h-10 text-emerald-400" />
          </div>
          <h3 className="text-2xl font-black text-[#dce1fb] tracking-tight mb-2">
            Operational Health: {healthScore}%
          </h3>
          <p className="text-sm text-[var(--text-muted)] max-w-sm">
            Project is performing within healthy limits based on current volume
            of <span className="text-[var(--color-text-base)]">{totalCount}</span> records. SLA
            compliance is currently at{' '}
            <span className="text-emerald-400 font-bold">{slaCompliant}%</span>.
          </p>

          <div className="grid grid-cols-2 gap-4 w-full mt-8">
            <div className="bg-[var(--surface-lowest)] p-4 rounded-2xl border border-[var(--color-border-base)]/20 text-left">
              <p className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-1">
                Pending Tasks
              </p>
              <p className="text-lg font-bold text-[#dce1fb]">{pendingCount}</p>
            </div>
            <div className="bg-[var(--surface-lowest)] p-4 rounded-2xl border border-[var(--color-border-base)]/20 text-left">
              <p className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-1">
                SLA Compliant
              </p>
              <p className="text-lg font-bold text-[#dce1fb]">
                {slaCompliant}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Bulk Action Bar - Sticky/Floating */}
      <BulkActionBar
        selectedCount={selectedRecordIds.length}
        onClear={() => setSelectedRecordIds([])}
        onAction={handleBulkAction}
      />

      {/* Record Verification Flow */}
      {selectedType && selectedRecord && (
        <VerificationSlideOver
          isOpen={isSlideOverOpen}
          onClose={() => setIsSlideOverOpen(false)}
          record={selectedRecord}
          projectType={selectedType as unknown as ProjectType}
          onStatusUpdate={async (label) => {
            await updateRecord.mutateAsync({
              id: selectedRecord.id,
              data: { status: label },
            });
            setIsSlideOverOpen(false);
          }}
          isUpdating={updateRecord.isPending}
        />
      )}
      {/* Bulk Upload Wizard */}
      {isUploadModalOpen && selectedType && (
        <BulkUploadModal
          projectId={projectId}
          projectType={selectedType as unknown as ProjectType}
          onClose={() => setIsUploadModalOpen(false)}
        />
      )}
    </div>
  );
}

function CheckCircle2({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="12" cy="12" r="10" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}
