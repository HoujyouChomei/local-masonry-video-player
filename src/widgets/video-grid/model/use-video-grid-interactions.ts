// src/widgets/video-grid/model/use-video-grid-interactions.ts

import { useState, useCallback, useRef, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useReorderPlaylist } from '@/entities/playlist/model/use-playlists';
import { useSaveFolderOrder } from '@/features/sort-videos/model/use-folder-order';
import { useUIStore } from '@/shared/stores/ui-store';
import { useSelectionStore } from '@/shared/stores/selection-store';
import { VideoFile } from '@/shared/types/video';
import { useIsMobile } from '@/shared/lib/use-is-mobile';

// Sub Hooks
import { useDesktopInteractions } from './interactions/use-desktop-interactions';
import { useMobileInteractions } from './interactions/use-mobile-interactions';

export const useVideoGridInteractions = (folderPath: string, allSortedVideos: VideoFile[]) => {
  const isMobile = useIsMobile();
  const queryClient = useQueryClient();

  // Global States needed for reordering logic
  const selectedPlaylistId = useUIStore((s) => s.selectedPlaylistId);
  const isGlobalMode = useUIStore((s) => s.viewMode === 'all-favorites');
  const isPlaylistMode = useUIStore((s) => s.viewMode === 'playlist');
  const isTagMode = useUIStore((s) => s.viewMode === 'tag-results');
  const isSelectionMode = useSelectionStore((s) => s.isSelectionMode);

  // Mutations
  const { mutate: reorderPlaylist } = useReorderPlaylist();
  const { mutate: saveFolderOrder } = useSaveFolderOrder();

  // Local State
  const [videoToRename, setVideoToRename] = useState<VideoFile | null>(null);

  // 最新のビデオリストをRefで保持（イベントハンドラ内での参照用）
  const videosRef = useRef(allSortedVideos);
  useEffect(() => {
    videosRef.current = allSortedVideos;
  }, [allSortedVideos]);

  // --- Split Interactions ---
  const desktopInteractions = useDesktopInteractions({ videosRef });
  const mobileInteractions = useMobileInteractions({ videosRef });

  // 環境に応じてハンドラを選択
  const activeInteractions = isMobile ? mobileInteractions : desktopInteractions;

  // --- Common Logic (Reorder & Rename) ---

  const handleReorder = useCallback(
    (newOrder: VideoFile[]) => {
      if (isGlobalMode || isTagMode || isSelectionMode) return;

      if (isPlaylistMode && selectedPlaylistId) {
        const newIds = newOrder.map((v) => v.id);
        reorderPlaylist({ playlistId: selectedPlaylistId, newVideoIds: newIds });
        // 楽観的更新
        queryClient.setQueryData(['playlist-videos', selectedPlaylistId], newOrder);
      } else if (!isPlaylistMode) {
        const newPaths = newOrder.map((v) => v.path);
        saveFolderOrder({ folderPath, videoPaths: newPaths });
        // 楽観的更新
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

  const handleDragStart = useCallback(() => {
    // デスクトップの場合、ドラッグ開始時にロングプレス判定をキャンセルする必要がある
    if (!isMobile) {
      // desktopInteractions側で公開していない内部タイマーをクリアするのは難しいが、
      // PointerMove/Leaveでキャンセルされるため実用上は問題ない。
      // 必要であれば useDesktopInteractions に clearTimer を公開させる。
    }
  }, [isMobile]);

  return {
    // Common
    videoToRename,
    setVideoToRename,
    handleRenameClose,
    handleReorder,
    handleDragStart,

    // Environment Specific Handlers
    handleVideoClick: activeInteractions.handleVideoClick,
    handlePointerDown: activeInteractions.handlePointerDown,
    handlePointerMove: activeInteractions.handlePointerMove,
    handlePointerUp: activeInteractions.handlePointerUp,
    handlePointerLeave: activeInteractions.handlePointerLeave,
  };
};
