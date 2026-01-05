// src/widgets/video-player/model/use-video-modal-player.ts

import { useEffect, useState, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { harvestMetadataApi, fetchVideoDetailsApi, onVideoUpdateApi } from '@/shared/api/electron';
import { useVideoPlayerStore } from '@/features/video-player/model/store';
import { useSettingsStore } from '@/shared/stores/settings-store';
import { useFullscreen } from './use-fullscreen';
import { usePlayerPlayback } from './use-player-playback';
import { usePlayerControls } from './use-player-controls';
import { VideoUpdateEvent } from '@/shared/types/electron';

export const useVideoModalPlayer = () => {
  const queryClient = useQueryClient();
  const { selectedVideo, updateVideoData } = useVideoPlayerStore();
  const { openInFullscreen } = useSettingsStore();

  const [isInfoPanelOpen, setIsInfoPanelOpen] = useState(false);
  const [hasEnteredFullscreen, setHasEnteredFullscreen] = useState(false);

  // History API管理用フラグ
  const isHistoryPushedRef = useRef(false);

  // タッチ操作管理用
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  const toggleInfoPanel = useCallback(() => {
    setIsInfoPanelOpen((prev) => !prev);
  }, []);

  const playback = usePlayerPlayback();
  const fullscreen = useFullscreen(playback.isOpen);

  const { isOpen: isPlaybackOpen, closeVideo } = playback;

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
    isOpen: playback.isOpen,
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

  if (!playback.isOpen && isInfoPanelOpen) {
    setIsInfoPanelOpen(false);
  }

  // 詳細データの遅延ロード (Lite -> Full)
  useEffect(() => {
    if (isPlaybackOpen && selectedVideo) {
      if (selectedVideo.generationParams !== undefined) {
        return;
      }

      // const targetId = selectedVideo.id; // ストア側でIDチェックするので不要

      const fetchDetails = async () => {
        try {
          const fullVideo = await fetchVideoDetailsApi(selectedVideo.path);

          if (fullVideo) {
            // ストアのアクションを使って一括更新（二重管理解消）
            updateVideoData({
              ...selectedVideo,
              ...fullVideo,
            });
          }
        } catch (e) {
          console.error('[Player] Failed to fetch full details:', e);
        }
      };

      fetchDetails();
    }
  }, [isPlaybackOpen, selectedVideo, updateVideoData]);

  // 次の動画をプリフェッチ (Auto Play Next高速化)
  // ▼▼▼ 修正: selectedVideo.id を事前に取り出し、依存配列の問題を解消 ▼▼▼
  const currentVideoId = selectedVideo?.id;

  useEffect(() => {
    if (!isPlaybackOpen || !currentVideoId) return;

    // 最新のストア状態からプレイリストを取得
    const { playlist } = useVideoPlayerStore.getState();
    const currentIndex = playlist.findIndex((v) => v.id === currentVideoId);

    if (currentIndex === -1) return;

    const nextIndex = (currentIndex + 1) % playlist.length;
    const nextVideo = playlist[nextIndex];

    // 次の動画が存在し、かつ「軽量データ(Lite)」である場合のみ取得
    if (nextVideo && nextVideo.generationParams === undefined) {
      fetchVideoDetailsApi(nextVideo.path)
        .then((fullDetails) => {
          if (fullDetails) {
            // アクションを利用して更新
            // playlist内の次の動画データが更新されます
            updateVideoData({ ...nextVideo, ...fullDetails });
          }
        })
        .catch((e) => console.error('[Player] Prefetch failed:', e));
    }
  }, [isPlaybackOpen, currentVideoId, updateVideoData]);

  // A. メタデータ自動収集トリガー
  useEffect(() => {
    if (selectedVideo && selectedVideo.metadataStatus === 'pending') {
      harvestMetadataApi(selectedVideo.id);
    }
  }, [selectedVideo]);

  // Auto Fullscreen Logic
  useEffect(() => {
    if (!playback.isOpen) {
      setHasEnteredFullscreen(false);
    }
  }, [playback.isOpen]);

  useEffect(() => {
    if (fullscreen.isFullscreen) {
      setHasEnteredFullscreen(true);
    }
  }, [fullscreen.isFullscreen]);

  useEffect(() => {
    if (playback.isOpen && selectedVideo && openInFullscreen && !fullscreen.isFullscreen) {
      fullscreen.toggleFullscreen();
    }
  }, [playback.isOpen, selectedVideo, openInFullscreen, fullscreen]);

  const isContentHidden = openInFullscreen && !hasEnteredFullscreen && !fullscreen.isFullscreen;

  // B. リアルタイム更新の反映
  useEffect(() => {
    if (!playback.isOpen || !selectedVideo) return;

    const unsubscribe = onVideoUpdateApi(async (events: VideoUpdateEvent[]) => {
      const relevantEvent = events.find(
        (e) => e.type === 'update' && e.path === selectedVideo.path
      );

      if (relevantEvent) {
        try {
          const updatedVideo = await fetchVideoDetailsApi(relevantEvent.path);
          if (updatedVideo) {
            // アクションを使用
            updateVideoData(updatedVideo);
          }
        } catch (error) {
          console.error('Failed to fetch updated video details:', error);
        }
      }
    });

    return () => {
      unsubscribe();
    };
  }, [playback.isOpen, selectedVideo, queryClient, updateVideoData]);

  // C. 戻るボタンでのモーダル閉鎖 (History API)
  useEffect(() => {
    if (isPlaybackOpen) {
      if (!isHistoryPushedRef.current) {
        window.history.pushState({ modalOpen: true }, '');
        isHistoryPushedRef.current = true;
      }

      const handlePopState = (_event: PopStateEvent) => {
        isHistoryPushedRef.current = false;
        closeVideo();
      };

      window.addEventListener('popstate', handlePopState);

      return () => {
        window.removeEventListener('popstate', handlePopState);
        if (isHistoryPushedRef.current) {
          isHistoryPushedRef.current = false;
          window.history.back();
        }
      };
    } else {
      isHistoryPushedRef.current = false;
    }
  }, [isPlaybackOpen, closeVideo]);

  // D. スワイプ操作 (Touch Events)
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      touchStartRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      };
    }
  }, []);

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (!touchStartRef.current) return;

      const diffX = e.changedTouches[0].clientX - touchStartRef.current.x;
      const diffY = e.changedTouches[0].clientY - touchStartRef.current.y;

      if (Math.abs(diffX) > 50 && Math.abs(diffX) > Math.abs(diffY)) {
        if (diffX > 0) {
          playback.playPrev();
        } else {
          playback.playNext();
        }
      }

      touchStartRef.current = null;
    },
    [playback]
  );

  return {
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

    handleTouchStart,
    handleTouchEnd,
  };
};
