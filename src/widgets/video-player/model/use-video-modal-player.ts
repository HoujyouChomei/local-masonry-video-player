// src/widgets/video-player/model/use-video-modal-player.ts

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useVideoPlayerStore } from '@/features/video-player/model/store';
import { useSettingsStore } from '@/shared/stores/settings-store';
import { useFullscreen } from './use-fullscreen';
import { usePlayerPlayback } from './use-player-playback';
import { usePlayerControls } from './use-player-controls';
import { usePlayerSync } from './use-player-sync';
import { usePlayerHistory } from './use-player-history';
import { usePlayerGestures } from './use-player-gestures';

export const useVideoModalPlayer = () => {
  const { selectedVideo } = useVideoPlayerStore();
  const { openInFullscreen } = useSettingsStore();

  const [isInfoPanelOpen, setIsInfoPanelOpen] = useState(false);
  const [hasEnteredFullscreen, setHasEnteredFullscreen] = useState(false);

  const toggleInfoPanel = useCallback(() => {
    setIsInfoPanelOpen((prev) => !prev);
  }, []);

  const playback = usePlayerPlayback();
  const { isOpen: isPlaybackOpen, closeVideo, playNext, playPrev } = playback;

  const fullscreen = useFullscreen(isPlaybackOpen);

  const handleToggleFullscreen = useCallback(() => {
    if (fullscreen.isFullscreen) {
      fullscreen.toggleFullscreen();
      if (openInFullscreen) {
        closeVideo();
      }
    } else {
      fullscreen.toggleFullscreen();
    }
  }, [fullscreen, openInFullscreen, closeVideo]);

  const controls = usePlayerControls({
    isOpen: isPlaybackOpen,
    selectedVideo: playback.selectedVideo,
    videoRef: playback.videoRef,
    isFullscreen: fullscreen.isFullscreen,
    playNext: playback.playNext,
    playPrev: playback.playPrev,
    togglePlay: playback.togglePlay,
    closeVideo: playback.closeVideo,
    toggleFullscreen: handleToggleFullscreen,
    toggleInfoPanel,
  });

  usePlayerSync(isPlaybackOpen, selectedVideo);
  usePlayerHistory(isPlaybackOpen, closeVideo);

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
    if (isPlaybackOpen && selectedVideo && openInFullscreen && !fullscreen.isFullscreen) {
      fullscreen.toggleFullscreen();
    }
  }, [isPlaybackOpen, selectedVideo, openInFullscreen, fullscreen]);

  const isContentHidden = openInFullscreen && !hasEnteredFullscreen && !fullscreen.isFullscreen;

  return useMemo(
    () => ({
      selectedVideo: playback.selectedVideo,
      videoRef: playback.videoRef,
      isOpen: playback.isOpen,
      currentSrc: playback.currentSrc,

      autoPlayNext: playback.autoPlayNext,
      toggleAutoPlayNext: playback.toggleAutoPlayNext,
      playNext: playback.playNext,
      playPrev: playback.playPrev,
      closeVideo: playback.closeVideo,

      handleVolumeChange: playback.handleVolumeChange,
      handleVideoEnded: playback.handleVideoEnded,
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
      handleVideoClick: controls.handleVideoClick,
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
    ]
  );
};
