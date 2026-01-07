// src/widgets/video-grid/model/interactions/use-desktop-interactions.ts

import { useCallback, useRef } from 'react';
import { VideoFile } from '@/shared/types/video';
import { useSelectionStore } from '@/shared/stores/selection-store';
import { useVideoPlayerStore } from '@/features/video-player/model/store';

interface UseDesktopInteractionsProps {
  videosRef: React.RefObject<VideoFile[]>;
}

export const useDesktopInteractions = ({ videosRef }: UseDesktopInteractionsProps) => {
  const { openVideo } = useVideoPlayerStore();
  const { isSelectionMode, enterSelectionMode, exitSelectionMode, toggleSelection, selectRange } =
    useSelectionStore();

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
      // 左クリックのみ対象
      if (!e.isPrimary || e.button !== 0) return;

      isLongPressTriggeredRef.current = false;
      pointerDownPosRef.current = { x: e.clientX, y: e.clientY };

      longPressTimerRef.current = setTimeout(() => {
        isLongPressTriggeredRef.current = true;

        // ロングプレス時の挙動: 選択モードの切り替え
        if (useSelectionStore.getState().isSelectionMode) {
          exitSelectionMode();
        } else {
          enterSelectionMode(video.id);
        }
      }, LONG_PRESS_DURATION);
    },
    [enterSelectionMode, exitSelectionMode]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!longPressTimerRef.current || !pointerDownPosRef.current) return;

      const dx = Math.abs(e.clientX - pointerDownPosRef.current.x);
      const dy = Math.abs(e.clientY - pointerDownPosRef.current.y);

      // 一定以上動いたらロングプレス判定をキャンセル（ドラッグ操作とみなす）
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

  const handleVideoClick = useCallback(
    (video: VideoFile, e: React.MouseEvent) => {
      // ロングプレスが発火済みの場合はクリックイベントを無視
      if (isLongPressTriggeredRef.current) {
        isLongPressTriggeredRef.current = false;
        e.preventDefault();
        e.stopPropagation();
        return;
      }

      const currentVideos = videosRef.current || [];

      if (isSelectionMode) {
        if (e.shiftKey) {
          selectRange(video.id, currentVideos);
        } else {
          toggleSelection(video.id);
        }
      } else {
        if (e.ctrlKey || e.metaKey) {
          enterSelectionMode(video.id);
        } else {
          openVideo(video, currentVideos);
        }
      }
    },
    [isSelectionMode, toggleSelection, selectRange, enterSelectionMode, openVideo, videosRef]
  );

  return {
    handleVideoClick,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handlePointerLeave,
  };
};
