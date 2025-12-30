// src/shared/stores/drag-store.ts

import { create } from 'zustand';

interface DragState {
  // 文字列、文字列配列、またはnull
  draggedFilePath: string | string[] | null;

  setDraggedFilePath: (path: string | string[] | null) => void;
}

export const useDragStore = create<DragState>((set) => ({
  draggedFilePath: null,
  setDraggedFilePath: (path) => set({ draggedFilePath: path }),
}));
