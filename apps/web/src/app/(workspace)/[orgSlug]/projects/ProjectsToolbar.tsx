'use client';

import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { Search, LayoutGrid, List, X } from 'lucide-react';
import { ProjectStatus, ProjectPriority } from '@validiant/shared';
import { useState, useCallback, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface ProjectsToolbarProps {
  viewMode: 'grid' | 'list';
  setViewMode: (mode: 'grid' | 'list') => void;
  viewSettings: {
    showRecords: boolean;
    showProgress: boolean;
    showApiStatus: boolean;
    showDescription: boolean;
  };
  setViewSettings: React.Dispatch<
    React.SetStateAction<{
      showRecords: boolean;
      showProgress: boolean;
      showApiStatus: boolean;
      showDescription: boolean;
    }>
  >;
}

const STATUS_OPTIONS = Object.values(ProjectStatus);
const PRIORITY_OPTIONS = Object.values(ProjectPriority);

export function ProjectsToolbar({
  viewMode,
  setViewMode,
  viewSettings,
  setViewSettings,
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

  const [showSettings, setShowSettings] = useState(false);

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
    <div className="flex flex-col gap-8 mb-16 animate-in fade-in slide-in-from-top-4 duration-1000">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        {/* Search Bar - Architectural Glass */}
        <div className="relative flex-1 max-w-2xl group">
          <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
            <Search className="w-5 h-5 text-text-muted group-focus-within:text-primary transition-premium opacity-40" />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search data universe precision records..."
            className="w-full pl-14 pr-6 h-16 bg-surface-lowest/50 backdrop-blur-xl border border-[var(--color-border-base)]/20 focus:border-primary/20 focus:bg-surface-lowest transition-premium rounded-3xl text-sm font-medium placeholder:text-text-muted/30 shadow-obsidian-inner"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-5 top-1/2 -translate-y-1/2 p-2 hover:bg-[var(--color-surface-muted)]/50 rounded-2xl transition-premium"
            >
              <X className="w-4 h-4 text-text-muted" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-6">
          {/* View Customization */}
          <div className="relative">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className={cn(
                'flex items-center justify-center h-12 px-6 rounded-xl transition-premium text-[10px] font-black uppercase tracking-[0.2em] border border-[var(--color-border-base)]/20 shadow-obsidian-inner',
                showSettings
                  ? 'bg-primary text-background'
                  : 'bg-surface-lowest/50 text-text-muted hover:text-[var(--color-text-base)]'
              )}
            >
              Architectural View
            </button>

            {showSettings && (
              <div className="absolute right-0 mt-4 w-72 bg-surface-container-high/90 backdrop-blur-3xl rounded-3xl p-6 border border-[var(--color-border-base)]/40 shadow-2xl z-50 animate-in fade-in slide-in-from-top-4 duration-300">
                <div className="space-y-6">
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-black uppercase tracking-[0.3em] text-primary">
                      Dynamic Perspective
                    </label>
                    <p className="text-[11px] text-text-muted font-medium">
                      Configure your architectural data stream.
                    </p>
                  </div>

                  <div className="space-y-3">
                    {[
                      { id: 'showRecords', label: 'Verified Records' },
                      { id: 'showProgress', label: 'Sync Velocity' },
                      { id: 'showApiStatus', label: 'Operational Status' },
                      { id: 'showDescription', label: 'Descriptor Text' },
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        onClick={() =>
                          setViewSettings((prev) => ({
                            ...prev,
                            [opt.id]: !prev[opt.id as keyof typeof prev],
                          }))
                        }
                        className="flex items-center justify-between w-full p-4 rounded-2xl bg-[var(--color-surface-muted)]/50 hover:bg-[var(--color-surface-muted)] transition-premium"
                      >
                        <span className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-base)]/60">
                          {opt.label}
                        </span>
                        <div
                          className={cn(
                            'w-10 h-5 rounded-full relative transition-premium',
                            viewSettings[opt.id as keyof typeof viewSettings]
                              ? 'bg-primary'
                              : 'bg-[var(--color-surface-muted)]'
                          )}
                        >
                          <div
                            className={cn(
                              'absolute top-1 w-3 h-3 rounded-full bg-white transition-premium',
                              viewSettings[opt.id as keyof typeof viewSettings]
                                ? 'left-6'
                                : 'left-1'
                            )}
                          />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* View Switcher - Obsidian Texture */}
          <div className="flex p-1.5 bg-surface-lowest/50 backdrop-blur-xl rounded-[1.25rem] border border-[var(--color-border-base)]/20 shadow-obsidian-inner">
            <button
              onClick={() => setViewMode('grid')}
              className={`flex items-center justify-center w-12 h-12 rounded-xl transition-premium ${
                viewMode === 'grid'
                  ? 'bg-primary text-background shadow-glow-primary scale-100'
                  : 'text-text-muted hover:text-[var(--color-text-base)] hover:bg-[var(--color-surface-muted)]/50'
              }`}
              title="Grid Architecture"
            >
              <LayoutGrid className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center justify-center w-12 h-12 rounded-xl transition-premium ${
                viewMode === 'list'
                  ? 'bg-primary text-background shadow-glow-primary scale-100'
                  : 'text-text-muted hover:text-[var(--color-text-base)] hover:bg-[var(--color-surface-muted)]/50'
              }`}
              title="List Framework"
            >
              <List className="w-5 h-5" />
            </button>
          </div>

          {hasFilters && (
            <button
              onClick={clearFilters}
              className="text-[10px] font-black uppercase tracking-[0.3em] text-rose-500 hover:text-rose-400 transition-premium px-4 py-2 rounded-xl bg-rose-500/5 hover:bg-rose-500/10"
            >
              Purge Filters
            </button>
          )}
        </div>
      </div>

      {/* Dynamic Filter Strip */}
      <div className="flex flex-wrap items-center gap-8">
        <div className="flex items-center gap-4 pr-6">
          <div className="w-2 h-2 rounded-full bg-primary shadow-glow-primary animate-pulse" />
          <span className="text-[10px] font-black uppercase tracking-[0.4em] text-text-muted opacity-40">
            Verifier Criteria
          </span>
        </div>

        {/* Status Filters */}
        <div className="flex flex-wrap gap-3">
          {STATUS_OPTIONS.map((status) => (
            <button
              key={status}
              onClick={() => toggleStatus(status)}
              className={`px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-premium ${
                activeStatuses.includes(status)
                  ? 'bg-primary text-background shadow-glow-primary'
                  : 'bg-surface-lowest/50 text-text-muted hover:text-[var(--color-text-base)] border border-[var(--color-border-base)]/20'
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        <div className="w-px h-6 bg-[var(--color-surface-muted)]/50 mx-2" />

        {/* Priority Filters */}
        <div className="flex flex-wrap gap-3">
          {PRIORITY_OPTIONS.map((priority) => (
            <button
              key={priority}
              onClick={() => togglePriority(priority)}
              className={`px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-premium ${
                activePriorities.includes(priority)
                  ? 'bg-amber-500 text-background shadow-glow-amber'
                  : 'bg-surface-lowest/50 text-text-muted hover:text-[var(--color-text-base)] border border-[var(--color-border-base)]/20'
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
