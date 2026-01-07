// src/widgets/video-player/model/use-player-playback.ts

import { useRef, useEffect, useCallback, useState, useMemo } from 'react';
import { useSettingsStore } from '@/shared/stores/settings-store';
import { useVideoPlayerStore } from '@/features/video-player/model/store';
import { isNativeVideo, getStreamUrl } from '@/shared/lib/video-extensions';

export const usePlayerPlayback = () => {
  const videoRef = useRef<HTMLVideoElement>(null);

  const { selectedVideo, isOpen, closeVideo, playNext, playPrev } = useVideoPlayerStore();
  const { volume, isMuted, setVolumeState, autoPlayNext, toggleAutoPlayNext } = useSettingsStore();

  const [isErrorFallback, setIsErrorFallback] = useState(false);

  useEffect(() => {
    setIsErrorFallback(false);
  }, [selectedVideo?.id]);

  const currentSrc = useMemo(() => {
    if (!selectedVideo) return '';

    if (isErrorFallback) {
      if (selectedVideo.src.startsWith('http')) return selectedVideo.src;
      return getStreamUrl(selectedVideo.thumbnailSrc, selectedVideo.path);
    }

    if (isNativeVideo(selectedVideo.path)) {
      return selectedVideo.src;
    }

    if (selectedVideo.src.startsWith('http')) {
      return selectedVideo.src;
    }

    return getStreamUrl(selectedVideo.thumbnailSrc, selectedVideo.path);
  }, [selectedVideo, isErrorFallback]);

  // ▼▼▼ Added: Explicit load() to reset decoder pipeline on src change ▼▼▼
  useEffect(() => {
    if (videoRef.current && currentSrc) {
      // DOM再利用時にデコーダーコンテキストをリセットするためにload()を呼ぶ
      videoRef.current.load();
      // 自動再生が効かないケースへの保険 (通常はautoPlay属性で動作する)
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch((error) => {
          // ユーザー操作直後でない場合、ブラウザのポリシーでブロックされることがあるが、
          // モーダルプレイヤーのコンテキストでは通常問題ない。
          // エラーログは抑制する（DOMException: The play() request was interrupted... 等）
          if (error.name !== 'AbortError') {
            console.warn('[Player] Auto-play prevented:', error);
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

    if (isErrorFallback || selectedVideo.src.startsWith('http')) {
      console.error('Video playback failed (Transcoding or Fallback).');
      return;
    }

    console.warn('Native playback failed. Falling back to transcoding...');
    setIsErrorFallback(true);
  }, [selectedVideo, isErrorFallback]);

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
