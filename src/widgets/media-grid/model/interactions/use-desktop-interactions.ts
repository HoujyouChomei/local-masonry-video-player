// src/widgets/media-grid/model/interactions/use-desktop-interactions.ts

import { useCallback, useRef } from 'react';
import { Media } from '@/shared/schemas/media';
import { useSelectionStore } from '@/shared/stores/selection-store';
import { useMediaPlayerStore } from '@/entities/player/model/store';

interface UseDesktopInteractionsProps {
  mediaItemsRef: React.RefObject<Media[]>;
}

export const useDesktopInteractions = ({ mediaItemsRef }: UseDesktopInteractionsProps) => {
  const { openMedia } = useMediaPlayerStore();
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
    (media: Media, e: React.PointerEvent) => {
      if (!e.isPrimary || e.button !== 0) return;

      isLongPressTriggeredRef.current = false;
      pointerDownPosRef.current = { x: e.clientX, y: e.clientY };

      longPressTimerRef.current = setTimeout(() => {
        isLongPressTriggeredRef.current = true;

        if (useSelectionStore.getState().isSelectionMode) {
          exitSelectionMode();
        } else {
          enterSelectionMode(media.id);
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

  const handleMediaClick = useCallback(
    (media: Media, e: React.MouseEvent) => {
      if (isLongPressTriggeredRef.current) {
        isLongPressTriggeredRef.current = false;
        e.preventDefault();
        e.stopPropagation();
        return;
      }

      const currentMediaItems = mediaItemsRef.current || [];

      if (isSelectionMode) {
        if (e.shiftKey) {
          selectRange(media.id, currentMediaItems);
        } else {
          toggleSelection(media.id);
        }
      } else {
        if (e.ctrlKey || e.metaKey) {
          enterSelectionMode(media.id);
        } else {
          openMedia(media, currentMediaItems);
        }
      }
    },
    [isSelectionMode, toggleSelection, selectRange, enterSelectionMode, openMedia, mediaItemsRef]
  );

  return {
    handleMediaClick,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handlePointerLeave,
    handleDragStart,
  };
};
