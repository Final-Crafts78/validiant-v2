'use client';

import { useRecords } from '@/hooks/useRecords';
import { useProjectTypes } from '@/hooks/useProjectTypes';
import {
  Database,
  Plus,
  Search,
  Filter,
  Grid,
  List as ListIcon,
  Trello,
  Map as MapIcon,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { RecordTable } from '@/components/records/RecordTable';
import { RecordSlideOver } from '@/components/records/RecordSlideOver';
import { RecordKanbanView } from '@/components/records/RecordKanbanView';
import { RecordCardView } from '@/components/records/RecordCardView';
import { RecordMapView } from '@/components/records/RecordMapView';
import { ProjectRecord, ProjectType } from '@validiant/shared';

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
  const [searchQuery, setSearchQuery] = useState('');
  const [activeView, setActiveView] = useState<'list' | 'kanban' | 'map' | 'cards'>(
    'list'
  );

  const { records, isLoading, updateRecord } = useRecords(projectId);
  const { data: types } = useProjectTypes(projectId);

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

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-10 bg-surface-container-low rounded-xl w-1/4" />
        <div className="h-64 bg-surface-container-low rounded-[2.5rem]" />
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Type Selector Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto scroller-hidden pb-2">
        {types?.map((type) => (
          <button
            key={type.id}
            onClick={() => setSelectedTypeId(type.id)}
            className={`flex items-center gap-2.5 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.15em] transition-all relative whitespace-nowrap ${
              selectedTypeId === type.id
                ? 'bg-surface-lowest text-primary shadow-obsidian border border-white/[0.03]'
                : 'text-white/20 hover:text-white/40 hover:bg-surface-lowest/30'
            }`}
          >
            <div
              className="w-1.5 h-1.5 rounded-full shadow-[0_0_8px_currentColor]"
              style={{ color: type.color || '#4F46E5' }}
            />
            {type.name}
          </button>
        ))}
        <button className="flex items-center gap-2 px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white/10 hover:text-primary transition-all border border-dashed border-white/5 hover:border-primary/20">
          <Plus className="w-3 h-3" />
          Define New Archetype
        </button>
      </div>

      {/* Dynamic Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="relative group/search">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within/search:text-primary transition-colors" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Query Universe..."
              className="pl-11 pr-6 py-3.5 bg-surface-lowest border border-white/[0.03] rounded-2xl text-[11px] font-mono uppercase tracking-widest focus:outline-none focus:ring-1 focus:ring-primary/40 w-96 transition-all shadow-obsidian placeholder:text-white/10"
            />
          </div>
          <button className="flex items-center gap-3 px-6 py-3.5 bg-surface-lowest border border-white/[0.03] rounded-2xl text-[10px] font-bold uppercase tracking-widest text-white/40 hover:text-white hover:bg-surface-container-low transition-all shadow-obsidian group">
            <Filter className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100 transition-opacity" />
            Advanced Filter
          </button>
        </div>

        <div className="flex items-center gap-4 bg-surface-lowest/50 p-2 rounded-2xl border border-white/[0.02] shadow-obsidian backdrop-blur-md">
          <div className="flex items-center p-1 bg-surface-container-low/30 rounded-xl gap-1">
            <button
              onClick={() => setActiveView('list')}
              className={`p-2.5 rounded-lg transition-all ${
                activeView === 'list'
                  ? 'bg-primary text-white shadow-lg shadow-primary/20'
                  : 'text-white/20 hover:text-white/60'
              }`}
              title="List Universe"
            >
              <ListIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => setActiveView('kanban')}
              className={`p-2.5 rounded-lg transition-all ${
                activeView === 'kanban'
                  ? 'bg-primary text-white shadow-lg shadow-primary/20'
                  : 'text-white/20 hover:text-white/60'
              }`}
              title="Orchestration Board"
            >
              <Trello className="w-4 h-4" />
            </button>
            <button
              onClick={() => setActiveView('map')}
              className={`p-2.5 rounded-lg transition-all ${
                activeView === 'map'
                  ? 'bg-primary text-white shadow-lg shadow-primary/20'
                  : 'text-white/20 hover:text-white/60'
              }`}
              title="Geospatial Hub"
            >
              <MapIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => setActiveView('cards')}
              className={`p-2.5 rounded-lg transition-all ${
                activeView === 'cards'
                  ? 'bg-primary text-white shadow-lg shadow-primary/20'
                  : 'text-white/20 hover:text-white/60'
              }`}
              title="Visual Grid"
            >
              <Grid className="w-4 h-4" />
            </button>
          </div>
          <div className="w-px h-5 bg-white/5 mx-1" />
          <button
            onClick={handleAddRecord}
            className="flex items-center gap-3 px-6 py-2.5 bg-primary text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-primary-dark transition-all shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 group"
          >
            <Plus className="w-4 h-4 transition-transform group-hover:rotate-90" />
            Inject Record
          </button>
        </div>
      </div>

      {/* Main Viewport */}
      {!records || records.length === 0 || !selectedType ? (
        <div className="flex flex-col items-center justify-center py-40 gap-8 bg-surface-lowest rounded-[3rem] border border-white/[0.01] shadow-obsidian-lg relative overflow-hidden">
          <div className="absolute inset-0 bg-primary/5 blur-[120px] opacity-20" />
          <div className="relative w-28 h-28 rounded-[2.5rem] bg-surface-container-low flex items-center justify-center border border-white/[0.05] shadow-inner">
            <Database className="w-12 h-12 text-white/10" />
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent" />
          </div>
          <div className="text-center space-y-3 relative z-10">
            <h3 className="text-2xl font-bold text-white/80 tracking-tight font-display">
              Void Universe detected
            </h3>
            <p className="text-sm text-white/30 font-medium max-w-xs mx-auto italic font-mono">
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

      {/* Detail Slide-Over */}
      {selectedType && (
        <RecordSlideOver
          isOpen={isSlideOverOpen}
          onClose={() => setIsSlideOverOpen(false)}
          projectId={projectId}
          projectType={selectedType as unknown as ProjectType}
          recordId={selectedRecord?.id}
        />
      )}
    </div>
  );
}
