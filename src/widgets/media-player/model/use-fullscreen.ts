// src/widgets/media-player/model/use-fullscreen.ts

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { api } from '@/shared/api';

export const useFullscreen = (isOpen: boolean) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const isFullscreenRef = useRef(false);
  const canUseElectron = typeof window !== 'undefined' && !!window.electron;
  const isProd = import.meta.env.PROD;

  const toggleFullscreen = useCallback(() => {
    setIsFullscreen((prev) => {
      const next = !prev;
      isFullscreenRef.current = next;
      if (canUseElectron) {
        api.system.setFullScreen(next);
        // NOTE: In dev (StrictMode), state updaters can run twice, effectively issuing
        // an extra setFullScreen(true). To keep exe (PROD) behavior aligned with dev,
        // we intentionally duplicate the enable call only in PROD.
        if (isProd && next) {
          api.system.setFullScreen(true);
        }
      }
      return next;
    });
  }, [canUseElectron, isProd]);

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
