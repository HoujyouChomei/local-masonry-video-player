// src/widgets/video-player/model/use-player-playback.ts

import { useRef, useEffect, useCallback, useMemo } from 'react';
import { useSettingsStore } from '@/shared/stores/settings-store';
import { useVideoPlayerStore } from '@/features/video-player/model/store';
import { logger } from '@/shared/lib/logger';

export const usePlayerPlayback = () => {
  const videoRef = useRef<HTMLVideoElement>(null);

  const { selectedVideo, isOpen, closeVideo, playNext, playPrev } = useVideoPlayerStore();
  const { volume, isMuted, setVolumeState, autoPlayNext, toggleAutoPlayNext } = useSettingsStore();

  const currentSrc = useMemo(() => {
    if (!selectedVideo) return '';
    return selectedVideo.src;
  }, [selectedVideo]);

  useEffect(() => {
    if (videoRef.current && currentSrc) {
      videoRef.current.load();
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch((error) => {
          if (error.name !== 'AbortError') {
            logger.warn('[Player] Auto-play prevented:', error);
          }
        });
      }
    }
  }, [currentSrc]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = volume;
      videoRef.current.muted = isMuted;
    }
  }, [selectedVideo?.id, isOpen, volume, isMuted]);

  const togglePlay = useCallback(() => {
    if (videoRef.current) {
      if (videoRef.current.paused) videoRef.current.play();
      else videoRef.current.pause();
    }
  }, []);

  const handleVolumeChange = useCallback(
    (e: React.SyntheticEvent<HTMLVideoElement>) => {
      const target = e.currentTarget;
      if (target.volume !== volume || target.muted !== isMuted) {
        setVolumeState(target.volume, target.muted);
      }
    },
    [volume, isMuted, setVolumeState]
  );

  const handleVideoEnded = useCallback(() => {
    if (autoPlayNext) {
      playNext();
    }
  }, [autoPlayNext, playNext]);

  const handleError = useCallback(() => {
    if (!selectedVideo) return;
    logger.error(`Video playback failed: ${selectedVideo.path}`);
  }, [selectedVideo]);

  return useMemo(
    () => ({
      videoRef,
      selectedVideo,
      isOpen,
      currentSrc,
      closeVideo,
      playNext,
      playPrev,
      autoPlayNext,
      toggleAutoPlayNext,
      togglePlay,
      handleVolumeChange,
      handleVideoEnded,
      handleError,
    }),
    [
      selectedVideo,
      isOpen,
      currentSrc,
      closeVideo,
      playNext,
      playPrev,
      autoPlayNext,
      toggleAutoPlayNext,
      togglePlay,
      handleVolumeChange,
      handleVideoEnded,
      handleError,
    ]
  );
};
