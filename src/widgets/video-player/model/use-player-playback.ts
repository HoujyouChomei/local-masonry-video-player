// src/widgets/video-player/model/use-player-playback.ts

import { useRef, useEffect, useCallback, useState, useMemo } from 'react';
import { useSettingsStore } from '@/shared/stores/settings-store';
import { useVideoPlayerStore } from '@/features/video-player/model/store';
import { isNativeVideo, getStreamUrl } from '@/shared/lib/video-extensions';

export const usePlayerPlayback = () => {
  const videoRef = useRef<HTMLVideoElement>(null);

  const { selectedVideo, isOpen, closeVideo, playNext, playPrev } = useVideoPlayerStore();
  const { volume, isMuted, setVolumeState, autoPlayNext, toggleAutoPlayNext } = useSettingsStore();

  // フォールバック（エラー発生時）モードかどうか
  const [isErrorFallback, setIsErrorFallback] = useState(false);

  // 動画IDが変わったらフォールバック状態をリセット
  useEffect(() => {
    setIsErrorFallback(false);
  }, [selectedVideo?.id]);

  // 宣言的に src を決定する
  const currentSrc = useMemo(() => {
    if (!selectedVideo) return '';

    // 1. エラーフォールバック中なら強制的にトランスコードURL
    if (isErrorFallback) {
      return getStreamUrl(selectedVideo.thumbnailSrc, selectedVideo.path);
    }

    // 2. ネイティブ対応なら file://
    if (isNativeVideo(selectedVideo.path)) {
      return selectedVideo.src;
    }

    // 3. ネイティブ非対応ならトランスコードURL
    return getStreamUrl(selectedVideo.thumbnailSrc, selectedVideo.path);
  }, [selectedVideo, isErrorFallback]);

  // マウント時/動画変更時の初期設定 (音量など)
  useEffect(() => {
    if (videoRef.current) {
      // 音量設定の同期
      videoRef.current.volume = volume;
      videoRef.current.muted = isMuted;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedVideo?.id, isOpen]);

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

  // エラーハンドリング
  const handleError = useCallback(() => {
    if (!selectedVideo) return;

    // 既にフォールバック中、または最初からトランスコード前提だった場合は諦める
    if (isErrorFallback || !isNativeVideo(selectedVideo.path)) {
      console.error('Video playback failed (Transcoding or Fallback).');
      return;
    }

    // ネイティブ再生で失敗した場合はフォールバックを有効化
    console.warn('Native playback failed. Falling back to transcoding...');
    setIsErrorFallback(true);
  }, [selectedVideo, isErrorFallback]);

  return {
    videoRef,
    selectedVideo,
    isOpen,
    currentSrc, // UIに渡すURL
    closeVideo,
    playNext,
    playPrev,
    autoPlayNext,
    toggleAutoPlayNext,
    togglePlay,
    handleVolumeChange,
    handleVideoEnded,
    handleError,
  };
};
