// src/shared/stores/ui-store.ts

import { create } from 'zustand';
import { useSelectionStore } from './selection-store'; // 追加

interface UIState {
  showFavoritesOnly: boolean;
  viewMode: 'folder' | 'all-favorites' | 'playlist' | 'tag-results';
  selectedPlaylistId: string | null;
  editingPlaylistId: string | null;

  selectedTagIds: string[];
  isTagGlobalScope: boolean;
  isTagsSectionExpanded: boolean;

  isHeaderVisible: boolean;
  scrollDirection: 'down' | 'up' | 'none';

  // --- Actions ---
  toggleShowFavoritesOnly: () => void;
  setViewMode: (mode: 'folder' | 'all-favorites' | 'playlist' | 'tag-results') => void;
  selectPlaylist: (id: string) => void;

  toggleSelectTag: (id: string) => void;
  clearSelectedTags: () => void;

  toggleTagGlobalScope: () => void;
  toggleTagsSection: () => void;

  setEditingPlaylistId: (id: string | null) => void;
  setHeaderVisible: (isVisible: boolean) => void;
  setScrollDirection: (direction: 'down' | 'up' | 'none') => void;

  resetView: () => void;
}

export const useUIStore = create<UIState>((set, get) => ({
  showFavoritesOnly: false,
  viewMode: 'folder',
  selectedPlaylistId: null,
  editingPlaylistId: null,

  selectedTagIds: [],
  isTagGlobalScope: false,
  isTagsSectionExpanded: true,

  isHeaderVisible: true,
  scrollDirection: 'none',

  toggleShowFavoritesOnly: () => {
    set((state) => ({ showFavoritesOnly: !state.showFavoritesOnly }));
  },

  setViewMode: (mode) => {
    // 選択状態をリセット
    useSelectionStore.getState().reset();

    set({
      viewMode: mode,
      selectedPlaylistId: mode === 'playlist' ? undefined : null,
      selectedTagIds: mode === 'tag-results' ? get().selectedTagIds : [],
    });
  },

  selectPlaylist: (id) => {
    // 選択状態をリセット
    useSelectionStore.getState().reset();

    set({
      viewMode: 'playlist',
      selectedPlaylistId: id,
      selectedTagIds: [],
    });
  },

  toggleSelectTag: (id) => {
    const current = get().selectedTagIds;
    let next: string[];

    if (current.includes(id)) {
      next = current.filter((tagId) => tagId !== id);
    } else {
      next = [...current, id];
    }

    // タグ選択の変更時は選択状態をリセット
    useSelectionStore.getState().reset();

    if (next.length > 0) {
      set({
        viewMode: 'tag-results',
        selectedTagIds: next,
        selectedPlaylistId: null,
      });
    } else {
      set({
        viewMode: 'folder',
        selectedTagIds: [],
        selectedPlaylistId: null,
      });
    }
  },

  clearSelectedTags: () => {
    useSelectionStore.getState().reset();
    set({ selectedTagIds: [], viewMode: 'folder' });
  },

  toggleTagGlobalScope: () => {
    set((state) => ({ isTagGlobalScope: !state.isTagGlobalScope }));
  },

  toggleTagsSection: () => {
    set((state) => ({ isTagsSectionExpanded: !state.isTagsSectionExpanded }));
  },

  setEditingPlaylistId: (id) => {
    set({ editingPlaylistId: id });
  },

  setHeaderVisible: (isVisible) => {
    set({ isHeaderVisible: isVisible });
  },

  setScrollDirection: (direction) => {
    set({ scrollDirection: direction });
  },

  resetView: () => {
    useSelectionStore.getState().reset();

    set({
      viewMode: 'folder',
      selectedPlaylistId: null,
      selectedTagIds: [],
      showFavoritesOnly: false,
    });
  },
}));
