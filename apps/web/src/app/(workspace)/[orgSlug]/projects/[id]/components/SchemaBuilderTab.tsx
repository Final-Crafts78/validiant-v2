'use client';

import React, { useState } from 'react';
import { useProjectTypes } from '@/hooks/useProjectTypes';
import { useTypeColumns } from '@/hooks/useTypeColumns';
import { ProjectType, TypeColumn, ColumnType } from '@validiant/shared';
import {
  Database,
  Plus,
  ChevronRight,
  LayoutGrid,
  Settings,
  Trash2,
  Shield,
  X,
  Loader2,
  Workflow,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { MobileSchemaPreview } from './schema/MobileSchemaPreview';
import { FieldConfigurator } from './schema/FieldConfigurator';

/**
 * SchemaBuilderTab - The engine for defining project data types and columns.
 * Obsidian Verifier aesthetic with 3-section split-pane layout.
 */
export function SchemaBuilderTab({ projectId }: { projectId: string }) {
  const {
    data: types,
    isLoading,
    createType,
    deleteType,
    updateType,
  } = useProjectTypes(projectId);

  const [selectedTypeId, setSelectedTypeId] = useState<string | null>(null);
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [showElementModal, setShowElementModal] = useState(false);
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'elements' | 'workflow'>(
    'elements'
  );

  // Local form state for new archetype
  const [newTypeData, setNewTypeData] = useState({
    name: '',
    description: '',
    color: '#adc6ff', // Default archetype accent
  });

  // Local form state for new element
  const [newElementData, setNewElementData] = useState({
    name: '',
    key: '',
    columnType: ColumnType.TEXT,
  });

  const projectTypes = (types as ProjectType[]) || [];
  const effectiveSelectedId = selectedTypeId || projectTypes[0]?.id;
  const selectedType = projectTypes.find((t) => t.id === effectiveSelectedId);

  const { columns, createColumn, updateColumn, deleteColumn } = useTypeColumns(
    projectId,
    selectedType?.id
  );

  const editingColumn = columns?.find((c) => c.id === editingFieldId);

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-10 bg-surface-container-low rounded-xl w-1/4" />
        <div className="flex gap-8 h-96">
          <div className="w-20 bg-surface-container-low rounded-xl" />
          <div className="flex-1 bg-surface-container-low rounded-[2.5rem]" />
          <div className="w-80 bg-surface-container-low rounded-[2.5rem]" />
        </div>
      </div>
    );
  }

  const handleCreateType = async () => {
    console.info(`[SchemaArchitect] Initializing new archetype: ${newTypeData.name}`, { newTypeData });
    try {
      await createType.mutateAsync(newTypeData);
      console.info(`[SchemaArchitect] Archetype injected successfully: ${newTypeData.name}`);
      setShowTypeModal(false);
      setNewTypeData({ name: '', description: '', color: '#adc6ff' });
    } catch (err) {
      console.error(`[SchemaArchitect] Archetype creation blocked:`, err);
    }
  };

  const handleCreateElement = async () => {
    if (!selectedType) return;
    await createColumn.mutateAsync(newElementData);
    setShowElementModal(false);
    setNewElementData({ name: '', key: '', columnType: ColumnType.TEXT });
  };

  return (
    <div className="flex gap-8 items-start h-[calc(100vh-14rem)] relative">
      {/* 1. Sidebar - Archetype Navigation (Slim) */}
      <aside className="w-20 flex flex-col gap-4 border-r border-[var(--border-subtle)] pr-4 h-full">
        <button
          onClick={() => setShowTypeModal(true)}
          className="w-12 h-12 mx-auto bg-primary/10 text-primary rounded-2xl hover:bg-primary/20 transition-all border border-primary/20 flex items-center justify-center group"
          title="New Archetype"
        >
          <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
        </button>

        <div className="my-4 h-px bg-[var(--border-subtle)] w-8 mx-auto" />

        <div className="flex flex-col gap-3 overflow-y-auto scroller-hidden pr-1">
          {projectTypes.map((type) => {
            const isActive = effectiveSelectedId === type.id;
            return (
              <button
                key={type.id}
                onClick={() => setSelectedTypeId(type.id)}
                className={`w-12 h-12 mx-auto rounded-2xl flex items-center justify-center transition-all duration-300 relative group ${
                  isActive
                    ? 'bg-[var(--surface-container-low)] shadow-[0_0_20px_var(--primary-glow)]'
                    : 'bg-[var(--surface-container-low)] hover:bg-[var(--color-surface-muted)]/50 grayscale'
                }`}
              >
                <Database
                  className={`w-5 h-5 ${isActive ? 'text-[var(--surface-lowest)]' : 'text-[var(--text-muted)]'}`}
                />

                {/* Tooltip */}
                <div className="absolute left-full ml-4 px-3 py-2 bg-surface-bright rounded-xl text-[10px] font-black text-[var(--color-text-base)] whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-all translate-x-[-10px] group-hover:translate-x-0 z-50 border border-[var(--border-subtle)] shadow-2xl">
                  {type.name.toUpperCase()}
                  <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 bg-surface-bright rotate-45 border-l border-b border-[var(--border-subtle)]" />
                </div>
              </button>
            );
          })}
        </div>
      </aside>

      {/* 2. Main Content - The Architect Canvas */}
      <main className="flex-1 min-w-0 bg-[var(--surface-lowest)]/50 rounded-[2.5rem] border border-[var(--border-subtle)] flex flex-col overflow-hidden shadow-obsidian">
        {selectedType ? (
          <>
            <header className="p-8 border-b border-[var(--border-subtle)] bg-surface-container-low/20 backdrop-blur-xl flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">
                    ARCHETYPE_CORE
                  </span>
                  <div className="h-px w-8 bg-primary/20" />
                </div>
                <h2 className="text-2xl font-black text-[var(--text-base)] tracking-tight uppercase font-display">
                  {selectedType.name}
                </h2>
                <p className="text-xs text-[var(--text-muted)] max-w-md line-clamp-1 italic">
                  {selectedType.description ||
                    'No protocol description defined.'}
                </p>
              </div>

              {/* Sub-Tabs */}
              <div className="flex bg-[var(--surface-lowest)] rounded-xl p-1 border border-[var(--border-subtle)] mx-8">
                <button
                  onClick={() => setActiveTab('elements')}
                  className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
                    activeTab === 'elements'
                      ? 'bg-primary text-[var(--surface-lowest)]'
                      : 'text-[var(--color-text-base)]/40 hover:text-[var(--color-text-base)]'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  Elements
                </button>
                <button
                  onClick={() => setActiveTab('workflow')}
                  className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
                    activeTab === 'workflow'
                      ? 'bg-primary text-[var(--surface-lowest)]'
                      : 'text-[var(--color-text-base)]/40 hover:text-[var(--color-text-base)]'
                  }`}
                >
                  <Workflow className="w-3.5 h-3.5" />
                  Workflow
                </button>
              </div>

              <div className="flex items-center gap-3">
                <button className="p-3 bg-[var(--color-surface-muted)]/50 text-[var(--text-muted)] hover:text-primary rounded-2xl transition-all border border-[var(--border-subtle)]">
                  <Settings className="w-5 h-5" />
                </button>
                <button
                  onClick={() => deleteType.mutate(selectedType.id)}
                  className="p-3 bg-[var(--color-surface-muted)]/50 text-[var(--text-muted)] hover:text-rose-400 rounded-2xl transition-all border border-[var(--border-subtle)]"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </header>

            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-8">
              {activeTab === 'elements' ? (
                <>
                  <div className="flex items-center justify-between sticky top-0 bg-[var(--surface-lowest)] z-20 pb-4 -mx-4 px-4 border-b border-white/[0.02]">
                    <div className="flex flex-col">
                      <h3 className="text-xs font-black text-[var(--text-muted)]/60 tracking-widest uppercase">
                        Field_Elements
                      </h3>
                      <p className="text-[9px] text-[var(--text-muted)]/20 font-mono uppercase tracking-[0.2em]">
                        {columns?.length || 0} Injected Modules
                      </p>
                    </div>
                    <button
                      onClick={() => setShowElementModal(true)}
                      className="px-6 py-2.5 bg-primary text-[var(--surface-lowest)] rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg shadow-primary/20"
                    >
                      INJECT ELEMENT
                    </button>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    {(columns || [])?.map((column: TypeColumn) => (
                      <div
                        key={column.id}
                        onClick={() => setEditingFieldId(column.id)}
                        className={`group relative flex items-center justify-between p-6 rounded-2xl transition-all duration-500 cursor-pointer overflow-hidden border ${
                          editingFieldId === column.id
                            ? 'bg-primary/5 border-primary/20 shadow-[0_0_30px_var(--primary-glow)]'
                            : 'bg-surface-container-low/40 border-[var(--border-subtle)] hover:bg-surface-container-low/60 hover:border-[var(--color-border-base)]/40'
                        }`}
                      >
                        <div className="flex items-center gap-6">
                          <div
                            className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-500 ${
                              editingFieldId === column.id
                                ? 'bg-primary text-[var(--surface-lowest)]'
                                : 'bg-[var(--surface-lowest)] text-[var(--color-text-base)]/10'
                            }`}
                          >
                            <LayoutGrid className="w-5 h-5" />
                          </div>
                          <div className="space-y-1">
                            <h4 className="text-sm font-black text-[var(--text-base)] tracking-tight uppercase">
                              {column.name}
                            </h4>
                            <div className="flex items-center gap-3">
                              <span className="text-[9px] font-mono text-[var(--text-muted)]/20 uppercase tracking-widest">
                                {column.key}
                              </span>
                              <div className="w-1 h-1 rounded-full bg-[var(--color-surface-muted)]" />
                              <span className="badge badge-primary scale-[0.7] origin-left uppercase font-black">
                                {column.columnType}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-all">
                          <button className="p-2.5 bg-[var(--color-surface-muted)]/50 text-[var(--text-muted)] hover:text-primary rounded-xl transition-all">
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}

                    {columns?.length === 0 && (
                      <div className="h-64 flex flex-col items-center justify-center rounded-[2.5rem] bg-white/[0.01] border border-dashed border-[var(--border-subtle)] gap-4">
                        <Database className="w-10 h-10 text-[var(--color-text-base)]/5" />
                        <p className="text-[10px] text-[var(--text-muted)]/20 font-black uppercase tracking-[0.3em]">
                          Module_Array_Empty
                        </p>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="space-y-10 animate-in fade-in slide-in-from-bottom-5 duration-500">
                  <div className="editorial-header">
                    <label>Workflow_Architect</label>
                    <h3 className="text-xl text-[var(--text-base)]">
                      Outcome Customization
                    </h3>
                    <p className="text-xs text-[var(--text-muted)] mt-2">
                      Map internal system states to high-precision user
                      outcomes.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-6 max-w-2xl">
                    <div className="bg-[var(--surface-container-low)] rounded-[2.5rem] p-8 border border-[var(--border-subtle)] space-y-6">
                      <div className="flex items-center gap-4 text-primary">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Shield className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest">
                            Internal Status:{' '}
                            <span className="text-[var(--text-base)]">
                              COMPLETED
                            </span>
                          </p>
                          <p className="text-[8px] font-mono text-[var(--text-muted)]/20 uppercase">
                            Global Success State
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-6">
                        <ArrowRight className="w-4 h-4 text-[var(--color-text-base)]/10" />
                        <div className="flex-1 space-y-2">
                          <label className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-1">
                            Custom Display Label
                          </label>
                          <input
                            className="w-full bg-[var(--surface-lowest)] border border-[var(--border-subtle)] rounded-2xl p-4 text-[var(--text-base)] font-black text-sm outline-none focus:border-primary/50 transition-all"
                            placeholder="E.G. OWNERSHIP_VERIFIED"
                            value={
                              selectedType.settings?.customVerificationLabels?.[
                                'completed'
                              ] || ''
                            }
                            onChange={(e) => {
                              updateType.mutate({
                                id: selectedType.id,
                                data: {
                                  settings: {
                                    ...selectedType.settings,
                                    customVerificationLabels: {
                                      ...selectedType.settings
                                        ?.customVerificationLabels,
                                      completed: e.target.value,
                                    },
                                  },
                                },
                              });
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center gap-6 opacity-30">
            <Database className="w-20 h-20 text-[var(--text-base)]" />
            <div className="text-center space-y-2">
              <span className="text-[10px] text-[var(--text-base)] font-black uppercase tracking-[0.5em]">
                SYSTEM_STANDBY
              </span>
              <p className="text-[11px] text-[var(--text-muted)] font-mono tracking-widest uppercase">
                Select an archetype to begin protocol configuration
              </p>
            </div>
          </div>
        )}
      </main>

      {/* 3. Right Pane - Live Mobile Preview (Fixed) */}
      <MobileSchemaPreview
        typeName={selectedType?.name || ''}
        columns={columns || []}
      />

      {/* 4. Side Panel - Field Configurator */}
      {editingColumn && (
        <FieldConfigurator
          column={editingColumn}
          allColumns={columns || []}
          onClose={() => setEditingFieldId(null)}
          onUpdate={(data) =>
            updateColumn.mutate({ id: editingColumn.id, data })
          }
          onDelete={(id) => {
            deleteColumn.mutate(id);
            setEditingFieldId(null);
          }}
        />
      )}

      {/* New Archetype Modal - High Fidelity */}
      {showTypeModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-xl animate-in fade-in duration-500">
          <div className="w-full max-w-md bg-[var(--surface-container-low)] rounded-[3rem] shadow-obsidian-2xl border border-[var(--color-border-base)]/40 overflow-hidden relative">
            <div className="absolute top-0 right-0 p-12 bg-primary/5 blur-[100px] -mr-32 -mt-32" />
            <div className="p-10 space-y-10 relative z-10">
              <div className="flex items-start justify-between">
                <div className="space-y-2 max-w-sm">
                  <div className="space-y-1">
                    <span className="text-[9px] font-black text-primary uppercase tracking-[0.3em]">
                      CREATION_GATE
                    </span>
                    <h3 className="text-2xl font-black text-[var(--color-text-base)] tracking-tight uppercase">
                      New Archetype
                    </h3>
                  </div>
                  <p className="text-[11px] text-[var(--color-text-muted)] leading-relaxed">
                    Archetypes define the fundamental structure and verification requirements for records in your project. Establish your data blueprint here.
                  </p>
                </div>
                <button
                  onClick={() => setShowTypeModal(false)}
                  className="p-3 hover:bg-[var(--color-surface-muted)]/50 rounded-2xl border border-[var(--color-border-subtle)] transition-all"
                >
                  <X className="w-5 h-5 text-[var(--color-text-muted)]" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between px-1">
                    <label className="text-[10px] font-black text-[var(--color-text-muted)] uppercase tracking-widest">
                      Protocol Name
                    </label>
                  </div>
                  <input
                    className="w-full bg-[var(--color-surface-lowest)] border border-[var(--color-border-subtle)] rounded-2xl p-4 text-[var(--color-text-base)] font-black text-sm outline-none focus:border-primary/50 transition-all placeholder:text-[var(--color-text-muted)]/30"
                    placeholder="e.g. EMPLOYEE_VERIFICATION"
                    value={newTypeData.name}
                    onChange={(e) =>
                      setNewTypeData({ ...newTypeData, name: e.target.value })
                    }
                  />
                  <div className="flex flex-wrap gap-2 pt-1">
                    {['SITE_INSPECTION', 'EMPLOYEE_VERIFICATION', 'ASSET_AUDIT'].map(preset => (
                      <button 
                        key={preset}
                        onClick={() => setNewTypeData({ ...newTypeData, name: preset })}
                        className="px-2.5 py-1 rounded-md text-[9px] font-bold text-primary bg-primary/10 hover:bg-primary/20 transition-colors uppercase tracking-widest"
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest px-1">
                    Narrative Definition
                  </label>
                  <textarea
                    className="w-full bg-[var(--surface-lowest)] border border-[var(--border-subtle)] rounded-2xl p-4 text-[var(--color-text-base)] font-medium text-sm outline-none focus:border-primary/50 transition-all placeholder:text-[var(--text-muted)]/10 min-h-[100px]"
                    placeholder="Define the scope of this verification archetype..."
                    value={newTypeData.description}
                    onChange={(e) =>
                      setNewTypeData({
                        ...newTypeData,
                        description: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <button
                onClick={handleCreateType}
                disabled={createType.isPending}
                className="w-full py-5 bg-primary text-[var(--surface-lowest)] rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {createType.isPending ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Shield className="w-5 h-5" />
                )}
                INITIALIZE ARCHETYPE
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Element Modal - High Fidelity */}
      {showElementModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-xl animate-in fade-in duration-500">
          <div className="w-full max-w-md bg-[var(--surface-container-low)] rounded-[3rem] shadow-obsidian-2xl border border-[var(--color-border-base)]/40 overflow-hidden relative">
            <div className="p-10 space-y-10 relative z-10">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-[9px] font-black text-primary uppercase tracking-[0.3em]">
                    INJECTION_PROTOCOL
                  </span>
                  <h3 className="text-2xl font-black text-[var(--color-text-base)] tracking-tight uppercase">
                    New Element
                  </h3>
                </div>
                <button
                  onClick={() => setShowElementModal(false)}
                  className="p-3 hover:bg-[var(--color-surface-muted)]/50 rounded-2xl border border-[var(--border-subtle)] transition-all"
                >
                  <X className="w-5 h-5 text-[var(--text-muted)]" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest px-1">
                    Element Label
                  </label>
                  <input
                    className="w-full bg-[var(--surface-lowest)] border border-[var(--border-subtle)] rounded-2xl p-4 text-[var(--color-text-base)] font-black text-sm outline-none focus:border-primary/50 transition-all placeholder:text-[var(--text-muted)]/10"
                    placeholder="E.G. SITE_PHOTOGRAPH"
                    value={newElementData.name}
                    onChange={(e) => {
                      const name = e.target.value;
                      const key = name
                        .toLowerCase()
                        .replace(/\s+/g, '_')
                        .replace(/[^a-z0-9_]/g, '');
                      setNewElementData({ ...newElementData, name, key });
                    }}
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest px-1">
                    Data Archetype
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.values(ColumnType).map((type) => (
                      <button
                        key={type}
                        onClick={() =>
                          setNewElementData({
                            ...newElementData,
                            columnType: type as ColumnType,
                          })
                        }
                        className={`p-3 rounded-xl border text-[9px] font-black uppercase tracking-widest transition-all ${
                          newElementData.columnType === type
                            ? 'bg-primary/20 border-primary text-primary'
                            : 'bg-[var(--surface-lowest)] border-[var(--border-subtle)] text-[var(--text-muted)]/20 hover:text-[var(--text-muted)]/40'
                        }`}
                      >
                        {type.replace('_', ' ')}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <button
                onClick={handleCreateElement}
                disabled={createColumn.isPending}
                className="w-full py-5 bg-primary text-[var(--surface-lowest)] rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {createColumn.isPending ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Plus className="w-5 h-5" />
                )}
                INJECT CORE ELEMENT
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
