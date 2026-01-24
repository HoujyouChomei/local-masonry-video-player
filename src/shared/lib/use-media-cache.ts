// src/shared/lib/use-media-cache.ts

import { useQueryClient } from '@tanstack/react-query';
import { Media } from '@/shared/schemas/media';

export const useMediaCache = () => {
  const queryClient = useQueryClient();

  const MEDIA_LIST_KEYS = [
    'media-list',
    'all-favorites-media',
    'playlist-media',
    'tag-media',
    'search',
  ];

  const onMediaUpdated = (updatedMedia: Media) => {
    MEDIA_LIST_KEYS.forEach((key) => {
      queryClient.setQueriesData<Media[]>({ queryKey: [key] }, (oldData) => {
        if (!oldData) return oldData;
        return oldData.map((v) => (v.id === updatedMedia.id ? updatedMedia : v));
      });
    });
  };

  const onMediaDeleted = (mediaId: string) => {
    MEDIA_LIST_KEYS.forEach((key) => {
      queryClient.setQueriesData<Media[]>({ queryKey: [key] }, (oldData) => {
        if (!oldData) return oldData;
        return oldData.filter((v) => v.id !== mediaId);
      });
    });

    queryClient.setQueryData<string[]>(['favorites'], (oldIds) => {
      if (!oldIds) return oldIds;
      return oldIds.filter((id) => id !== mediaId);
    });

    queryClient.invalidateQueries({ queryKey: ['playlists'] });
    queryClient.invalidateQueries({ queryKey: ['tags'] });
  };

  const onMediaDeletedByPath = (path: string) => {
    MEDIA_LIST_KEYS.forEach((key) => {
      queryClient.setQueriesData<Media[]>({ queryKey: [key] }, (oldData) => {
        if (!oldData) return oldData;
        return oldData.filter((v) => v.path !== path);
      });
    });
  };

  const invalidateAllMediaLists = () => {
    MEDIA_LIST_KEYS.forEach((key) => {
      queryClient.invalidateQueries({ queryKey: [key] });
    });
    queryClient.invalidateQueries({ queryKey: ['favorites'] });
    queryClient.invalidateQueries({ queryKey: ['playlists'] });
    queryClient.invalidateQueries({ queryKey: ['tags'] });
  };

  const onPlaylistUpdated = (targetPlaylistId?: string) => {
    queryClient.invalidateQueries({ queryKey: ['playlists'] });
    if (targetPlaylistId) {
      queryClient.invalidateQueries({ queryKey: ['playlist-media', targetPlaylistId] });
    }
  };

  const onTagsUpdated = (targetMediaIds?: string[]) => {
    queryClient.invalidateQueries({ queryKey: ['tags'] });
    queryClient.invalidateQueries({ queryKey: ['tag-media'] });
    if (targetMediaIds) {
      targetMediaIds.forEach((id) => {
        queryClient.invalidateQueries({ queryKey: ['media-tags', id] });
      });
    } else {
      queryClient.invalidateQueries({ queryKey: ['media-tags'] });
    }
  };

  const syncMetadata = () => {
    queryClient.invalidateQueries({ queryKey: ['favorites'] });
    queryClient.invalidateQueries({ queryKey: ['playlists'] });
  };

  const invalidateRefreshedLists = (keys: Set<string>) => {
    if (keys.has('media')) {
      queryClient.invalidateQueries({ queryKey: ['media-list'] });
    }
    if (keys.has('favorites')) {
      queryClient.invalidateQueries({ queryKey: ['all-favorites-media'] });
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
    }
    if (keys.has('playlists')) {
      queryClient.invalidateQueries({ queryKey: ['playlists'] });
      queryClient.invalidateQueries({ queryKey: ['playlist-media'] });
    }
    if (keys.has('tags')) {
      queryClient.invalidateQueries({ queryKey: ['tag-media'] });
      queryClient.invalidateQueries({ queryKey: ['tags'] });
    }
  };

  return {
    onMediaUpdated,
    onMediaDeleted,
    onMediaDeletedByPath,
    invalidateAllMediaLists,
    invalidateRefreshedLists,
    onPlaylistUpdated,
    onTagsUpdated,
    syncMetadata,
  };
};
