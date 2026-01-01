import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useDragStore } from '@/shared/stores/drag-store';
import { useSelectionStore } from '@/shared/stores/selection-store';
// ▼▼▼ 追加 ▼▼▼
import { startDragApi } from '@/shared/api/electron';

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

      let dragPayloadPath: string | string[] = videoPath;
      let dragPayloadId: string | string[] = videoId; // IDも用意

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
        // IDは selectedVideoIds そのまま
        const paths = selectedVideoIds
          .map((id) => allKnownVideos.get(id))
          .filter((p): p is string => !!p);

        if (paths.length > 0) {
          dragPayloadPath = paths;
          dragPayloadId = selectedVideoIds; // 選択されたIDリスト
        }
      }

      // アプリ内ドロップ用にPathとID両方をセット
      useDragStore.getState().setDraggedFilePath(dragPayloadPath);
      useDragStore.getState().setDraggedVideoId(dragPayloadId);

      // OSネイティブのドラッグを開始（外部アプリへのドロップ用）
      // ▼▼▼ 修正: window.electron -> startDragApi ▼▼▼
      startDragApi(dragPayloadPath);
    },
    [videoPath, videoId, queryClient]
  );

  const handleDragEnd = useCallback(() => {
    // ドラッグ終了時にストアをリセット
    useDragStore.getState().clearDrag();
  }, []);

  return { handleDragStart, handleDragEnd };
};