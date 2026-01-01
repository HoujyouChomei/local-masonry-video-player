// src/widgets/video-player/model/use-player-controls.ts

import { useState, useEffect, useRef, useCallback } from 'react';
import { VideoFile } from '@/shared/types/video';

interface UsePlayerControlsProps {
  isOpen: boolean;
  selectedVideo: VideoFile | null;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  isFullscreen: boolean;
  playNext: () => void;
  playPrev: () => void;
  togglePlay: () => void;
  closeVideo: () => void;
  toggleFullscreen: () => void;
  toggleInfoPanel: () => void; // ▼▼▼ 追加 ▼▼▼
}

export const usePlayerControls = ({
  isOpen,
  selectedVideo,
  videoRef,
  isFullscreen,
  playNext,
  playPrev,
  togglePlay,
  closeVideo,
  toggleFullscreen,
  toggleInfoPanel, // ▼▼▼ 追加 ▼▼▼
}: UsePlayerControlsProps) => {
  const [showControls, setShowControls] = useState(false);

  const [prevVideoId, setPrevVideoId] = useState<string | null>(null);

  const interactionLockRef = useRef<number>(0);
  const scrollLockRef = useRef<number>(0);

  if (selectedVideo && selectedVideo.id !== prevVideoId) {
    setPrevVideoId(selectedVideo.id);
    setShowControls(false);
  }

  useEffect(() => {
    if (selectedVideo?.id) {
      interactionLockRef.current = Date.now() + 1000;
    }
  }, [selectedVideo?.id]);

  // --- Mouse Handlers ---
  const handleMouseMove = useCallback(() => {
    if (Date.now() < interactionLockRef.current) return;
    if (!showControls) setShowControls(true);
  }, [showControls]);

  const handleMouseLeave = useCallback(() => {
    setShowControls(false);
  }, []);

  const handleContextMenu = useCallback(() => {
    setShowControls(false);
    interactionLockRef.current = Date.now() + 500;
  }, []);

  const handleVideoClick = useCallback(
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

  // --- Global Event Listeners (Keyboard & Wheel) ---
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // ▼▼▼ 修正: 入力要素への入力中はショートカットを無効化 ▼▼▼
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }
      // ▲▲▲ 修正ここまで ▲▲▲

      if (e.key === 'Escape') {
        if (isFullscreen) {
          toggleFullscreen();
        } else {
          closeVideo();
        }
      }
      if (e.key === 'ArrowRight') playNext();
      if (e.key === 'ArrowLeft') playPrev();
      if (e.code === 'Space') {
        e.preventDefault();
        togglePlay();
      }
      if (e.key.toLowerCase() === 'f') {
        e.preventDefault();
        toggleFullscreen();
      }
      // ▼▼▼ 追加: "I"キーでInfoパネル切り替え ▼▼▼
      if (e.key.toLowerCase() === 'i') {
        e.preventDefault();
        toggleInfoPanel();
      }
    };

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

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('wheel', handleWheel, { passive: true });
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('wheel', handleWheel);
      document.body.style.overflow = '';
    };
  }, [
    isOpen,
    isFullscreen,
    playNext,
    playPrev,
    togglePlay,
    toggleFullscreen,
    closeVideo,
    toggleInfoPanel, // ▼▼▼ 追加 ▼▼▼
  ]);

  return {
    showControls,
    handleMouseMove,
    handleMouseLeave,
    handleContextMenu,
    handleVideoClick,
    handleDoubleClick,
  };
};