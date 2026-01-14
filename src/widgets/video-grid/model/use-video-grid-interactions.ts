// src/widgets/video-grid/model/use-video-grid-interactions.ts

import { useState, useCallback, useRef, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useReorderPlaylist } from '@/entities/playlist/model/use-playlists';
import { useSaveFolderOrder } from '@/features/sort-videos/model/use-folder-order';
import { useUIStore } from '@/shared/stores/ui-store';
import { useSelectionStore } from '@/shared/stores/selection-store';
import { VideoFile } from '@/shared/types/video';
import { useIsMobile } from '@/shared/lib/use-is-mobile';

import { useDesktopInteractions } from './interactions/use-desktop-interactions';
import { useMobileInteractions } from './interactions/use-mobile-interactions';

export const useVideoGridInteractions = (folderPath: string, allSortedVideos: VideoFile[]) => {
  const isMobile = useIsMobile();
  const queryClient = useQueryClient();

  const selectedPlaylistId = useUIStore((s) => s.selectedPlaylistId);
  const isGlobalMode = useUIStore((s) => s.viewMode === 'all-favorites');
  const isPlaylistMode = useUIStore((s) => s.viewMode === 'playlist');
  const isTagMode = useUIStore((s) => s.viewMode === 'tag-results');
  const isSelectionMode = useSelectionStore((s) => s.isSelectionMode);

  const { mutate: reorderPlaylist } = useReorderPlaylist();
  const { mutate: saveFolderOrder } = useSaveFolderOrder();

  const [videoToRename, setVideoToRename] = useState<VideoFile | null>(null);

  const videosRef = useRef(allSortedVideos);
  useEffect(() => {
    videosRef.current = allSortedVideos;
  }, [allSortedVideos]);

  const desktopInteractions = useDesktopInteractions({ videosRef });
  const mobileInteractions = useMobileInteractions({ videosRef });

  const activeInteractions = isMobile ? mobileInteractions : desktopInteractions;

  const handleReorder = useCallback(
    (newOrder: VideoFile[]) => {
      if (isGlobalMode || isTagMode || isSelectionMode) return;

      if (isPlaylistMode && selectedPlaylistId) {
        const newIds = newOrder.map((v) => v.id);
        reorderPlaylist({ playlistId: selectedPlaylistId, newVideoIds: newIds });
        queryClient.setQueryData(['playlist-videos', selectedPlaylistId], newOrder);
      } else if (!isPlaylistMode) {
        const newPaths = newOrder.map((v) => v.path);
        saveFolderOrder({ folderPath, videoPaths: newPaths });
        queryClient.setQueryData(['folder-order', folderPath], newPaths);
      }
    },
    [
      isPlaylistMode,
      selectedPlaylistId,
      isGlobalMode,
      isTagMode,
      isSelectionMode,
      folderPath,
      reorderPlaylist,
      saveFolderOrder,
      queryClient,
    ]
  );

  const handleRenameClose = useCallback(() => {
    setVideoToRename(null);
  }, []);

  return {
    videoToRename,
    setVideoToRename,
    handleRenameClose,
    handleReorder,

    handleDragStart: activeInteractions.handleDragStart,
    handleVideoClick: activeInteractions.handleVideoClick,
    handlePointerDown: activeInteractions.handlePointerDown,
    handlePointerMove: activeInteractions.handlePointerMove,
    handlePointerUp: activeInteractions.handlePointerUp,
    handlePointerLeave: activeInteractions.handlePointerLeave,
  };
};
