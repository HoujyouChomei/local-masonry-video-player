// src/widgets/media-player/model/use-fullscreen.ts

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { api } from '@/shared/api';

export const useFullscreen = (isOpen: boolean) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const isFullscreenRef = useRef(false);

  const toggleFullscreen = useCallback(() => {
    setIsFullscreen((prev) => {
      const next = !prev;
      isFullscreenRef.current = next;
      api.system.setFullScreen(next);
      return next;
    });
  }, []);

  useEffect(() => {
    if (!isOpen && isFullscreen) {
      api.system.setFullScreen(false);
      setTimeout(() => {
        setIsFullscreen(false);
        isFullscreenRef.current = false;
      }, 0);
    }
  }, [isOpen, isFullscreen]);

  useEffect(() => {
    return () => {
      if (isFullscreenRef.current) {
        api.system.setFullScreen(false);
      }
    };
  }, []);

  return useMemo(
    () => ({
      isFullscreen,
      toggleFullscreen,
    }),
    [isFullscreen, toggleFullscreen]
  );
};