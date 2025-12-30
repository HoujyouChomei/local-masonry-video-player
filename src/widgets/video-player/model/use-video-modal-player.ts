// src/widgets/video-player/model/use-video-modal-player.ts

import { useEffect, useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { harvestMetadataApi, fetchVideoDetailsApi } from '@/shared/api/electron';
import { useVideoPlayerStore } from '@/features/video-player/model/store';
import { useFullscreen } from './use-fullscreen';
import { usePlayerPlayback } from './use-player-playback';
import { usePlayerControls } from './use-player-controls';
import { VideoUpdateEvent } from '@/shared/types/electron';

export const useVideoModalPlayer = () => {
  const queryClient = useQueryClient();
  const { selectedVideo } = useVideoPlayerStore();

  const [isInfoPanelOpen, setIsInfoPanelOpen] = useState(false);

  const toggleInfoPanel = useCallback(() => {
    setIsInfoPanelOpen((prev) => !prev);
  }, []);

  const playback = usePlayerPlayback();
  const fullscreen = useFullscreen(playback.isOpen);

  const controls = usePlayerControls({
    isOpen: playback.isOpen,
    selectedVideo: playback.selectedVideo,
    videoRef: playback.videoRef,
    isFullscreen: fullscreen.isFullscreen,
    playNext: playback.playNext,
    playPrev: playback.playPrev,
    togglePlay: playback.togglePlay,
    closeVideo: playback.closeVideo,
    toggleFullscreen: fullscreen.toggleFullscreen,
    toggleInfoPanel, // ▼▼▼ 追加 ▼▼▼
  });

  if (!playback.isOpen && isInfoPanelOpen) {
    setIsInfoPanelOpen(false);
  }

  // A. メタデータ自動収集トリガー
  useEffect(() => {
    if (selectedVideo && selectedVideo.metadataStatus === 'pending') {
      harvestMetadataApi(selectedVideo.id);
    }
  }, [selectedVideo]);

  // B. リアルタイム更新の反映
  useEffect(() => {
    if (!playback.isOpen || !selectedVideo) return;

    const unsubscribe = window.electron.onVideoUpdate(async (event: VideoUpdateEvent) => {
      if (event.type === 'update' && event.path === selectedVideo.path) {
        try {
          const updatedVideo = await fetchVideoDetailsApi(event.path);
          if (updatedVideo) {
            useVideoPlayerStore.setState({ selectedVideo: updatedVideo });
          }
        } catch (error) {
          console.error('Failed to fetch updated video details:', error);
        }
      }
    });

    return () => {
      unsubscribe();
    };
  }, [playback.isOpen, selectedVideo, queryClient]);

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

    toggleFullscreen: fullscreen.toggleFullscreen,
    toggleInfoPanel,

    handleMouseMove: controls.handleMouseMove,
    handleMouseLeave: controls.handleMouseLeave,
    handleContextMenu: controls.handleContextMenu,
    handleVideoClick: controls.handleVideoClick,
    handleDoubleClick: controls.handleDoubleClick,
  };
};
