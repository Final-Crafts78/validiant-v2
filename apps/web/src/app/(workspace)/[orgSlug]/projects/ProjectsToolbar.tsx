'use client';

import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { Search, LayoutGrid, List, X } from 'lucide-react';
import { ProjectStatus, ProjectPriority } from '@validiant/shared';
import { useState, useCallback, useEffect } from 'react';

interface ProjectsToolbarProps {
  viewMode: 'grid' | 'list';
  setViewMode: (mode: 'grid' | 'list') => void;
}

const STATUS_OPTIONS = Object.values(ProjectStatus);
const PRIORITY_OPTIONS = Object.values(ProjectPriority);

export function ProjectsToolbar({
  viewMode,
  setViewMode,
}: ProjectsToolbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(searchParams.get('q') || '');
  const [activeStatuses, setActiveStatuses] = useState<string[]>(
    searchParams.get('status')?.split(',').filter(Boolean) || []
  );
  const [activePriorities, setActivePriorities] = useState<string[]>(
    searchParams.get('priority')?.split(',').filter(Boolean) || []
  );

  // Update URL search params for sync
  const updateParams = useCallback(
    (newParams: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(newParams).forEach(([key, value]) => {
        if (value === null || value === '') {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      });

      router.replace(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams]
  );

  // Debounced search sync to URL
  useEffect(() => {
    const timer = setTimeout(() => {
      if (search !== (searchParams.get('q') || '')) {
        updateParams({ q: search });
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [search, searchParams, updateParams]);

  const toggleStatus = (status: string) => {
    const next = activeStatuses.includes(status)
      ? activeStatuses.filter((s) => s !== status)
      : [...activeStatuses, status];
    setActiveStatuses(next);
    updateParams({ status: next.length ? next.join(',') : null });
  };

  const togglePriority = (priority: string) => {
    const next = activePriorities.includes(priority)
      ? activePriorities.filter((p) => p !== priority)
      : [...activePriorities, priority];
    setActivePriorities(next);
    updateParams({ priority: next.length ? next.join(',') : null });
  };

  const clearFilters = () => {
    setSearch('');
    setActiveStatuses([]);
    setActivePriorities([]);
    router.replace(pathname);
  };

  const hasFilters =
    search || activeStatuses.length > 0 || activePriorities.length > 0;

  return (
    <div className="flex flex-col gap-6 mb-10 animate-in fade-in slide-in-from-top-2 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search Bar - Editorial Design */}
        <div className="relative flex-1 max-w-md group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-[var(--color-text-muted)] group-focus-within:text-primary-500 transition-colors" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search precision data..."
            className="w-full pl-12 pr-4 h-12 bg-[var(--color-surface-soft)] border-none focus:ring-2 focus:ring-primary-500/20 focus:bg-[var(--color-surface-base)] transition-all rounded-2xl text-sm font-medium placeholder:text-[var(--color-text-muted)]/50"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 hover:bg-[var(--color-surface-muted)] rounded-xl transition-all"
            >
              <X className="w-3.5 h-3.5 text-[var(--color-text-muted)]" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-4">
          {/* View Switcher - Obsidian Texture */}
          <div className="flex p-1 bg-[var(--color-surface-soft)] rounded-2xl border border-[var(--color-border-base)]/5">
            <button
              onClick={() => setViewMode('grid')}
              className={`flex items-center justify-center w-10 h-10 rounded-xl transition-all ${
                viewMode === 'grid'
                  ? 'bg-[var(--color-surface-base)] shadow-lg text-primary-600 scale-100'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-base)] hover:bg-[var(--color-surface-muted)]'
              }`}
              title="Grid Layout"
            >
              <LayoutGrid className="w-4.5 h-4.5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center justify-center w-10 h-10 rounded-xl transition-all ${
                viewMode === 'list'
                  ? 'bg-[var(--color-surface-base)] shadow-lg text-primary-600 scale-100'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-base)] hover:bg-[var(--color-surface-muted)]'
              }`}
              title="List Inventory"
            >
              <List className="w-4.5 h-4.5" />
            </button>
          </div>

          {hasFilters && (
            <button
              onClick={clearFilters}
              className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--color-text-muted)] hover:text-rose-500 transition-all px-2"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Dynamic Filter Strip */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-3 pr-4 border-r border-[var(--color-border-base)]/10">
          <div className="w-1.5 h-1.5 rounded-full bg-primary-500 animate-pulse" />
          <span className="text-[10px] font-black uppercase tracking-[0.15em] text-[var(--color-text-muted)]/40">
            Verifier Criteria
          </span>
        </div>

        {/* Status Filters */}
        <div className="flex flex-wrap gap-2">
          {STATUS_OPTIONS.map((status) => (
            <button
              key={status}
              onClick={() => toggleStatus(status)}
              className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider border-none transition-all ${
                activeStatuses.includes(status)
                  ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/20'
                  : 'bg-[var(--color-surface-soft)] text-[var(--color-text-muted)] hover:bg-[var(--color-surface-raised)] hover:text-[var(--color-text-base)]'
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        <div className="w-px h-4 bg-[var(--color-border-base)]/10 mx-1" />

        {/* Priority Filters */}
        <div className="flex flex-wrap gap-2">
          {PRIORITY_OPTIONS.map((priority) => (
            <button
              key={priority}
              onClick={() => togglePriority(priority)}
              className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider border-none transition-all ${
                activePriorities.includes(priority)
                  ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/10'
                  : 'bg-[var(--color-surface-soft)] text-[var(--color-text-muted)] hover:bg-[var(--color-surface-raised)] hover:text-[var(--color-text-base)]'
              }`}
            >
              {priority}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
