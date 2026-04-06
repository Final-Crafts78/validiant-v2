'use client';

import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Layers, 
  Check, 
  ArrowRight,
  Info,
  Database,
  ShieldCheck,
  UserCheck,
  HardHat,
  Monitor
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { listTemplates, type TypeTemplate } from '@/services/template.service';

/**
 * Phase 6.C: Project Archetype Picker
 * Premium visual selection for project templates.
 */

interface ArchetypePickerProps {
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}

const ICON_MAP: Record<string, any> = {
  UserCheck,
  ShieldCheck,
  HardHat,
  Monitor,
  Layers
};

export function ArchetypePicker({ selectedId, onSelect }: ArchetypePickerProps) {
  const [templates, setTemplates] = useState<TypeTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const data = await listTemplates();
      setTemplates(data);
    } catch (err) {
      console.error('Failed to load archetypes', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredTemplates = templates.filter(t => 
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.industry.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="relative group">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-text-muted)] group-focus-within:text-[var(--color-accent-base)] transition-colors" />
        <input 
          type="text"
          placeholder="Search archetypes (e.g. BGV, Compliance...)"
          className="w-full bg-[var(--color-surface-soft)] border border-[var(--color-border-base)] rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-base)]/20 transition-all font-medium"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Grid of Templates */}
      <div className="grid grid-cols-1 gap-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
        {/* Blank Template Option */}
        <div 
          onClick={() => onSelect(null)}
          className={cn(
            "p-4 rounded-2xl border-2 transition-all cursor-pointer group flex items-start gap-4",
            selectedId === null 
              ? "border-[var(--color-accent-base)] bg-[var(--color-accent-base)]/5 shadow-md" 
              : "border-[var(--color-border-base)] bg-[var(--color-surface-soft)] hover:border-[var(--color-border-subtle)]"
          )}
        >
          <div className="h-10 w-10 shrink-0 rounded-xl bg-slate-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Database className="h-5 w-5 text-slate-500" />
          </div>
          <div className="flex-1">
            <h4 className="font-bold text-[var(--color-text-base)] flex items-center gap-2">
              Blank Project
              {selectedId === null && <Check className="h-4 w-4 text-[var(--color-accent-base)]" />}
            </h4>
            <p className="text-xs text-[var(--color-text-subtle)] mt-1">
              Start from scratch with a clean data universe.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
             <div className="h-6 w-6 border-2 border-[var(--color-accent-base)] border-t-transparent rounded-full animate-spin" />
             <span className="text-sm text-[var(--color-text-muted)]">Loading Marketplace...</span>
          </div>
        ) : (
          filteredTemplates.map((tpl) => {
            const Icon = ICON_MAP[tpl.typeDefinition.typeIcon] || Layers;
            const isSelected = selectedId === tpl.id;

            return (
              <div 
                key={tpl.id}
                onClick={() => onSelect(tpl.id)}
                className={cn(
                  "p-4 rounded-2xl border-2 transition-all cursor-pointer group flex items-start gap-4",
                  isSelected 
                    ? "border-[var(--color-accent-base)] bg-[var(--color-accent-base)]/5 shadow-md" 
                    : "border-[var(--color-border-base)] bg-[var(--color-surface-soft)] hover:border-[var(--color-border-subtle)]"
                )}
              >
                <div 
                  className="h-10 w-10 shrink-0 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform" 
                  style={{ backgroundColor: `${tpl.typeDefinition.typeColor}15`, color: tpl.typeDefinition.typeColor }}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-[var(--color-text-base)] flex items-center gap-2">
                      {tpl.name}
                      {isSelected && <Check className="h-4 w-4 text-[var(--color-accent-base)]" />}
                    </h4>
                    <span className="text-[10px] uppercase font-black tracking-widest px-2 py-0.5 rounded-full bg-[var(--color-surface-soft)] border border-[var(--color-border-base)] text-[var(--color-text-muted)]">
                       {tpl.industry}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--color-text-subtle)] mt-1 line-clamp-2">
                    {tpl.description}
                  </p>
                  
                  {isSelected && (
                    <div className="mt-3 flex items-center gap-2 text-[10px] text-[var(--color-accent-base)] font-bold animate-in slide-in-from-left-2 duration-300">
                      <ArrowRight className="h-3 w-3" />
                      <span>{tpl.typeDefinition.columns.length} pre-configured columns will be created</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="p-3 bg-amber-500/5 border border-amber-500/10 rounded-xl flex gap-3">
        <Info className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
        <p className="text-xs text-amber-600/80 leading-relaxed">
          Selecting an archetype will automatically create the initial schema for your project. You can modify these columns later in the Schema Architect.
        </p>
      </div>
    </div>
  );
}
