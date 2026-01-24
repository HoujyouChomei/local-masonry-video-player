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

  useEffect(() => {
    if (isOpen && selectedMedia) {
      if (selectedMedia.generationParams !== undefined) {
        return;
      }

      const fetchDetails = async () => {
        try {
          const fullMedia = await api.media.getDetails(selectedMedia.path);
          if (fullMedia) {
            updateMediaData({ ...selectedMedia, ...fullMedia });
          }
        } catch (e) {
          logger.error('[PlayerSync] Failed to fetch full details:', e);
        }
      };

      fetchDetails();
    }
  }, [isOpen, selectedMedia, updateMediaData]);

  const currentMediaId = selectedMedia?.id;

  useEffect(() => {
    if (!isOpen || !currentMediaId) return;

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
  }, [isOpen, currentMediaId, updateMediaData]);

  useEffect(() => {
    if (selectedMedia && selectedMedia.metadataStatus === 'pending') {
      api.media.harvestMetadata(selectedMedia.id);
    }
  }, [selectedMedia]);

  useEffect(() => {
    if (!isOpen || !selectedMedia) return;

    const unsubscribe = api.events.onMediaUpdate(async (events: MediaUpdateEvent[]) => {
      const relevantEvent = events.find(
        (e) => e.type === 'update' && e.path === selectedMedia.path
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
  }, [isOpen, selectedMedia, queryClient, updateMediaData]);
};
