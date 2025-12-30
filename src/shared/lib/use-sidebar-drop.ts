// src/shared/lib/use-sidebar-drop.ts

import { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useSelectionStore } from '@/shared/stores/selection-store';
import { useDragStore } from '@/shared/stores/drag-store';
import { useUIStore } from '@/shared/stores/ui-store';
import { useSettingsStore } from '@/shared/stores/settings-store';
import { useSearchStore } from '@/features/search-videos/model/store';
import { VideoFile } from '@/shared/types/video';
import { useBatchMove } from '@/features/batch-actions/model/use-batch-move';
import { useBatchPlaylist } from '@/features/batch-actions/model/use-batch-playlist';
import { toast } from 'sonner';

type DropTargetType = 'playlist' | 'folder';

interface UseSidebarDropProps {
  type: DropTargetType;
  targetId: string; // Playlist ID or Folder Path
  targetName: string; // For toast message
}

export const useSidebarDrop = ({ type, targetId, targetName }: UseSidebarDropProps) => {
  const [isOver, setIsOver] = useState(false);
  const queryClient = useQueryClient();

  const { performMove } = useBatchMove();
  const { addToPlaylist } = useBatchPlaylist();

  // Helper to resolve paths from IDs
  const resolvePaths = useCallback((): string[] => {
    const { isSelectionMode, selectedVideoIds } = useSelectionStore.getState();

    // 1. Selection Mode: Resolve paths from cached video data
    if (isSelectionMode && selectedVideoIds.length > 0) {
      const { viewMode, selectedPlaylistId, selectedTagIds } = useUIStore.getState();
      const { searchScope, debouncedQuery } = useSearchStore.getState();
      const folderPath = useSettingsStore.getState().folderPath;

      // Determine the current query key to fetch data from cache
      // (Logic mirrors useVideoSource)
      let queryKey: unknown[] = ['videos', folderPath];

      const isGlobalSearchScope = searchScope === 'global';
      const shouldExecuteGlobalSearch =
        isGlobalSearchScope && (debouncedQuery.length > 0 || selectedTagIds.length > 0);

      if (shouldExecuteGlobalSearch) {
        queryKey = ['global-search', debouncedQuery, selectedTagIds];
      } else if (viewMode === 'all-favorites') {
        queryKey = ['all-favorites-videos'];
      } else if (viewMode === 'playlist' && selectedPlaylistId) {
        queryKey = ['playlist-videos', selectedPlaylistId];
      } else if (viewMode === 'tag-results' && selectedTagIds.length > 0) {
        queryKey = ['tag-videos', selectedTagIds];
      }

      const cachedVideos = queryClient.getQueryData<VideoFile[]>(queryKey);

      if (!cachedVideos) return [];

      return cachedVideos.filter((v) => selectedVideoIds.includes(v.id)).map((v) => v.path);
    }

    // 2. Single Drag Mode: Get from DragStore
    const draggedPath = useDragStore.getState().draggedFilePath;

    // ▼▼▼ 修正: 配列かどうかの判定を追加して型エラーを解消 ▼▼▼
    if (!draggedPath) return [];
    return Array.isArray(draggedPath) ? draggedPath : [draggedPath];
  }, [queryClient]);

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

      const paths = resolvePaths();
      if (paths.length === 0) return;

      // Self-drop prevention (Folder)
      if (type === 'folder' && paths.some((p) => p.startsWith(targetId))) {
        // 簡易チェック
        // return;
      }

      try {
        if (type === 'playlist') {
          addToPlaylist({ playlistId: targetId, filePaths: paths });
          toast.success(`Added ${paths.length} videos to "${targetName}"`);
        } else if (type === 'folder') {
          await performMove({ filePaths: paths, targetFolder: targetId });
          toast.success(`Moved ${paths.length} videos to "${targetName}"`);
        }
      } catch (error) {
        console.error('Drop action failed:', error);
        toast.error('Failed to perform action');
      }
    },
    [resolvePaths, type, targetId, targetName, addToPlaylist, performMove]
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
