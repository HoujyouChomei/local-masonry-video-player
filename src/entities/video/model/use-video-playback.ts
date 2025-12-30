// src/entities/video/model/use-video-playback.ts

import { useState, useEffect, useRef, RefObject } from 'react';
import { useSettingsStore } from '@/shared/stores/settings-store';
// useUIStore のインポートを削除 (scrollDirectionが不要になるため)
import { VideoFile } from '../../../shared/types/video';
import { updateVideoMetadataApi } from '@/shared/api/electron';
import { isNativeVideo } from '@/shared/lib/video-extensions';

interface UseVideoPlaybackProps {
  video: VideoFile;
  inView: boolean;
  elementRef: RefObject<HTMLDivElement | null>;
  isHovered: boolean;
  isModalOpen: boolean;
  setAspectRatio: (ratio: number) => void;
}

export const useVideoPlayback = ({
  video,
  inView,
  // elementRef は watchDog 等で使う可能性があるため残しますが、スクロール判定には使いません
  elementRef,
  isHovered,
  isModalOpen,
  setAspectRatio,
}: UseVideoPlaybackProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [viewId, setViewId] = useState(0);

  const [shouldLoadVideo, setShouldLoadVideo] = useState(false);
  const [duration, setDuration] = useState<number>(video.duration || 0);

  const settingsDebounceTime = useSettingsStore((state) => state.debounceTime);
  const playOnHoverOnly = useSettingsStore((state) => state.playOnHoverOnly);

  const enableLargeVideoRestriction = useSettingsStore(
    (state) => state.enableLargeVideoRestriction
  );
  const largeVideoThreshold = useSettingsStore((state) => state.largeVideoThreshold);

  const isHeavyVideo =
    enableLargeVideoRestriction && video.size > largeVideoThreshold * 1024 * 1024;

  const effectivePlayOnHover = playOnHoverOnly || isHeavyVideo;
  const effectiveDebounceTime = effectivePlayOnHover ? 0 : settingsDebounceTime;

  const canPlayNative = isNativeVideo(video.path);

  // ▼▼▼ 修正: ロード/アンロード判定を統合し、スクロール監視を削除 ▼▼▼
  useEffect(() => {
    if (!canPlayNative) return;

    let debounceTimer: NodeJS.Timeout;

    // モーダルが開いていない、かつ (ホバーモードならホバー中 / 通常なら画面内) の場合にロード
    const shouldPlay = !isModalOpen && (effectivePlayOnHover ? isHovered : inView);

    if (shouldPlay) {
      if (shouldLoadVideo) return;

      // ロード開始（設定された遅延時間後に実行）
      debounceTimer = setTimeout(() => {
        setShouldLoadVideo(true);
        setViewId((prev) => prev + 1);
        setIsVideoReady(false);
      }, effectiveDebounceTime);
    } else {
      if (!shouldLoadVideo) return;

      // ロード解除（即時実行）
      // 以前のスクロール監視ロジック(checkPruning)は削除しました。
      // 親コンポーネント(VideoCard)がIntersectionObserverでinViewを管理しており、
      // 画面外に出た時点で inView が false になるため、ここで自動的にアンロードされます。
      debounceTimer = setTimeout(() => {
        setShouldLoadVideo(false);
        setIsVideoReady(false);
        setIsPlaying(false);
      }, 0);
    }

    return () => clearTimeout(debounceTimer);
  }, [
    inView,
    effectiveDebounceTime,
    isModalOpen,
    isHovered,
    effectivePlayOnHover,
    shouldLoadVideo,
    video.name,
    canPlayNative,
  ]);

  // ▼▼▼ 削除: 個別のスクロールイベントリスナー (checkPruning) ▼▼▼
  /*
  useEffect(() => {
    if (!shouldLoadVideo) return;
    if (!elementRef.current) return;
    ...
    window.addEventListener('scroll', onScroll, { passive: true });
    ...
  }, [shouldLoadVideo, elementRef]);
  */

  // Watchdog logic (Stalled recovery)
  useEffect(() => {
    if (!canPlayNative) return;

    let watchdogTimer: NodeJS.Timeout;
    if (inView && shouldLoadVideo) {
      watchdogTimer = setTimeout(() => {
        const vid = videoRef.current;
        if (inView && vid && vid.readyState < 3) {
          setViewId((prev) => prev + 1);
        }
      }, 8000);
    }
    return () => clearTimeout(watchdogTimer);
  }, [inView, shouldLoadVideo, viewId, video.name, canPlayNative]);

  const handleLoadedMetadata = () => {
    const vid = videoRef.current;
    if (!vid) return;

    let shouldUpdateDB = false;

    if (vid.videoWidth && vid.videoHeight) {
      setAspectRatio(vid.videoWidth / vid.videoHeight);

      if (video.width !== vid.videoWidth || video.height !== vid.videoHeight) {
        shouldUpdateDB = true;
      }
    }

    if (vid.duration && !isNaN(vid.duration)) {
      if (Math.abs(duration - vid.duration) > 0.5) {
        setDuration(vid.duration);
      }

      if (!video.duration || Math.abs(video.duration - vid.duration) > 0.1) {
        shouldUpdateDB = true;
      }
    }

    if (vid.duration > 0.1) {
      vid.currentTime = 0.1;
    }

    if (shouldUpdateDB) {
      updateVideoMetadataApi(video.path, vid.duration, vid.videoWidth, vid.videoHeight);
    }
  };

  const handleSeeked = () => {
    const vid = videoRef.current;
    if (inView && shouldLoadVideo && vid) {
      vid.play().catch(() => setIsPlaying(false));
    }
  };

  const handleLoadedData = () => setIsVideoReady(true);

  const handleError = () => {
    if (inView && shouldLoadVideo) {
      console.error(`[Error] ${video.name} -> Retry`);
      setTimeout(() => setViewId((prev) => prev + 1), 1000);
    }
  };

  const handleTogglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!canPlayNative) return;

    const vid = videoRef.current;
    if (!shouldLoadVideo) {
      setShouldLoadVideo(true);
      return;
    }
    if (!vid) return;
    if (isPlaying) vid.pause();
    else vid.play();
  };

  const handleEnded = () => {
    if (videoRef.current) videoRef.current.currentTime = 0.1;
  };

  const separator = video.src.includes('?') ? '&' : '?';
  const srcUrl = shouldLoadVideo ? `${video.src}${separator}_v=${viewId}` : undefined;

  return {
    videoRef,
    shouldLoadVideo,
    isPlaying,
    isVideoReady,
    duration,
    srcUrl,
    handleLoadedMetadata,
    handleSeeked,
    handleLoadedData,
    handleError,
    handlePlay: () => setIsPlaying(true),
    handlePause: () => setIsPlaying(false),
    handleEnded,
    handleTogglePlay,
  };
};
