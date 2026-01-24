// src/shared/stores/drag-store.ts

import { create } from 'zustand';

interface DragState {
  draggedFilePath: string | string[] | null;
  draggedMediaId: string | string[] | null;

  setDraggedFilePath: (path: string | string[] | null) => void;
  setDraggedMediaId: (id: string | string[] | null) => void;
  clearDrag: () => void;
}

export const useDragStore = create<DragState>((set) => ({
  draggedFilePath: null,
  draggedMediaId: null,

  setDraggedFilePath: (path) => set({ draggedFilePath: path }),
  setDraggedMediaId: (id) => set({ draggedMediaId: id }),

  clearDrag: () => set({ draggedFilePath: null, draggedMediaId: null }),
}));
