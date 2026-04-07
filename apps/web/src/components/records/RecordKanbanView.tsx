'use client';

import React, { useState } from 'react';
import { ProjectRecord, ProjectType } from '@validiant/shared';
import { 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Zap, 
  Plus,
  GripVertical,
  User
} from 'lucide-react';
import { format } from 'date-fns';

interface RecordKanbanViewProps {
  projectType: ProjectType;
  records: ProjectRecord[];
  onEdit: (recordId: string) => void;
  onStatusChange?: (recordId: string, newStatus: string) => void;
}

const LANES = [
  { 
    id: 'pending', 
    label: 'Pending', 
    icon: Clock, 
    color: 'text-amber-500', 
    bg: 'bg-amber-500/10', 
    border: 'border-amber-500/20' 
  },
  { 
    id: 'in_progress', 
    label: 'In Progress', 
    icon: Zap, 
    color: 'text-primary', 
    bg: 'bg-primary/10', 
    border: 'border-primary/20' 
  },
  { 
    id: 'verified', 
    label: 'Verified', 
    icon: CheckCircle2, 
    color: 'text-emerald-500', 
    bg: 'bg-emerald-500/10', 
    border: 'border-emerald-500/20' 
  },
  { 
    id: 'flagged', 
    label: 'Flagged', 
    icon: AlertCircle, 
    color: 'text-rose-500', 
    bg: 'bg-rose-500/10', 
    border: 'border-rose-500/20' 
  },
];

export function RecordKanbanView({ 
  projectType: _projectType,
  records, 
  onEdit, 
  onStatusChange 
}: RecordKanbanViewProps) {
  const [draggedRecordId, setDraggedRecordId] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, recordId: string) => {
    setDraggedRecordId(recordId);
    e.dataTransfer.setData('recordId', recordId);
    const target = e.currentTarget as HTMLElement;
    target.style.opacity = '0.4';
  };

  const handleDragEnd = (e: React.DragEvent) => {
    setDraggedRecordId(null);
    const target = e.currentTarget as HTMLElement;
    target.style.opacity = '1';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, status: string) => {
    e.preventDefault();
    const recordId = e.dataTransfer.getData('recordId');
    if (recordId && onStatusChange) {
      onStatusChange(recordId, status);
    }
  };

  return (
    <div className="flex gap-6 overflow-x-auto scroller-hidden pb-6 h-[calc(100vh-280px)] min-h-[500px]">
      {LANES.map((lane) => {
        const laneRecords = records.filter((r) => r.status === lane.id);
        const Icon = lane.icon;

        return (
          <div
            key={lane.id}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, lane.id)}
            className="flex-shrink-0 w-80 flex flex-col gap-4"
          >
            {/* Lane Header */}
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl ${lane.bg} border ${lane.border}`}>
                  <Icon className={`w-4 h-4 ${lane.color}`} />
                </div>
                <div>
                  <h4 className="text-[11px] font-black uppercase tracking-widest text-white/80">
                    {lane.label}
                  </h4>
                  <p className="text-[9px] font-bold text-white/20 uppercase tracking-tighter">
                    {laneRecords.length} Nodes detected
                  </p>
                </div>
              </div>
              <button className="p-1.5 rounded-lg text-white/10 hover:text-white/40 transition-colors">
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Lane Body */}
            <div 
              className={`flex-1 rounded-[2.5rem] p-4 flex flex-col gap-3 transition-colors duration-300 ${
                draggedRecordId 
                  ? 'bg-white/[0.02] border border-dashed border-white/5' 
                  : 'bg-surface-lowest/40'
              }`}
            >
              {laneRecords.map((record) => {
                const firstKey = Object.keys(record.data)[0];
                const titleValue = firstKey ? String(record.data[firstKey]) : 'Untitled Node';
                
                return (
                  <div
                    key={record.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, record.id)}
                    onDragEnd={handleDragEnd}
                    onClick={() => onEdit(record.id)}
                    className="group relative bg-surface-lowest border border-white/[0.03] rounded-3xl p-5 shadow-obsidian hover:shadow-obsidian-lg hover:border-primary/20 transition-all cursor-grab active:cursor-grabbing"
                  >
                    <div className="space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono font-black text-primary tracking-tighter bg-primary/10 px-2 py-0.5 rounded-lg">
                              #{record.number}
                            </span>
                          </div>
                          <h5 className="text-[11px] font-bold text-white/90 line-clamp-1">
                            {titleValue}
                          </h5>
                        </div>
                        <GripVertical className="w-4 h-4 text-white/5 group-hover:text-white/20 transition-colors" />
                      </div>

                      {/* Metadata Preview */}
                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex items-center gap-2 bg-white/[0.02] rounded-xl p-2 px-3">
                          <User className="w-3 h-3 text-white/20" />
                          <span className="text-[9px] font-bold text-white/40 truncate uppercase tracking-widest">
                            {record.createdVia}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 bg-white/[0.02] rounded-xl p-2 px-3">
                          <Clock className="w-3 h-3 text-white/20" />
                          <span className="text-[9px] font-bold text-white/40 uppercase tracking-widest">
                            {format(new Date(record.createdAt), 'MMM dd')}
                          </span>
                        </div>
                      </div>

                      {/* Quick Stats/Indicators */}
                      <div className="flex items-center justify-between pt-2">
                        <div className="flex -space-x-1.5">
                          <div className="w-5 h-5 rounded-full border border-surface-lowest bg-surface-container-low flex items-center justify-center">
                            <User className="w-2.5 h-2.5 text-white/30" />
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                          <span className="text-[8px] font-black uppercase tracking-widest text-white/30">
                            Active
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              
              {laneRecords.length === 0 && !draggedRecordId && (
                <div className="flex-1 flex flex-col items-center justify-center opacity-10 py-10">
                  <Icon className="w-8 h-8 mb-2" />
                  <p className="text-[9px] font-black uppercase tracking-widest text-center">
                    Zone Empty
                  </p>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
