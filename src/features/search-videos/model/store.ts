// src/features/search-videos/model/store.ts

import { create } from 'zustand';

interface SearchState {
  // 入力中の生のテキスト
  query: string;
  // 実際に検索に使用する確定テキスト (Global検索でのAPIリクエスト用)
  debouncedQuery: string;

  // 検索範囲: 現在のフォルダ(JS) か ライブラリ全体(SQL) か
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
