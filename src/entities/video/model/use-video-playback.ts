// src/entities/video/model/use-video-playback.ts

import { useState, useEffect, useRef, RefObject } from 'react';
import { useSettingsStore } from '@/shared/stores/settings-store';
import { VideoFile } from '../../../shared/types/video';
import { updateVideoMetadataApi } from '@/shared/api/electron';
import { isNativeVideo } from '@/shared/lib/video-extensions';
import { logger } from '@/shared/lib/logger';

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

  const separator = video.src.includes('?') ? '&' : '?';
  const srcUrl = shouldLoadVideo ? `${video.src}${separator}_v=${viewId}` : undefined;

  useEffect(() => {
    setIsVideoReady(false);
  }, [viewId]);

  useEffect(() => {
    if (!canPlayNative) return;

    let debounceTimer: NodeJS.Timeout;

    const shouldPlay = !isModalOpen && (effectivePlayOnHover ? isHovered : inView);

    if (shouldPlay) {
      if (shouldLoadVideo) return;

      debounceTimer = setTimeout(() => {
        setShouldLoadVideo(true);
        setViewId((prev) => prev + 1);
        setIsVideoReady(false);
      }, effectiveDebounceTime);
    } else {
      if (!shouldLoadVideo) return;

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

  useEffect(() => {
    if (!canPlayNative) return;

    let watchdogInterval: NodeJS.Timeout;
    if (inView && shouldLoadVideo) {
      watchdogInterval = setInterval(() => {
        const vid = videoRef.current;
        if (inView && vid && vid.readyState < 3) {
          setViewId((prev) => prev + 1);
        }
      }, 2000);
    }
    return () => clearInterval(watchdogInterval);
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
      updateVideoMetadataApi(video.id, vid.duration, vid.videoWidth, vid.videoHeight);
    }
  };

  const handleSeeked = () => {
    const vid = videoRef.current;
    if (inView && shouldLoadVideo && vid) {
      vid
        .play()
        .then(() => {
          setIsPlaying(true);
          setIsVideoReady(true);
        })
        .catch(() => setIsPlaying(false));
    }
  };

  const handleLoadedData = () => {
    const vid = videoRef.current;
    if (vid && vid.duration <= 0.1) {
      setIsVideoReady(true);
    }
  };

  const handleError = () => {
    if (inView && shouldLoadVideo) {
      logger.warn(`[Error] ${video.name} -> Retry`);
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
