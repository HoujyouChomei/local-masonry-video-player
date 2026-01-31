// src/widgets/media-player/model/use-player-sync.ts

import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '@/shared/api';
import { useMediaPlayerStore } from '@/entities/player/model/store';
import { MediaUpdateEvent } from '@/shared/types/electron';
import { Media } from '@/shared/schemas/media';
import { logger } from '@/shared/lib/logger';

export const usePlayerSync = (isOpen: boolean, selectedMedia: Media | null) => {
  const queryClient = useQueryClient();
  const { updateMediaData, playlist } = useMediaPlayerStore();

  const playlistRef = useRef(playlist);
  useEffect(() => {
    playlistRef.current = playlist;
  }, [playlist]);

  const selectedMediaRef = useRef(selectedMedia);
  useEffect(() => {
    selectedMediaRef.current = selectedMedia;
  }, [selectedMedia]);

  const currentMediaId = selectedMedia?.id;
  const currentMediaPath = selectedMedia?.path;
  const metadataStatus = selectedMedia?.metadataStatus;
  const hasGenerationParams = selectedMedia?.generationParams !== undefined;

  useEffect(() => {
    if (isOpen && currentMediaPath && !hasGenerationParams) {
      const timer = setTimeout(() => {
        const fetchDetails = async () => {
          try {
            const fullMedia = await api.media.getDetails(currentMediaPath);
            if (fullMedia && selectedMediaRef.current) {
              updateMediaData({ ...selectedMediaRef.current, ...fullMedia });
            }
          } catch (e) {
            logger.error('[PlayerSync] Failed to fetch full details:', e);
          }
        };
        fetchDetails();
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [isOpen, currentMediaPath, hasGenerationParams, updateMediaData]);

  useEffect(() => {
    if (!isOpen || !currentMediaId) return;

    const timer = setTimeout(() => {
      const currentPlaylist = playlistRef.current;
      const currentIndex = currentPlaylist.findIndex((v) => v.id === currentMediaId);
      if (currentIndex === -1) return;

      const nextIndex = (currentIndex + 1) % currentPlaylist.length;
      const nextMedia = currentPlaylist[nextIndex];

      if (nextMedia && nextMedia.generationParams === undefined) {
        api.media
          .getDetails(nextMedia.path)
          .then((fullDetails) => {
            if (fullDetails) {
              updateMediaData({ ...nextMedia, ...fullDetails });
            }
          })
          .catch((e) => logger.warn('[PlayerSync] Prefetch failed:', e));
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [isOpen, currentMediaId, updateMediaData]);

  useEffect(() => {
    if (currentMediaId && metadataStatus === 'pending') {
      const timer = setTimeout(() => {
        api.media.harvestMetadata(currentMediaId);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [currentMediaId, metadataStatus]);

  useEffect(() => {
    if (!isOpen || !currentMediaPath) return;

    const unsubscribe = api.events.onMediaUpdate(async (events: MediaUpdateEvent[]) => {
      const relevantEvent = events.find(
        (e) => e.type === 'update' && e.path === currentMediaPath
      );

      if (relevantEvent) {
        try {
          const updatedMedia = await api.media.getDetails(relevantEvent.path);
          if (updatedMedia) {
            updateMediaData(updatedMedia);
          }
        } catch (error) {
          logger.error('[PlayerSync] Failed to fetch updated media details:', error);
        }
      }
    });

    return () => {
      unsubscribe();
    };
  }, [isOpen, currentMediaPath, queryClient, updateMediaData]);
};