// src/entities/media/model/use-media-card-logic.ts

import { useState, useCallback, useRef } from 'react';
import { useInView } from 'react-intersection-observer';
import { useSettingsStore } from '@/shared/stores/settings-store';
import { useUIStore } from '@/shared/stores/ui-store';
import { useSelectionStore } from '@/shared/stores/selection-store';
import { Media } from '@/shared/schemas/media';
import { useDynamicRootMargin } from '@/shared/lib/use-dynamic-root-margin';

interface UseMediaCardLogicProps {
  media: Media;
  onDragStart?: (e: React.DragEvent) => void;
  onDragEnd?: (e: React.DragEvent) => void;
}

export const useMediaCardLogic = ({ media, onDragStart, onDragEnd }: UseMediaCardLogicProps) => {
  const initialAspectRatio = media.width && media.height ? media.width / media.height : undefined;

  const [aspectRatio, setAspectRatio] = useState<number | undefined>(initialAspectRatio);
  const [isHoveredState, setIsHoveredState] = useState(false);

  const playOnHoverOnly = useSettingsStore((state) => state.playOnHoverOnly);
  const enableLargeVideoRestriction = useSettingsStore(
    (state) => state.enableLargeVideoRestriction
  );
  const largeVideoThreshold = useSettingsStore((state) => state.largeVideoThreshold);

  const isMobile = useUIStore((s) => s.isMobile);

  const isSelectionMode = useSelectionStore((s) => s.isSelectionMode);
  const enterSelectionMode = useSelectionStore((s) => s.enterSelectionMode);
  const exitSelectionMode = useSelectionStore((s) => s.exitSelectionMode);

  const isHeavy = enableLargeVideoRestriction && media.size > largeVideoThreshold * 1024 * 1024;
  const shouldTrackHover = playOnHoverOnly || isHeavy;

  const rootMargin = useDynamicRootMargin();

  const elementRef = useRef<HTMLDivElement>(null);

  const { ref: inViewRef, inView } = useInView({
    threshold: 0,
    triggerOnce: false,
    rootMargin: rootMargin,
  });

  const setRefs = useCallback(
    (node: HTMLDivElement | null) => {
      inViewRef(node);
      elementRef.current = node;
    },
    [inViewRef]
  );

  const handleMouseEnter = useCallback(() => {
    setIsHoveredState(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsHoveredState(false);
  }, []);

  const handleMenuOpenChange = useCallback(
    (open: boolean) => {
      if (open && isMobile) {
        if (isSelectionMode) {
          exitSelectionMode();
        } else {
          enterSelectionMode(media.id);
        }

        if (navigator.vibrate) {
          navigator.vibrate(50);
        }
      }
    },
    [isMobile, isSelectionMode, enterSelectionMode, exitSelectionMode, media.id]
  );

  return {
    aspectRatio,
    setAspectRatio,
    isHoveredState,
    shouldTrackHover,
    isMobile,
    isSelectionMode,
    inView,
    elementRef,
    setRefs,
    handleDragStart: onDragStart,
    handleDragEnd: onDragEnd,
    handleMouseEnter,
    handleMouseLeave,
    handleMenuOpenChange,
  };
};
