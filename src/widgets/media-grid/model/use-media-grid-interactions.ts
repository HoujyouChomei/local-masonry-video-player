// src/widgets/media-grid/model/use-media-grid-interactions.ts

import { useState, useCallback, useRef, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useReorderPlaylist } from '@/entities/playlist/model/use-playlists';
import { useSaveFolderOrder } from '@/features/sort-media/model/use-folder-order';
import { useUIStore } from '@/shared/stores/ui-store';
import { useSelectionStore } from '@/shared/stores/selection-store';
import { Media } from '@/shared/schemas/media';
import { useIsMobile } from '@/shared/lib/use-is-mobile';

import { useDesktopInteractions } from './interactions/use-desktop-interactions';
import { useMobileInteractions } from './interactions/use-mobile-interactions';

export const useMediaGridInteractions = (folderPath: string, allSortedMedia: Media[]) => {
  const isMobile = useIsMobile();
  const queryClient = useQueryClient();

  const selectedPlaylistId = useUIStore((s) => s.selectedPlaylistId);
  const isGlobalMode = useUIStore((s) => s.viewMode === 'all-favorites');
  const isPlaylistMode = useUIStore((s) => s.viewMode === 'playlist');
  const isTagMode = useUIStore((s) => s.viewMode === 'tag-results');
  const isSelectionMode = useSelectionStore((s) => s.isSelectionMode);

  const { mutate: reorderPlaylist } = useReorderPlaylist();
  const { mutate: saveFolderOrder } = useSaveFolderOrder();

  const [mediaToRename, setMediaToRename] = useState<Media | null>(null);

  const mediaItemsRef = useRef(allSortedMedia);
  useEffect(() => {
    mediaItemsRef.current = allSortedMedia;
  }, [allSortedMedia]);

  const desktopInteractions = useDesktopInteractions({ mediaItemsRef });
  const mobileInteractions = useMobileInteractions({ mediaItemsRef });

  const activeInteractions = isMobile ? mobileInteractions : desktopInteractions;

  const handleReorder = useCallback(
    (newOrder: Media[]) => {
      if (isGlobalMode || isTagMode || isSelectionMode) return;

      if (isPlaylistMode && selectedPlaylistId) {
        const newIds = newOrder.map((v) => v.id);
        reorderPlaylist({ playlistId: selectedPlaylistId, newMediaIds: newIds });
        queryClient.setQueryData(['playlist-media', selectedPlaylistId], newOrder);
      } else if (!isPlaylistMode) {
        const newPaths = newOrder.map((v) => v.path);
        saveFolderOrder({ folderPath, mediaPaths: newPaths });
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
    setMediaToRename(null);
  }, []);

  return {
    mediaToRename: mediaToRename,
    setMediaToRename: setMediaToRename,
    handleRenameClose,
    handleReorder,

    handleDragStart: activeInteractions.handleDragStart,
    handleMediaClick: activeInteractions.handleMediaClick,
    handlePointerDown: activeInteractions.handlePointerDown,
    handlePointerMove: activeInteractions.handlePointerMove,
    handlePointerUp: activeInteractions.handlePointerUp,
    handlePointerLeave: activeInteractions.handlePointerLeave,
  };
};
