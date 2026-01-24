// src/widgets/media-player/model/use-player-controls.ts

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Media } from '@/shared/schemas/media';
import { useHotkeys } from '@/shared/lib/use-hotkeys';

interface UsePlayerControlsProps {
  isOpen: boolean;
  selectedMedia: Media | null;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  isFullscreen: boolean;
  playNext: () => void;
  playPrev: () => void;
  togglePlay: () => void;
  closeMedia: () => void;
  toggleFullscreen: () => void;
  toggleInfoPanel: () => void;
}

export const usePlayerControls = ({
  isOpen,
  selectedMedia,
  videoRef,
  isFullscreen,
  playNext,
  playPrev,
  togglePlay,
  closeMedia,
  toggleFullscreen,
  toggleInfoPanel,
}: UsePlayerControlsProps) => {
  const [showControls, setShowControls] = useState(false);

  const [prevMediaId, setPrevMediaId] = useState<string | null>(null);

  const interactionLockRef = useRef<number>(0);
  const scrollLockRef = useRef<number>(0);

  if (selectedMedia && selectedMedia.id !== prevMediaId) {
    setPrevMediaId(selectedMedia.id);
    setShowControls(false);
  }

  useEffect(() => {
    if (selectedMedia?.id) {
      interactionLockRef.current = Date.now() + 1000;
    }
  }, [selectedMedia?.id]);

  const handleMouseMove = useCallback(() => {
    if (Date.now() < interactionLockRef.current) return;
    setShowControls((prev) => (prev ? prev : true));
  }, []);

  const handleMouseLeave = useCallback(() => {
    setShowControls(false);
  }, []);

  const handleContextMenu = useCallback(() => {
    setShowControls(false);
    interactionLockRef.current = Date.now() + 500;
  }, []);

  const handleMediaClick = useCallback(
    (e: React.MouseEvent<HTMLVideoElement>) => {
      if (!videoRef.current) return;

      if (showControls) {
        const rect = videoRef.current.getBoundingClientRect();
        const clickY = e.clientY - rect.top;
        const bottomThreshold = rect.height - 60;
        if (clickY > bottomThreshold) return;
      }

      togglePlay();
    },
    [showControls, togglePlay, videoRef]
  );

  const handleDoubleClick = useCallback(() => {
    toggleFullscreen();
  }, [toggleFullscreen]);

  const options = { enabled: isOpen, preventDefault: true };

  useHotkeys('arrowright', playNext, options);
  useHotkeys('arrowleft', playPrev, options);
  useHotkeys('space', togglePlay, options);
  useHotkeys('f', toggleFullscreen, options);
  useHotkeys('i', toggleInfoPanel, options);

  useHotkeys(
    'escape',
    () => {
      if (isFullscreen) {
        toggleFullscreen();
      } else {
        closeMedia();
      }
    },
    options
  );

  useEffect(() => {
    if (!isOpen) return;

    const handleWheel = (e: WheelEvent) => {
      const target = e.target as HTMLElement;
      if (target instanceof Element && target.closest('[data-no-wheel-nav="true"]')) {
        return;
      }

      const now = Date.now();
      if (now < scrollLockRef.current) return;
      if (Math.abs(e.deltaY) < 30) return;

      if (e.deltaY > 0) playNext();
      else playPrev();

      scrollLockRef.current = now + 200;
    };

    window.addEventListener('wheel', handleWheel, { passive: true });
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('wheel', handleWheel);
      document.body.style.overflow = '';
    };
  }, [isOpen, playNext, playPrev]);

  return useMemo(
    () => ({
      showControls,
      handleMouseMove,
      handleMouseLeave,
      handleContextMenu,
      handleMediaClick,
      handleDoubleClick,
    }),
    [
      showControls,
      handleMouseMove,
      handleMouseLeave,
      handleContextMenu,
      handleMediaClick,
      handleDoubleClick,
    ]
  );
};
