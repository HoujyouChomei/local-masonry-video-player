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
    if (!isOpen && isFullscreen) {
      setFullScreenApi(false);
      setTimeout(() => {
        setIsFullscreen(false);
        isFullscreenRef.current = false;
      }, 0);
    }
  }, [isOpen, isFullscreen]);

  // アンマウント時のクリーンアップ
  useEffect(() => {
    return () => {
      if (isFullscreenRef.current) {
        setFullScreenApi(false);
      }
    };
  }, []);

  // ▼▼▼ Added: Sync with Browser Fullscreen API (e.g. for Mobile Gesture Exit) ▼▼▼
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isDocFullscreen = !!document.fullscreenElement;
      // 状態が不一致の場合のみ更新 (toggleFullscreenからの変更と区別するため)
      if (isDocFullscreen !== isFullscreenRef.current) {
        setIsFullscreen(isDocFullscreen);
        isFullscreenRef.current = isDocFullscreen;
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    // Safari/Older browsers support (Just in case, though Vite/React often polyfills)
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    };
  }, []);

  return {
    isFullscreen,
    toggleFullscreen,
  };
};
