// src/shared/stores/selection-store.ts

import { create } from 'zustand';
import { Media } from '@/shared/schemas/media';

interface SelectionState {
  isSelectionMode: boolean;
  selectedMediaIds: string[];
  lastSelectedMediaId: string | null;

  enterSelectionMode: (initialId?: string) => void;
  exitSelectionMode: () => void;
  toggleSelection: (id: string) => void;
  selectAll: (allIds: string[]) => void;
  clearSelection: () => void;
  selectRange: (targetId: string, allMedia: Media[]) => void;

  reset: () => void;
}

export const useSelectionStore = create<SelectionState>((set, get) => ({
  isSelectionMode: false,
  selectedMediaIds: [],
  lastSelectedMediaId: null,

  enterSelectionMode: (initialId) => {
    set({
      isSelectionMode: true,
      selectedMediaIds: initialId ? [initialId] : [],
      lastSelectedMediaId: initialId || null,
    });
  },

  exitSelectionMode: () => {
    set({
      isSelectionMode: false,
      selectedMediaIds: [],
      lastSelectedMediaId: null,
    });
  },

  toggleSelection: (id) => {
    const { selectedMediaIds } = get();
    const isSelected = selectedMediaIds.includes(id);
    let newSelectedIds: string[];

    if (isSelected) {
      newSelectedIds = selectedMediaIds.filter((vId) => vId !== id);
    } else {
      newSelectedIds = [...selectedMediaIds, id];
    }

    set({
      selectedMediaIds: newSelectedIds,
      lastSelectedMediaId: id,
    });
  },

  selectAll: (allIds) => {
    set({
      selectedMediaIds: allIds,
      lastSelectedMediaId: allIds.length > 0 ? allIds[allIds.length - 1] : null,
    });
  },

  clearSelection: () => {
    set({
      selectedMediaIds: [],
      lastSelectedMediaId: null,
    });
  },

  selectRange: (targetId, allMedia) => {
    const { lastSelectedMediaId, selectedMediaIds } = get();

    if (!lastSelectedMediaId) {
      get().toggleSelection(targetId);
      return;
    }

    const lastIndex = allMedia.findIndex((v) => v.id === lastSelectedMediaId);
    const targetIndex = allMedia.findIndex((v) => v.id === targetId);

    if (lastIndex === -1 || targetIndex === -1) return;

    const start = Math.min(lastIndex, targetIndex);
    const end = Math.max(lastIndex, targetIndex);

    const rangeIds = allMedia.slice(start, end + 1).map((v) => v.id);
    const mergedIds = Array.from(new Set([...selectedMediaIds, ...rangeIds]));

    set({
      selectedMediaIds: mergedIds,
      lastSelectedMediaId: targetId,
    });
  },

  reset: () => {
    set({
      isSelectionMode: false,
      selectedMediaIds: [],
      lastSelectedMediaId: null,
    });
  },
}));
