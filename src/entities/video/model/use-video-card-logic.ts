// src/entities/video/model/use-video-card-logic.ts

import { useState, useCallback, useMemo, useRef } from 'react';
import { useInView } from 'react-intersection-observer';
import { useSettingsStore } from '@/shared/stores/settings-store';
import { useUIStore } from '@/shared/stores/ui-store';
import { useSelectionStore } from '@/shared/stores/selection-store';
import { useIsMobile } from '@/shared/lib/use-is-mobile';
import { VideoFile } from '@/shared/types/video';

interface UseVideoCardLogicProps {
  video: VideoFile;
  onDragStart?: (e: React.DragEvent) => void;
  onDragEnd?: (e: React.DragEvent) => void;
}

export const useVideoCardLogic = ({ video, onDragStart, onDragEnd }: UseVideoCardLogicProps) => {
  const initialAspectRatio = video.width && video.height ? video.width / video.height : undefined;

  const [aspectRatio, setAspectRatio] = useState<number | undefined>(initialAspectRatio);
  const [isHoveredState, setIsHoveredState] = useState(false);

  const settingsRootMargin = useSettingsStore((state) => state.rootMargin);
  const scrollDirection = useUIStore((state) => state.scrollDirection);
  const playOnHoverOnly = useSettingsStore((state) => state.playOnHoverOnly);
  const enableLargeVideoRestriction = useSettingsStore(
    (state) => state.enableLargeVideoRestriction
  );
  const largeVideoThreshold = useSettingsStore((state) => state.largeVideoThreshold);

  const isMobile = useIsMobile();
  const { isSelectionMode, enterSelectionMode, exitSelectionMode } = useSelectionStore();

  const isHeavy = enableLargeVideoRestriction && video.size > largeVideoThreshold * 1024 * 1024;
  const shouldTrackHover = playOnHoverOnly || isHeavy;

  const FIXED_BUFFER = 150;

  const rootMargin = useMemo(() => {
    if (scrollDirection === 'down') {
      return `${FIXED_BUFFER}px 0px ${settingsRootMargin}px 0px`;
    } else if (scrollDirection === 'up') {
      return `${settingsRootMargin}px 0px ${FIXED_BUFFER}px 0px`;
    }
    return `${settingsRootMargin}px 0px ${settingsRootMargin}px 0px`;
  }, [scrollDirection, settingsRootMargin]);

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
          enterSelectionMode(video.id);
        }

        if (navigator.vibrate) {
          navigator.vibrate(50);
        }
      }
    },
    [isMobile, isSelectionMode, enterSelectionMode, exitSelectionMode, video.id]
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
