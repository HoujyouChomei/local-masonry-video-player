// src/widgets/media-grid/model/interactions/use-mobile-interactions.ts

import { useCallback } from 'react';
import { Media } from '@/shared/schemas/media';
import { useSelectionStore } from '@/shared/stores/selection-store';
import { useMediaPlayerStore } from '@/entities/player/model/store';

interface UseMobileInteractionsProps {
  mediaItemsRef: React.RefObject<Media[]>;
}

export const useMobileInteractions = ({ mediaItemsRef }: UseMobileInteractionsProps) => {
  const { openMedia } = useMediaPlayerStore();
  const { isSelectionMode, toggleSelection } = useSelectionStore();

  const noop = useCallback(() => {}, []);

  const handleMediaClick = useCallback(
    (media: Media, e: React.MouseEvent) => {
      e.stopPropagation();

      const currentMediaItems = mediaItemsRef.current || [];

      if (isSelectionMode) {
        toggleSelection(media.id);
      } else {
        openMedia(media, currentMediaItems);
      }
    },
    [isSelectionMode, toggleSelection, openMedia, mediaItemsRef]
  );

  return {
    handleMediaClick,
    handlePointerDown: noop,
    handlePointerMove: noop,
    handlePointerUp: noop,
    handlePointerLeave: noop,
    handleDragStart: noop,
  };
};
