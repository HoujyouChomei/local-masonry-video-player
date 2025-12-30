import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useDragStore } from '@/shared/stores/drag-store';
import { useSelectionStore } from '@/shared/stores/selection-store';

interface UseVideoDragProps {
  videoPath: string;
  videoId: string;
}

export const useVideoDrag = ({ videoPath, videoId }: UseVideoDragProps) => {
  const queryClient = useQueryClient();

  const handleDragStart = useCallback(
    (e: React.DragEvent) => {
      // ElectronのstartDragを使用するためにデフォルトの挙動をキャンセル
      e.preventDefault();

      const { isSelectionMode, selectedVideoIds } = useSelectionStore.getState();
      const isSelected = selectedVideoIds.includes(videoId);

      let dragPayload: string | string[] = videoPath;

      // 選択モードかつ選択中のアイテムをドラッグした場合、選択されている全アイテムを対象にする
      if (isSelectionMode && isSelected) {
        const allQueries = queryClient.getQueryCache().findAll();
        const allKnownVideos = new Map<string, string>();

        // キャッシュされている全ての動画データを探索してIDとパスのマッピングを作成
        for (const query of allQueries) {
          const data = query.state.data;
          if (Array.isArray(data)) {
            for (const item of data) {
              if (item && typeof item === 'object' && 'id' in item && 'path' in item) {
                allKnownVideos.set(item.id as string, item.path as string);
              }
            }
          }
        }

        // 選択中のIDに対応するパスを収集
        const paths = selectedVideoIds
          .map((id) => allKnownVideos.get(id))
          .filter((p): p is string => !!p);

        if (paths.length > 0) {
          dragPayload = paths;
        }
      }

      // アプリ内ドロップ用（Sidebar等）にDragStoreへセット
      useDragStore.getState().setDraggedFilePath(dragPayload);

      // OSネイティブのドラッグを開始（外部アプリへのドロップ用）
      window.electron.startDrag(dragPayload);
    },
    [videoPath, videoId, queryClient]
  );

  const handleDragEnd = useCallback(() => {
    // ドラッグ終了時にストアをリセット
    useDragStore.getState().setDraggedFilePath(null);
  }, []);

  return { handleDragStart, handleDragEnd };
};
