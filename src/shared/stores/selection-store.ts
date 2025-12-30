// src/shared/stores/selection-store.ts

import { create } from 'zustand';
import { VideoFile } from '@/shared/types/video';

interface SelectionState {
  isSelectionMode: boolean;
  selectedVideoIds: string[];
  lastSelectedVideoId: string | null; // Shift範囲選択用

  // Actions
  enterSelectionMode: (initialId?: string) => void;
  exitSelectionMode: () => void;
  toggleSelection: (id: string) => void;
  selectAll: (allIds: string[]) => void;
  clearSelection: () => void; // 選択解除のみ（モード維持）
  selectRange: (targetId: string, allVideos: VideoFile[]) => void;

  // 完全リセット（モードも解除。View切り替え時などに使用）
  reset: () => void;
}

export const useSelectionStore = create<SelectionState>((set, get) => ({
  isSelectionMode: false,
  selectedVideoIds: [],
  lastSelectedVideoId: null,

  enterSelectionMode: (initialId) => {
    set({
      isSelectionMode: true,
      selectedVideoIds: initialId ? [initialId] : [],
      lastSelectedVideoId: initialId || null,
    });
  },

  exitSelectionMode: () => {
    set({
      isSelectionMode: false,
      selectedVideoIds: [],
      lastSelectedVideoId: null,
    });
  },

  toggleSelection: (id) => {
    const { selectedVideoIds } = get();
    const isSelected = selectedVideoIds.includes(id);
    let newSelectedIds: string[];

    if (isSelected) {
      newSelectedIds = selectedVideoIds.filter((vId) => vId !== id);
    } else {
      newSelectedIds = [...selectedVideoIds, id];
    }

    set({
      selectedVideoIds: newSelectedIds,
      lastSelectedVideoId: id,
    });
  },

  selectAll: (allIds) => {
    set({
      selectedVideoIds: allIds,
      lastSelectedVideoId: allIds.length > 0 ? allIds[allIds.length - 1] : null,
    });
  },

  clearSelection: () => {
    set({
      selectedVideoIds: [],
      lastSelectedVideoId: null,
    });
  },

  selectRange: (targetId, allVideos) => {
    const { lastSelectedVideoId, selectedVideoIds } = get();

    if (!lastSelectedVideoId) {
      get().toggleSelection(targetId);
      return;
    }

    const lastIndex = allVideos.findIndex((v) => v.id === lastSelectedVideoId);
    const targetIndex = allVideos.findIndex((v) => v.id === targetId);

    if (lastIndex === -1 || targetIndex === -1) return;

    const start = Math.min(lastIndex, targetIndex);
    const end = Math.max(lastIndex, targetIndex);

    const rangeIds = allVideos.slice(start, end + 1).map((v) => v.id);
    const mergedIds = Array.from(new Set([...selectedVideoIds, ...rangeIds]));

    set({
      selectedVideoIds: mergedIds,
      lastSelectedVideoId: targetId,
    });
  },

  reset: () => {
    set({
      isSelectionMode: false,
      selectedVideoIds: [],
      lastSelectedVideoId: null,
    });
  },
}));
