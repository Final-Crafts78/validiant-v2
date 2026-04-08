'use client';

import { Search, Calendar, User, Filter, X, ChevronDown } from 'lucide-react';
import { useState } from 'react';

interface ActiveFilter {
  id: string;
  label: string;
  value: string;
}

export function RecordsFilterBar() {
  const [activeFilters, setActiveFilters] = useState<ActiveFilter[]>([
    { id: 'assigned', label: 'Assigned', value: 'Julian Ops' },
    { id: 'date', label: 'Oct 2023', value: '10/23' },
  ]);

  const removeFilter = (id: string) => {
    setActiveFilters(activeFilters.filter((f) => f.id !== id));
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[300px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
          <input
            type="text"
            placeholder="Search records, IDs, or candidates..."
            className="w-full h-11 pl-11 pr-4 bg-[var(--surface-container-low)] border border-[var(--color-border-base)]/20 rounded-2xl text-sm text-[#dce1fb] placeholder-[#8c909f] focus:outline-none focus:border-[var(--color-border-base)]/40 transition-all font-medium"
          />
        </div>

        {/* Date Filter */}
        <button className="h-11 px-4 bg-[var(--surface-container-low)] border border-[var(--color-border-base)]/20 rounded-2xl flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-[#dce1fb] hover:border-[var(--color-border-base)]/40 transition-all">
          <Calendar className="w-4 h-4" />
          <span className="font-bold uppercase tracking-widest text-[9px]">
            Date Range
          </span>
          <ChevronDown className="w-3 h-3 ml-2" />
        </button>

        {/* Status Filter */}
        <button className="h-11 px-4 bg-[var(--surface-container-low)] border border-[var(--color-border-base)]/20 rounded-2xl flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-[#dce1fb] hover:border-[var(--color-border-base)]/40 transition-all">
          <Filter className="w-4 h-4" />
          <span className="font-bold uppercase tracking-widest text-[9px]">
            Status
          </span>
          <ChevronDown className="w-3 h-3 ml-2" />
        </button>

        {/* Member Filter */}
        <button className="h-11 px-4 bg-[var(--surface-container-low)] border border-[var(--color-border-base)]/20 rounded-2xl flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-[#dce1fb] hover:border-[var(--color-border-base)]/40 transition-all">
          <User className="w-4 h-4" />
          <span className="font-bold uppercase tracking-widest text-[9px]">
            Assigned
          </span>
          <ChevronDown className="w-3 h-3 ml-2" />
        </button>

        {/* Results Count */}
        <div className="px-4 text-[10px] text-[var(--text-muted)]">
          <span className="font-black text-primary">1,492</span> TOTAL RESULTS
        </div>
      </div>

      {/* Active Filter Chips */}
      {activeFilters.length > 0 && (
        <div className="flex items-center flex-wrap gap-2 pt-2 border-t border-[var(--color-border-base)]/20">
          <span className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest px-2">
            Active Filters:
          </span>
          {activeFilters.map((filter) => (
            <div
              key={filter.id}
              className="flex items-center gap-2 pl-3 pr-1.5 py-1.5 bg-[#adc6ff]/10 border border-[#adc6ff]/20 rounded-full group cursor-default"
            >
              <span className="text-[10px] font-bold text-primary">
                {filter.label}: {filter.value}
              </span>
              <button
                onClick={() => removeFilter(filter.id)}
                className="p-1 hover:bg-[#adc6ff]/20 rounded-full transition-colors"
              >
                <X className="w-3 h-3 text-primary" />
              </button>
            </div>
          ))}
          <button
            onClick={() => setActiveFilters([])}
            className="text-[10px] font-bold text-rose-400 hover:underline px-2"
          >
            Clear All
          </button>
        </div>
      )}
    </div>
  );
}
