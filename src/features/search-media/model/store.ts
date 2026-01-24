// src/features/search-media/model/store.ts

import { create } from 'zustand';

interface SearchState {
  query: string;
  debouncedQuery: string;

  searchScope: 'folder' | 'global';

  setQuery: (query: string) => void;
  setDebouncedQuery: (query: string) => void;
  setSearchScope: (scope: 'folder' | 'global') => void;
  clearQuery: () => void;
}

export const useSearchStore = create<SearchState>((set) => ({
  query: '',
  debouncedQuery: '',
  searchScope: 'folder',

  setQuery: (query) => set({ query }),
  setDebouncedQuery: (query) => set({ debouncedQuery: query }),
  setSearchScope: (scope) => set({ searchScope: scope }),

  clearQuery: () => set({ query: '', debouncedQuery: '' }),
}));
