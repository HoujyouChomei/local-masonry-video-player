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
      // ▼▼▼ 修正: setStateを非同期にしてカスケード更新警告を回避 ▼▼▼
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

  return {
    isFullscreen,
    toggleFullscreen,
  };
};