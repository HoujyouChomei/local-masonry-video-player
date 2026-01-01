// src/shared/stores/drag-store.ts

import { create } from 'zustand';

interface DragState {
  // OSドラッグ用 (ファイルパス)
  draggedFilePath: string | string[] | null;
  // アプリ内ドラッグ用 (ビデオID) - 追加
  draggedVideoId: string | string[] | null;

  setDraggedFilePath: (path: string | string[] | null) => void;
  setDraggedVideoId: (id: string | string[] | null) => void;
  clearDrag: () => void;
}

export const useDragStore = create<DragState>((set) => ({
  draggedFilePath: null,
  draggedVideoId: null,

  setDraggedFilePath: (path) => set({ draggedFilePath: path }),
  setDraggedVideoId: (id) => set({ draggedVideoId: id }),
  
  clearDrag: () => set({ draggedFilePath: null, draggedVideoId: null }),
}));