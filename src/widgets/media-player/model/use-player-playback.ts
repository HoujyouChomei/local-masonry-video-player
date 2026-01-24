// src/widgets/media-player/model/use-player-playback.ts

import { useRef, useEffect, useCallback, useMemo } from 'react';
import { useSettingsStore } from '@/shared/stores/settings-store';
import { useMediaPlayerStore } from '@/entities/player/model/store';
import { logger } from '@/shared/lib/logger';

export const usePlayerPlayback = () => {
  const videoRef = useRef<HTMLVideoElement>(null);

  const { selectedMedia, isOpen, closeMedia, playNext, playPrev } = useMediaPlayerStore();
  const { volume, isMuted, setVolumeState, autoPlayNext, toggleAutoPlayNext } = useSettingsStore();

  const currentSrc = useMemo(() => {
    if (!selectedMedia) return '';
    return selectedMedia.src;
  }, [selectedMedia]);

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
  }, [selectedMedia?.id, isOpen, volume, isMuted]);

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

  const handleMediaEnded = useCallback(() => {
    if (autoPlayNext) {
      playNext();
    }
  }, [autoPlayNext, playNext]);

  const handleError = useCallback(() => {
    if (!selectedMedia) return;
    logger.error(`Media playback failed: ${selectedMedia.path}`);
  }, [selectedMedia]);

  return useMemo(
    () => ({
      videoRef,
      selectedMedia,
      isOpen,
      currentSrc,
      closeMedia,
      playNext,
      playPrev,
      autoPlayNext,
      toggleAutoPlayNext,
      togglePlay,
      handleVolumeChange,
      handleMediaEnded,
      handleError,
    }),
    [
      selectedMedia,
      isOpen,
      currentSrc,
      closeMedia,
      playNext,
      playPrev,
      autoPlayNext,
      toggleAutoPlayNext,
      togglePlay,
      handleVolumeChange,
      handleMediaEnded,
      handleError,
    ]
  );
};
