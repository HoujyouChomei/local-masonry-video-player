// src/widgets/video-player/model/use-fullscreen.ts

import { useState, useCallback, useEffect, useRef } from 'react';
import { setFullScreenApi } from '@/shared/api/electron';

export const useFullscreen = (isOpen: boolean) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  // リスナー内で最新の状態を参照するためのRef
  const isFullscreenRef = useRef(false);

  const toggleFullscreen = useCallback(() => {
    setIsFullscreen((prev) => {
      const next = !prev;
      isFullscreenRef.current = next;
      setFullScreenApi(next);
      return next;
    });
  }, []);

  // モーダルが閉じたときにフルスクリーンを解除する
  useEffect(() => {
    if (!isOpen && isFullscreenRef.current) {
      setFullScreenApi(false);
      setIsFullscreen(false);
      isFullscreenRef.current = false;
    }
  }, [isOpen]);

  // アンマウント時のクリーンアップ
  useEffect(() => {
    return () => {
      if (isFullscreenRef.current) {
        setFullScreenApi(false);
      }
    };
  }, []);

  return {
    isFullscreen,
    toggleFullscreen,
  };
};
