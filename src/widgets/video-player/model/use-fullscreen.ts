// src/widgets/video-player/model/use-fullscreen.ts

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { setFullScreenApi } from '@/shared/api/electron';

export const useFullscreen = (isOpen: boolean) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const isFullscreenRef = useRef(false);

  const toggleFullscreen = useCallback(() => {
    setIsFullscreen((prev) => {
      const next = !prev;
      isFullscreenRef.current = next;
      setFullScreenApi(next);
      return next;
    });
  }, []);

  useEffect(() => {
    if (!isOpen && isFullscreen) {
      setFullScreenApi(false);
      setTimeout(() => {
        setIsFullscreen(false);
        isFullscreenRef.current = false;
      }, 0);
    }
  }, [isOpen, isFullscreen]);

  useEffect(() => {
    return () => {
      if (isFullscreenRef.current) {
        setFullScreenApi(false);
      }
    };
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      const isDocFullscreen = !!document.fullscreenElement;
      if (isDocFullscreen !== isFullscreenRef.current) {
        setIsFullscreen(isDocFullscreen);
        isFullscreenRef.current = isDocFullscreen;
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
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
