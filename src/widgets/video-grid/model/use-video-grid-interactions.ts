// src/widgets/video-grid/model/use-video-grid-interactions.ts

import { useState, useCallback, useRef, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useVideoPlayerStore } from '@/features/video-player/model/store';
import { useReorderPlaylist } from '@/entities/playlist/model/use-playlists';
import { useSaveFolderOrder } from '@/features/sort-videos/model/use-folder-order';
import { useUIStore } from '@/shared/stores/ui-store';
import { useSelectionStore } from '@/shared/stores/selection-store';
import { VideoFile } from '@/shared/types/video';
import { useIsMobile } from '@/shared/lib/use-is-mobile'; // 追加

export const useVideoGridInteractions = (folderPath: string, allSortedVideos: VideoFile[]) => {
  const openVideo = useVideoPlayerStore((state) => state.openVideo);

  const selectedPlaylistId = useUIStore((s) => s.selectedPlaylistId);
  const isGlobalMode = useUIStore((s) => s.viewMode === 'all-favorites');
  const isPlaylistMode = useUIStore((s) => s.viewMode === 'playlist');
  const isTagMode = useUIStore((s) => s.viewMode === 'tag-results');

  const isSelectionMode = useSelectionStore((s) => s.isSelectionMode);
  const enterSelectionMode = useSelectionStore((s) => s.enterSelectionMode);
  const exitSelectionMode = useSelectionStore((s) => s.exitSelectionMode);
  const toggleSelection = useSelectionStore((s) => s.toggleSelection);
  const selectRange = useSelectionStore((s) => s.selectRange);

  const queryClient = useQueryClient();
  const { mutate: reorderPlaylist } = useReorderPlaylist();
  const { mutate: saveFolderOrder } = useSaveFolderOrder();

  const isMobile = useIsMobile(); // 追加

  const [videoToRename, setVideoToRename] = useState<VideoFile | null>(null);

  const videosRef = useRef(allSortedVideos);
  useEffect(() => {
    videosRef.current = allSortedVideos;
  }, [allSortedVideos]);

  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isLongPressTriggeredRef = useRef(false);
  const pointerDownPosRef = useRef<{ x: number; y: number } | null>(null);

  const LONG_PRESS_DURATION = 500;
  const DRAG_THRESHOLD = 10;

  const clearLongPressTimer = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    pointerDownPosRef.current = null;
  }, []);

  const handlePointerDown = useCallback(
    (video: VideoFile, e: React.PointerEvent) => {
      // ▼▼▼ 修正: モバイルの場合は自前のタイマー処理を行わない（ライブラリ標準に任せる） ▼▼▼
      if (isMobile) return;

      if (!e.isPrimary || e.button !== 0) return;

      isLongPressTriggeredRef.current = false;
      pointerDownPosRef.current = { x: e.clientX, y: e.clientY };

      longPressTimerRef.current = setTimeout(() => {
        isLongPressTriggeredRef.current = true;

        // PCでのロングプレス挙動
        if (useSelectionStore.getState().isSelectionMode) {
          exitSelectionMode();
        } else {
          enterSelectionMode(video.id);
        }
      }, LONG_PRESS_DURATION);
    },
    [isMobile, enterSelectionMode, exitSelectionMode] // 依存配列に追加
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!longPressTimerRef.current || !pointerDownPosRef.current) return;

      const dx = Math.abs(e.clientX - pointerDownPosRef.current.x);
      const dy = Math.abs(e.clientY - pointerDownPosRef.current.y);

      if (dx > DRAG_THRESHOLD || dy > DRAG_THRESHOLD) {
        clearLongPressTimer();
      }
    },
    [clearLongPressTimer]
  );

  const handlePointerUp = useCallback(() => {
    clearLongPressTimer();
  }, [clearLongPressTimer]);

  const handlePointerLeave = useCallback(() => {
    clearLongPressTimer();
  }, [clearLongPressTimer]);

  const handleDragStart = useCallback(() => {
    clearLongPressTimer();
  }, [clearLongPressTimer]);

  const handleVideoClick = useCallback(
    (video: VideoFile, e: React.MouseEvent) => {
      if (isLongPressTriggeredRef.current) {
        isLongPressTriggeredRef.current = false;
        e.preventDefault();
        e.stopPropagation();
        return;
      }

      if (isSelectionMode) {
        if (e.shiftKey) {
          selectRange(video.id, videosRef.current);
        } else {
          toggleSelection(video.id);
        }
      } else {
        if (e.ctrlKey || e.metaKey) {
          enterSelectionMode(video.id);
        } else {
          openVideo(video, videosRef.current);
        }
      }
    },
    [isSelectionMode, enterSelectionMode, toggleSelection, selectRange, openVideo]
  );

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
    handleVideoClick,
    handleReorder,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handlePointerLeave,
    handleDragStart,
  };
};
