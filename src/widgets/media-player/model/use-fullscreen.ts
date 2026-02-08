// src/widgets/media-player/model/use-fullscreen.ts

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { api } from '@/shared/api';

export const useFullscreen = (isOpen: boolean) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const isFullscreenRef = useRef(false);
  const canUseElectron = typeof window !== 'undefined' && !!window.electron;

  const toggleFullscreen = useCallback(() => {
    setIsFullscreen((prev) => {
      const next = !prev;
      isFullscreenRef.current = next;
      if (canUseElectron) {
        api.system.setFullScreen(next);
      }
      return next;
    });
  }, [canUseElectron]);

  useEffect(() => {
    if (!isOpen && isFullscreen) {
      if (canUseElectron) {
        api.system.setFullScreen(false);
      }
      setTimeout(() => {
        setIsFullscreen(false);
        isFullscreenRef.current = false;
      }, 0);
    }
  }, [isOpen, isFullscreen, canUseElectron]);

  useEffect(() => {
    return () => {
      if (isFullscreenRef.current) {
        if (canUseElectron) {
          api.system.setFullScreen(false);
        }
      }
    };
  }, [canUseElectron]);

  return useMemo(
    () => ({
      isFullscreen,
      toggleFullscreen,
    }),
    [isFullscreen, toggleFullscreen]
  );
};
