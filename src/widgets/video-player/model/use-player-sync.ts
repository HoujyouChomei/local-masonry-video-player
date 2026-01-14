// src/widgets/video-player/model/use-player-sync.ts

import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { harvestMetadataApi, fetchVideoDetailsApi, onVideoUpdateApi } from '@/shared/api/electron';
import { useVideoPlayerStore } from '@/features/video-player/model/store';
import { VideoUpdateEvent } from '@/shared/types/electron';
import { VideoFile } from '@/shared/types/video';
import { logger } from '@/shared/lib/logger';

export const usePlayerSync = (isOpen: boolean, selectedVideo: VideoFile | null) => {
  const queryClient = useQueryClient();
  const { updateVideoData, playlist } = useVideoPlayerStore();

  const playlistRef = useRef(playlist);
  useEffect(() => {
    playlistRef.current = playlist;
  }, [playlist]);

  useEffect(() => {
    if (isOpen && selectedVideo) {
      if (selectedVideo.generationParams !== undefined) {
        return;
      }

      const fetchDetails = async () => {
        try {
          const fullVideo = await fetchVideoDetailsApi(selectedVideo.path);
          if (fullVideo) {
            updateVideoData({ ...selectedVideo, ...fullVideo });
          }
        } catch (e) {
          logger.error('[PlayerSync] Failed to fetch full details:', e);
        }
      };

      fetchDetails();
    }
  }, [isOpen, selectedVideo, updateVideoData]);

  const currentVideoId = selectedVideo?.id;

  useEffect(() => {
    if (!isOpen || !currentVideoId) return;

    const currentPlaylist = playlistRef.current;
    const currentIndex = currentPlaylist.findIndex((v) => v.id === currentVideoId);
    if (currentIndex === -1) return;

    const nextIndex = (currentIndex + 1) % currentPlaylist.length;
    const nextVideo = currentPlaylist[nextIndex];

    if (nextVideo && nextVideo.generationParams === undefined) {
      fetchVideoDetailsApi(nextVideo.path)
        .then((fullDetails) => {
          if (fullDetails) {
            updateVideoData({ ...nextVideo, ...fullDetails });
          }
        })
        .catch((e) => logger.warn('[PlayerSync] Prefetch failed:', e));
    }
  }, [isOpen, currentVideoId, updateVideoData]);

  useEffect(() => {
    if (selectedVideo && selectedVideo.metadataStatus === 'pending') {
      harvestMetadataApi(selectedVideo.id);
    }
  }, [selectedVideo]);

  useEffect(() => {
    if (!isOpen || !selectedVideo) return;

    const unsubscribe = onVideoUpdateApi(async (events: VideoUpdateEvent[]) => {
      const relevantEvent = events.find(
        (e) => e.type === 'update' && e.path === selectedVideo.path
      );

      if (relevantEvent) {
        try {
          const updatedVideo = await fetchVideoDetailsApi(relevantEvent.path);
          if (updatedVideo) {
            updateVideoData(updatedVideo);
          }
        } catch (error) {
          logger.error('[PlayerSync] Failed to fetch updated video details:', error);
        }
      }
    });

    return () => {
      unsubscribe();
    };
  }, [isOpen, selectedVideo, queryClient, updateVideoData]);
};
