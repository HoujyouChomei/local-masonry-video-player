// src/widgets/media-player/model/use-media-modal-player.ts

import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useMediaPlayerStore } from '@/entities/player/model/store';
import { useSettingsStore } from '@/shared/stores/settings-store';
import { useFullscreen } from './use-fullscreen';
import { usePlayerPlayback } from './use-player-playback';
import { usePlayerControls } from './use-player-controls';
import { usePlayerSync } from './use-player-sync';
import { usePlayerHistory } from './use-player-history';
import { usePlayerGestures } from './use-player-gestures';
import { api } from '@/shared/api';

export const useMediaModalPlayer = () => {
  const { selectedMedia } = useMediaPlayerStore();
  const { openInFullscreen } = useSettingsStore();

  const [isInfoPanelOpen, setIsInfoPanelOpen] = useState(false);
  const [hasEnteredFullscreen, setHasEnteredFullscreen] = useState(false);

  const toggleInfoPanel = useCallback(() => {
    setIsInfoPanelOpen((prev) => !prev);
  }, []);

  const playback = usePlayerPlayback();
  const { isOpen: isPlaybackOpen, closeMedia, playNext, playPrev } = playback;

  const fullscreen = useFullscreen(isPlaybackOpen);

  const isFullscreenRef = useRef(fullscreen.isFullscreen);
  useEffect(() => {
    isFullscreenRef.current = fullscreen.isFullscreen;
  }, [fullscreen.isFullscreen]);

  const handleToggleFullscreen = useCallback(() => {
    if (fullscreen.isFullscreen) {
      fullscreen.toggleFullscreen();
      if (openInFullscreen) {
        closeMedia();
      }
    } else {
      fullscreen.toggleFullscreen();
    }
  }, [fullscreen, openInFullscreen, closeMedia]);

  const handleClose = useCallback(() => {
    if (isFullscreenRef.current) {
      if (typeof window !== 'undefined' && window.electron) {
        api.system.setFullScreen(false);
      }
    }
    closeMedia();
  }, [closeMedia]);

  const controls = usePlayerControls({
    isOpen: isPlaybackOpen,
    selectedMedia: playback.selectedMedia,
    videoRef: playback.videoRef,
    isFullscreen: fullscreen.isFullscreen,
    playNext: playback.playNext,
    playPrev: playback.playPrev,
    togglePlay: playback.togglePlay,
    closeMedia: handleClose,
    toggleFullscreen: handleToggleFullscreen,
    toggleInfoPanel,
  });

  usePlayerSync(isPlaybackOpen, selectedMedia);
  usePlayerHistory(isPlaybackOpen, handleClose);

  const gestures = usePlayerGestures({
    onSwipeLeft: playNext,
    onSwipeRight: playPrev,
  });

  if (!isPlaybackOpen && isInfoPanelOpen) {
    setIsInfoPanelOpen(false);
  }

  useEffect(() => {
    if (!isPlaybackOpen) {
      setHasEnteredFullscreen(false);
    }
  }, [isPlaybackOpen]);

  useEffect(() => {
    if (fullscreen.isFullscreen) {
      setHasEnteredFullscreen(true);
    }
  }, [fullscreen.isFullscreen]);

  useEffect(() => {
    if (isPlaybackOpen && selectedMedia && openInFullscreen && !fullscreen.isFullscreen) {
      fullscreen.toggleFullscreen();
    }
  }, [isPlaybackOpen, selectedMedia, openInFullscreen, fullscreen]);

  const isContentHidden = openInFullscreen && !hasEnteredFullscreen && !fullscreen.isFullscreen;

  return useMemo(
    () => ({
      selectedMedia: playback.selectedMedia,
      videoRef: playback.videoRef,
      isOpen: playback.isOpen,
      currentSrc: playback.currentSrc,

      autoPlayNext: playback.autoPlayNext,
      toggleAutoPlayNext: playback.toggleAutoPlayNext,
      playNext: playback.playNext,
      playPrev: playback.playPrev,
      closeMedia: handleClose,

      handleVolumeChange: playback.handleVolumeChange,
      handleMediaEnded: playback.handleMediaEnded,
      handleError: playback.handleError,

      isFullscreen: fullscreen.isFullscreen,
      showControls: controls.showControls,
      isInfoPanelOpen,
      isContentHidden,

      toggleFullscreen: handleToggleFullscreen,
      toggleInfoPanel,

      handleMouseMove: controls.handleMouseMove,
      handleMouseLeave: controls.handleMouseLeave,
      handleContextMenu: controls.handleContextMenu,
      handleMediaClick: controls.handleMediaClick,
      handleDoubleClick: controls.handleDoubleClick,

      handleTouchStart: gestures.handleTouchStart,
      handleTouchEnd: gestures.handleTouchEnd,
    }),
    [
      playback,
      fullscreen.isFullscreen,
      controls,
      isInfoPanelOpen,
      isContentHidden,
      handleToggleFullscreen,
      toggleInfoPanel,
      gestures,
      handleClose,
    ]
  );
};
