'use client';

import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  Settings,
  Home,
  Users,
  Plus,
  Zap,
  ArrowRight,
  Loader2,
  User,
  History,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCommandPaletteStore } from '@/store/command-palette';
import { useKeyboardShortcut } from '@/hooks/useKeyboardShortcut';
import { get } from '@/lib/api';
import { debounce } from '@/lib/utils';

interface CommandItem {
  id: string;
  title: string;
  description?: string;
  icon: React.ElementType;
  category: 'Pages' | 'Actions' | 'Recent' | 'Tasks' | 'Users' | 'Search';
  onSelect: () => void;
  shortcut?: string;
  meta?: any;
}

const RECENT_KEY = 'validiant_recent_commands';

export const CommandPalette: React.FC = () => {
  const router = useRouter();
  const { isOpen, query, close, setQuery } = useCommandPaletteStore();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<CommandItem[]>([]);
  const [recentItems, setRecentItems] = useState<CommandItem[]>([]);

  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load recent items from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(RECENT_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Map back to CommandItem (only static ones or navigation ones)
        const items = parsed.map((p: any) => ({
          ...p,
          icon:
            p.category === 'Users'
              ? User
              : p.category === 'Tasks'
                ? Zap
                : History,
          onSelect: () => router.push(p.url),
        }));
        setRecentItems(items.slice(0, 5));
      } catch (e) {
        console.error('Failed to parse recent items', e);
      }
    }
  }, [router]);

  const addToRecent = useCallback((item: CommandItem) => {
    // Only add if it's a "real" entity or page, not an action
    if (item.category === 'Actions') return;

    setRecentItems((prev) => {
      const filtered = prev.filter((p) => p.id !== item.id);
      const newRecent = [item, ...filtered].slice(0, 5);

      // Save to localStorage (serializable parts)
      const toSave = newRecent.map((r) => ({
        id: r.id,
        title: r.title,
        description: r.description,
        category: r.category,
        url: r.meta?.url || '#',
      }));
      localStorage.setItem(RECENT_KEY, JSON.stringify(toSave));

      return newRecent;
    });
  }, []);

  // Toggle palette with Cmd+K / Ctrl+K
  useKeyboardShortcut(
    'k',
    () => {
      useCommandPaletteStore.getState().toggle();
    },
    { ctrl: true, meta: true }
  );

  // Escape to close
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) close();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, close]);

  const staticCommands: CommandItem[] = useMemo(
    () => [
      {
        id: 'nav-dashboard',
        title: 'Dashboard',
        description: 'Go to overview',
        icon: Home,
        category: 'Pages',
        onSelect: () => router.push('/dashboard'),
        meta: { url: '/dashboard' },
      },
      {
        id: 'nav-tasks',
        title: 'Active Tasks',
        description: 'View all verification tasks',
        icon: Zap,
        category: 'Pages',
        onSelect: () => router.push('/dashboard/tasks'),
        meta: { url: '/dashboard/tasks' },
      },
      {
        id: 'nav-organizations',
        title: 'Organizations',
        description: 'Manage teams and entities',
        icon: Users,
        category: 'Pages',
        onSelect: () => router.push('/dashboard/organizations'),
        meta: { url: '/dashboard/organizations' },
      },
      {
        id: 'nav-settings',
        title: 'Settings',
        description: 'Account and system preferences',
        icon: Settings,
        category: 'Pages',
        onSelect: () => router.push('/dashboard/settings'),
        meta: { url: '/dashboard/settings' },
      },
      {
        id: 'action-new-case',
        title: 'New Case',
        description: 'Initiate a new BGV case',
        icon: Plus,
        category: 'Actions',
        onSelect: () => router.push('/dashboard/cases/new'),
        shortcut: 'N',
      },
    ],
    [router]
  );

  // Global Search Logic
  const performSearch = useMemo(
    () =>
      debounce(async (q: string) => {
        if (q.length < 2) {
          setSearchResults([]);
          setIsLoading(false);
          return;
        }

        try {
          const response = await get<{
            success: boolean;
            data: { tasks: any[]; users: any[] };
          }>(`/search?q=${encodeURIComponent(q)}`);

          if (response.data.success) {
            const { tasks, users } = response.data.data;

            const taskResults: CommandItem[] = tasks.map((t) => ({
              id: `task-${t.id}`,
              title: t.title,
              description: `Task in ${t.clientName || 'General'}`,
              icon: Zap,
              category: 'Tasks',
              onSelect: () => router.push(`/dashboard/tasks/${t.id}`),
              meta: { url: `/dashboard/tasks/${t.id}` },
            }));

            const userResults: CommandItem[] = users.map((u) => ({
              id: `user-${u.id}`,
              title: u.fullName,
              description: u.email,
              icon: User,
              category: 'Users',
              onSelect: () =>
                router.push(`/dashboard/settings/members?userId=${u.id}`),
              meta: { url: `/dashboard/settings/members?userId=${u.id}` },
            }));

            setSearchResults([...taskResults, ...userResults]);
          }
        } catch (error) {
          console.error('Command search error:', error);
        } finally {
          setIsLoading(false);
        }
      }, 300),
    [router]
  );

  useEffect(() => {
    if (query) {
      setIsLoading(true);
      performSearch(query);
    } else {
      setSearchResults([]);
      setIsLoading(false);
    }
  }, [query, performSearch]);

  const filteredItems = useMemo(() => {
    const localItems = staticCommands.filter(
      (item) =>
        item.title.toLowerCase().includes(query.toLowerCase()) ||
        item.description?.toLowerCase().includes(query.toLowerCase())
    );

    const items = [...localItems, ...searchResults];

    // Add Recent items at the top if no query
    if (!query && recentItems.length > 0) {
      return [...recentItems, ...items];
    }

    return items;
  }, [query, staticCommands, searchResults, recentItems]);

  useEffect(() => {
    setSelectedIndex(0);
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 10);
    }
  }, [isOpen, query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) =>
        filteredItems.length === 0 ? 0 : (prev + 1) % filteredItems.length
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) =>
        filteredItems.length === 0
          ? 0
          : (prev - 1 + filteredItems.length) % filteredItems.length
      );
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const item = filteredItems[selectedIndex];
      if (item) {
        addToRecent(item);
        item.onSelect();
        close();
      }
    }
  };

  const handleItemSelect = useCallback(
    (item: CommandItem) => {
      addToRecent(item);
      item.onSelect();
      close();
    },
    [close, addToRecent]
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4 pointer-events-none">
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm pointer-events-auto animate-in fade-in duration-200"
        onClick={close}
      />

      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden pointer-events-auto animate-in slide-in-from-top-4 duration-300">
        <div className="flex items-center px-4 py-4 border-b border-slate-100">
          <Search className="w-5 h-5 text-slate-400 mr-3" />
          <input
            ref={inputRef}
            placeholder="Type a command or search..."
            className="flex-1 bg-transparent border-none outline-none text-slate-900 placeholder:text-slate-400 text-lg"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <div className="flex items-center gap-2">
            {isLoading && (
              <Loader2 className="w-4 h-4 text-primary-500 animate-spin" />
            )}
            <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-100 rounded text-[10px] font-bold text-slate-500">
              <span className="opacity-60">ESC</span>
            </div>
          </div>
        </div>

        <div className="max-h-[450px] overflow-y-auto p-2" ref={scrollRef}>
          {filteredItems.length === 0 && !isLoading ? (
            <div className="py-12 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-slate-50 rounded-full mb-3">
                <Search className="w-6 h-6 text-slate-300" />
              </div>
              <p className="text-slate-500 text-sm">
                No results found for "{query}"
              </p>
            </div>
          ) : (
            Object.entries(
              filteredItems.reduce(
                (acc, item) => {
                  const cat = item.category;
                  if (!acc[cat]) acc[cat] = [];
                  acc[cat].push(item);
                  return acc;
                },
                {} as Record<string, CommandItem[]>
              )
            ).map(([category, items]) => (
              <div key={category} className="mb-4 last:mb-0">
                <div className="flex items-center justify-between px-3 py-2">
                  <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    {category === 'Recent' ? 'Recently Used' : category}
                  </h3>
                </div>
                <div className="space-y-1">
                  {items.map((item) => {
                    const globalIdx = filteredItems.indexOf(item);
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleItemSelect(item)}
                        onMouseEnter={() => setSelectedIndex(globalIdx)}
                        className={cn(
                          'w-full flex items-center gap-4 px-3 py-3 rounded-xl transition-all text-left outline-none group',
                          globalIdx === selectedIndex
                            ? 'bg-blue-50 text-blue-900'
                            : 'hover:bg-slate-50 text-slate-600'
                        )}
                      >
                        <div
                          className={cn(
                            'p-2 rounded-lg',
                            globalIdx === selectedIndex
                              ? 'bg-white shadow-sm'
                              : 'bg-slate-100'
                          )}
                        >
                          <item.icon
                            className={cn(
                              'w-4 h-4',
                              globalIdx === selectedIndex
                                ? 'text-blue-600'
                                : 'text-slate-500'
                            )}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate">
                            {item.title}
                          </p>
                          {item.description && (
                            <p className="text-xs text-slate-500 truncate">
                              {item.description}
                            </p>
                          )}
                        </div>
                        {item.shortcut && (
                          <div className="hidden group-hover:block ml-auto px-1.5 py-0.5 border border-slate-200 rounded bg-white text-[10px] font-bold text-slate-400 uppercase">
                            {item.shortcut}
                          </div>
                        )}
                        <ArrowRight
                          className={cn(
                            'w-4 h-4 opacity-0 transition-opacity',
                            globalIdx === selectedIndex &&
                              'opacity-100 text-blue-400'
                          )}
                        />
                      </button>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
              <span className="p-1 bg-white border border-slate-200 rounded shadow-sm leading-none font-mono">
                ↓
              </span>
              <span className="p-1 bg-white border border-slate-200 rounded shadow-sm leading-none font-mono">
                ↑
              </span>
              <span>to navigate</span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
              <span className="p-1 bg-white border border-slate-200 rounded shadow-sm leading-none font-mono">
                ↵
              </span>
              <span>to select</span>
            </div>
          </div>
          <div className="text-[10px] text-blue-600 font-bold tracking-tight">
            VALIDIANT COMMAND
          </div>
        </div>
      </div>
    </div>
  );
};
