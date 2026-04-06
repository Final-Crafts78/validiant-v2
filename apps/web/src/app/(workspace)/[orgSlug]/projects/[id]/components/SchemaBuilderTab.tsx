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
  Edit3,
  Shield,
  X,
  Save,
  Loader2,
} from 'lucide-react';

/**
 * SchemaBuilderTab - The engine for defining project data types and columns.
 * Obsidian Verifier aesthetic with sidebar navigation.
 */
export function SchemaBuilderTab({ projectId }: { projectId: string }) {
  const { 
    data: types, 
    isLoading, 
    createType, 
    deleteType 
  } = useProjectTypes(projectId);
  
  const [selectedTypeId, setSelectedTypeId] = useState<string | null>(null);
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [showElementModal, setShowElementModal] = useState(false);
  
  // Local form state for new archetype
  const [newTypeData, setNewTypeData] = useState({ 
    name: '', 
    description: '', 
    color: '#4f46e5' 
  });
  
  // Local form state for new element
  const [newElementData, setNewElementData] = useState({ 
    name: '', 
    key: '', 
    columnType: ColumnType.TEXT 
  });

  const projectTypes = (types as ProjectType[]) || [];
  const effectiveSelectedId = selectedTypeId || projectTypes[0]?.id;
  const selectedType = projectTypes.find((t) => t.id === effectiveSelectedId);
  
  const { 
    columns, 
    createColumn, 
    deleteColumn 
  } = useTypeColumns(projectId, selectedType?.id);

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-10 bg-surface-container-low rounded-xl w-1/4" />
        <div className="flex gap-8 h-96">
          <div className="w-1/3 bg-surface-container-low rounded-[2.5rem]" />
          <div className="flex-1 bg-surface-container-low rounded-[2.5rem]" />
        </div>
      </div>
    );
  }

  const handleCreateType = async () => {
    await createType.mutateAsync(newTypeData);
    setShowTypeModal(false);
    setNewTypeData({ name: '', description: '', color: '#4f46e5' });
  };

  const handleCreateElement = async () => {
    if (!selectedType) return;
    await createColumn.mutateAsync(newElementData);
    setShowElementModal(false);
    setNewElementData({ name: '', key: '', columnType: ColumnType.TEXT });
  };

  return (
    <div className="flex gap-12 items-start h-[calc(100vh-12rem)] relative">
      {/* Sidebar - Types List */}
      <aside className="w-80 flex flex-col gap-8 h-full">
        <div className="flex items-center justify-between px-2">
          <div className="flex flex-col">
            <span className="text-[10px] text-primary font-bold uppercase tracking-[0.2em]">
              Structure
            </span>
            <h3 className="text-sm text-white/40 font-display">
              Data Archetypes
            </h3>
          </div>
          <button 
            onClick={() => setShowTypeModal(true)}
            className="p-2.5 bg-primary/10 text-primary rounded-xl hover:bg-primary/20 transition-all border border-primary/5 group"
          >
            <Plus className="w-4 h-4 transition-transform group-hover:rotate-90" />
          </button>
        </div>

        <nav className="flex flex-col gap-3 overflow-y-auto custom-scrollbar pr-2">
          {projectTypes.map((type) => {
            const isActive = effectiveSelectedId === type.id;
            return (
              <button
                key={type.id}
                onClick={() => setSelectedTypeId(type.id)}
                className={`group flex items-center justify-between p-5 rounded-2xl transition-all duration-500 ${
                  isActive
                    ? 'bg-surface-container-low shadow-obsidian-lg scale-[1.02]'
                    : 'bg-transparent hover:bg-surface-lowest/30 text-white/40'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-[0_0_20px_rgba(0,0,0,0.3)] relative"
                    style={{ background: type.color || '#3b82f6' }}
                  >
                    <Database className="w-4 h-4" />
                    <div className="absolute inset-0 bg-white/10 rounded-xl" />
                  </div>
                  <div className="text-left">
                    <p
                      className={`text-xs font-bold font-display tracking-tight transition-colors ${
                        isActive ? 'text-primary' : 'text-white/60'
                      }`}
                    >
                      {type.name}
                    </p>
                    <p className="text-[9px] font-mono text-white/20 uppercase tracking-widest">
                      {type.columns?.length || 0} Elements
                    </p>
                  </div>
                </div>
                <ChevronRight
                  className={`w-4 h-4 transition-all duration-500 ${
                    isActive
                      ? 'translate-x-1 text-primary opacity-100'
                      : 'opacity-0 group-hover:opacity-40'
                  }`}
                />
              </button>
            );
          })}
        </nav>

        <div className="mt-auto bg-emerald-500/5 rounded-2xl p-6 space-y-3 relative overflow-hidden group/audit">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover/audit:opacity-20 transition-opacity">
            <Shield className="w-12 h-12 text-emerald-500" />
          </div>
          <div className="flex items-center gap-2 text-emerald-500">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-widest">
              Protocol_Audit
            </span>
          </div>
          <p className="text-[11px] text-white/30 leading-relaxed font-mono italic">
            // Structural changes are locked to global immutable ledger.
          </p>
        </div>
      </aside>

      {/* Main Content - Column Editor */}
      <main className="flex-1 h-full flex flex-col bg-surface-lowest rounded-3xl shadow-obsidian overflow-hidden border border-white/[0.02]">
        {selectedType ? (
          <>
            <header className="p-10 border-b border-white/[0.02] bg-surface-bright/20 backdrop-blur-md flex items-center justify-between relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-[100px] -mr-32 -mt-32" />
              <div className="editorial-header relative z-10">
                <label>Archetype_Config</label>
                <h2 className="text-3xl text-white/80">{selectedType.name}</h2>
                <p className="text-sm text-white/30 mt-2 max-w-lg">
                  {selectedType.description ||
                    'Configuring global verification protocol parameters.'}
                </p>
              </div>
              <div className="flex items-center gap-3 relative z-10">
                <button className="p-3 bg-white/5 text-white/40 hover:text-primary hover:bg-primary/10 rounded-2xl transition-all">
                  <Edit3 className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => deleteType.mutate(selectedType.id)}
                  className="p-3 bg-white/5 text-white/40 hover:text-red-400 hover:bg-red-500/10 rounded-2xl transition-all"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </header>

            <div className="p-10 flex-1 overflow-y-auto space-y-10 custom-scrollbar">
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-[10px] text-primary/60 font-bold uppercase tracking-[0.2em]">
                    Schema
                  </span>
                  <h3 className="text-sm text-white/40 font-display">
                    Universe Elements
                  </h3>
                </div>
                <button 
                  onClick={() => setShowElementModal(true)}
                  className="btn btn-primary px-8 group"
                >
                  <Plus className="w-4 h-4 transition-transform group-hover:scale-125" />
                  Inject Element
                </button>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {(columns || selectedType.columns)?.map((column: TypeColumn) => (
                  <div
                    key={column.id}
                    className="group relative flex items-center justify-between p-6 bg-surface-container-low/40 rounded-2xl hover:bg-surface-container-low transition-all duration-500 overflow-hidden"
                  >
                    <div className="absolute inset-y-0 left-0 w-1 bg-primary/0 group-hover:bg-primary transition-all" />

                    <div className="flex items-center gap-6">
                      <div className="w-12 h-12 rounded-xl bg-surface-container-highest flex items-center justify-center text-white/20 group-hover:text-primary group-hover:bg-primary/10 transition-all duration-500 shadow-inner">
                        <LayoutGrid className="w-5 h-5" />
                      </div>
                      <div className="flex flex-col gap-1">
                        <h4 className="text-[14px] font-bold text-white/70 tracking-tight group-hover:text-white transition-colors capitalize">
                          {column.name}
                        </h4>
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] font-mono text-white/20 group-hover:text-primary/40 transition-colors uppercase">
                            {column.key}
                          </span>
                          <div className="w-1 h-1 rounded-full bg-white/5" />
                          <span className="badge badge-primary scale-[0.8] origin-left bg-primary/20 text-primary">
                            {column.columnType}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                      <button className="p-2.5 bg-white/5 text-white/30 hover:text-primary hover:bg-primary/10 rounded-xl transition-all">
                        <Settings className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => deleteColumn.mutate(column.id)}
                        className="p-2.5 bg-white/5 text-white/30 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}

                {(!selectedType.columns || selectedType.columns.length === 0) && (!columns || columns.length === 0) && (
                  <div className="h-64 flex flex-col items-center justify-center rounded-[2.5rem] bg-surface-container-low/20 border border-dashed border-white/5 gap-4">
                    <div className="flex flex-col items-center gap-2">
                      <span className="text-[10px] text-white/10 font-bold uppercase tracking-[0.3em]">
                        Void_Universe
                      </span>
                      <p className="text-xs text-white/20 font-mono italic">
                        // No protocol elements defined yet.
                      </p>
                    </div>
                    <button 
                      onClick={() => setShowElementModal(true)}
                      className="text-[10px] text-primary font-bold uppercase tracking-widest hover:underline decoration-primary/40 underline-offset-8"
                    >
                      Initialize First Element
                    </button>
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center flex-1 gap-6 opacity-20">
            <Database className="w-16 h-16 text-white" />
            <div className="flex flex-col items-center gap-2">
              <span className="text-[10px] text-white font-bold uppercase tracking-[0.4em]">
                Standby
              </span>
              <p className="text-[11px] text-white/40 font-mono tracking-widest uppercase">
                Awaiting Archetype Selection
              </p>
            </div>
          </div>
        )}
      </main>

      {/* New Archetype Modal */}
      {showTypeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="w-full max-w-md bg-surface-base rounded-[2.5rem] shadow-obsidian border border-white/5 overflow-hidden">
            <div className="p-8 space-y-8">
              <div className="flex items-center justify-between">
                <div className="editorial-header">
                  <label>Creation_Portal</label>
                  <h3 className="text-2xl">New Archetype</h3>
                </div>
                <button onClick={() => setShowTypeModal(false)} className="p-2 hover:bg-white/5 rounded-full">
                  <X className="w-5 h-5 text-white/40" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-primary/60 uppercase tracking-widest">Name</label>
                  <input 
                    className="input" 
                    placeholder="e.g. Field Inspection" 
                    value={newTypeData.name}
                    onChange={(e) => setNewTypeData({...newTypeData, name: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-primary/60 uppercase tracking-widest">Description</label>
                  <textarea 
                    className="input min-h-[80px]" 
                    placeholder="Describe this protocol..." 
                    value={newTypeData.description}
                    onChange={(e) => setNewTypeData({...newTypeData, description: e.target.value})}
                  />
                </div>
              </div>

              <button 
                onClick={handleCreateType}
                disabled={createType.isPending}
                className="btn btn-primary w-full py-4 rounded-2xl group"
              >
                {createType.isPending 
                  ? <Loader2 className="w-5 h-5 animate-spin" /> 
                  : <Save className="w-5 h-5 group-hover:scale-110" />
                }
                Define Archetype
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Element Modal */}
      {showElementModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="w-full max-w-md bg-surface-base rounded-[2.5rem] shadow-obsidian border border-white/5 overflow-hidden">
            <div className="p-8 space-y-8">
              <div className="flex items-center justify-between">
                <div className="editorial-header">
                  <label>Injection_Protocol</label>
                  <h3 className="text-2xl">New Element</h3>
                </div>
                <button onClick={() => setShowElementModal(false)} className="p-2 hover:bg-white/5 rounded-full">
                  <X className="w-5 h-5 text-white/40" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-primary/60 uppercase tracking-widest">Field Name</label>
                  <input 
                    className="input" 
                    placeholder="e.g. Site Photograph" 
                    value={newElementData.name}
                    onChange={(e) => {
                      const name = e.target.value;
                      const key = name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
                      setNewElementData({...newElementData, name, key});
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-primary/60 uppercase tracking-widest">Data Type</label>
                  <select 
                    className="input appearance-none text-white/60"
                    value={newElementData.columnType}
                    onChange={(e) => setNewElementData({
                      ...newElementData, 
                      columnType: e.target.value as ColumnType
                    })}
                  >
                    {Object.values(ColumnType).map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
              </div>

              <button 
                onClick={handleCreateElement}
                disabled={createColumn.isPending}
                className="btn btn-primary w-full py-4 rounded-2xl group"
              >
                {createColumn.isPending 
                  ? <Loader2 className="w-5 h-5 animate-spin" /> 
                  : <Plus className="w-5 h-5 group-hover:scale-110" />
                }
                Inject Element
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
