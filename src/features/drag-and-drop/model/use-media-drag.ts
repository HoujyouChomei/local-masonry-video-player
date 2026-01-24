// src/features/drag-and-drop/model/use-media-drag.ts

import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useDragStore } from '@/shared/stores/drag-store';
import { useSelectionStore } from '@/shared/stores/selection-store';
import { api } from '@/shared/api';
import { Media } from '@/shared/schemas/media';

interface useMediaDragProps {
  mediaPath: string;
  mediaId: string;
}

export const useMediaDrag = ({ mediaPath, mediaId }: useMediaDragProps) => {
  const queryClient = useQueryClient();

  const handleDragStart = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();

      const { isSelectionMode, selectedMediaIds } = useSelectionStore.getState();
      const isSelected = selectedMediaIds.includes(mediaId);

      let dragPayloadPath: string | string[] = mediaPath;
      let dragPayloadId: string | string[] = mediaId;

      if (isSelectionMode && isSelected) {
        const allQueries = queryClient.getQueryCache().findAll();
        const allKnownMedia = new Map<string, string>();

        for (const query of allQueries) {
          const data = query.state.data;
          if (Array.isArray(data)) {
            for (const item of data) {
              if (item && typeof item === 'object' && 'id' in item && 'path' in item) {
                const m = item as Media;
                allKnownMedia.set(m.id, m.path);
              }
            }
          }
        }

        const paths = selectedMediaIds
          .map((id) => allKnownMedia.get(id))
          .filter((p): p is string => !!p);

        if (paths.length > 0) {
          dragPayloadPath = paths;
          dragPayloadId = selectedMediaIds;
        }
      }

      useDragStore.getState().setDraggedFilePath(dragPayloadPath);
      useDragStore.getState().setDraggedMediaId(dragPayloadId);

      api.system.startDrag(dragPayloadPath);
    },
    [mediaPath, mediaId, queryClient]
  );

  const handleDragEnd = useCallback(() => {
    useDragStore.getState().clearDrag();
  }, []);

  return { handleDragStart, handleDragEnd };
};
