// src/widgets/sidebar/model/use-sidebar-drop.ts

import { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useSelectionStore } from '@/shared/stores/selection-store';
import { useDragStore } from '@/shared/stores/drag-store';
import { useBatchMove } from '@/features/batch-actions/model/use-batch-move';
import { useBatchPlaylist } from '@/features/batch-actions/model/use-batch-playlist';
import { toast } from 'sonner';
import { VideoFile } from '@/shared/types/video';
import { logger } from '@/shared/lib/logger';

type DropTargetType = 'playlist' | 'folder';

interface UseSidebarDropProps {
  type: DropTargetType;
  targetId: string;
  targetName: string;
}

export const useSidebarDrop = ({ type, targetId, targetName }: UseSidebarDropProps) => {
  const [isOver, setIsOver] = useState(false);
  const queryClient = useQueryClient();

  const { performMove } = useBatchMove();
  const { addToPlaylist } = useBatchPlaylist();

  const resolvePaths = useCallback((): string[] => {
    const { isSelectionMode, selectedVideoIds } = useSelectionStore.getState();

    if (isSelectionMode && selectedVideoIds.length > 0) {
      const allQueries = queryClient.getQueryCache().findAll();
      const allKnownVideos = new Map<string, string>();

      for (const query of allQueries) {
        const data = query.state.data;
        if (Array.isArray(data)) {
          for (const item of data) {
            if (item && typeof item === 'object' && 'id' in item && 'path' in item) {
              const v = item as VideoFile;
              allKnownVideos.set(v.id, v.path);
            }
          }
        }
      }
      return selectedVideoIds.map((id) => allKnownVideos.get(id)).filter((p): p is string => !!p);
    }

    const draggedPath = useDragStore.getState().draggedFilePath;
    if (!draggedPath) return [];
    return Array.isArray(draggedPath) ? draggedPath : [draggedPath];
  }, [queryClient]);

  const resolveIds = useCallback((): string[] => {
    const { isSelectionMode, selectedVideoIds } = useSelectionStore.getState();

    if (isSelectionMode && selectedVideoIds.length > 0) {
      return selectedVideoIds;
    }

    const draggedId = useDragStore.getState().draggedVideoId;
    if (!draggedId) return [];
    return Array.isArray(draggedId) ? draggedId : [draggedId];
  }, []);

  const onDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!isOver) setIsOver(true);
    },
    [isOver]
  );

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsOver(false);
  }, []);

  const onDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsOver(false);

      try {
        if (type === 'playlist') {
          const ids = resolveIds();
          if (ids.length === 0) return;

          addToPlaylist({ playlistId: targetId, videoIds: ids });
          toast.success(`Added ${ids.length} videos to "${targetName}"`);
        } else if (type === 'folder') {
          const paths = resolvePaths();
          if (paths.length === 0) return;

          if (paths.some((p) => p.startsWith(targetId))) {
            // return;
          }

          await performMove({ filePaths: paths, targetFolder: targetId });
        }
      } catch (error) {
        logger.error('Drop action failed:', error);
        toast.error('Failed to perform action');
      }
    },
    [resolveIds, resolvePaths, type, targetId, targetName, addToPlaylist, performMove]
  );

  return {
    isOver,
    dropProps: {
      onDragOver,
      onDragLeave,
      onDrop,
    },
  };
};
