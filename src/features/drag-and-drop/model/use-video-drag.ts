import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useDragStore } from '@/shared/stores/drag-store';
import { useSelectionStore } from '@/shared/stores/selection-store';
import { startDragApi } from '@/shared/api/electron';

interface UseVideoDragProps {
  videoPath: string;
  videoId: string;
}

export const useVideoDrag = ({ videoPath, videoId }: UseVideoDragProps) => {
  const queryClient = useQueryClient();

  const handleDragStart = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();

      const { isSelectionMode, selectedVideoIds } = useSelectionStore.getState();
      const isSelected = selectedVideoIds.includes(videoId);

      let dragPayloadPath: string | string[] = videoPath;
      let dragPayloadId: string | string[] = videoId;

      if (isSelectionMode && isSelected) {
        const allQueries = queryClient.getQueryCache().findAll();
        const allKnownVideos = new Map<string, string>();

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

        const paths = selectedVideoIds
          .map((id) => allKnownVideos.get(id))
          .filter((p): p is string => !!p);

        if (paths.length > 0) {
          dragPayloadPath = paths;
          dragPayloadId = selectedVideoIds;
        }
      }

      useDragStore.getState().setDraggedFilePath(dragPayloadPath);
      useDragStore.getState().setDraggedVideoId(dragPayloadId);

      startDragApi(dragPayloadPath);
    },
    [videoPath, videoId, queryClient]
  );

  const handleDragEnd = useCallback(() => {
    useDragStore.getState().clearDrag();
  }, []);

  return { handleDragStart, handleDragEnd };
};
