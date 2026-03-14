import { create } from 'zustand';

export type CommandMode = 'nav' | 'search' | 'action';

interface CommandPaletteState {
  isOpen: boolean;
  query: string;
  mode: CommandMode;
  open: (mode?: CommandMode) => void;
  close: () => void;
  toggle: () => void;
  setQuery: (query: string) => void;
  setMode: (mode: CommandMode) => void;
}

export const useCommandPaletteStore = create<CommandPaletteState>((set) => ({
  isOpen: false,
  query: '',
  mode: 'nav',
  open: (mode = 'nav') => set({ isOpen: true, mode, query: '' }),
  close: () => set({ isOpen: false, query: '' }),
  toggle: () => set((state) => ({ isOpen: !state.isOpen, query: '' })),
  setQuery: (query: string) => set({ query }),
  setMode: (mode: CommandMode) => set({ mode }),
}));
