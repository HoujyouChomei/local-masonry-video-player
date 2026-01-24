// src/widgets/media-grid/model/use-media-source.ts

import { useEffect } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { useUIStore } from '@/shared/stores/ui-store';
import { useSearchStore } from '@/features/search-media/model/store';
import { api } from '@/shared/api';
import { SearchOptions } from '@/shared/types/electron';
import { useMediaCache } from '@/shared/lib/use-media-cache';

export const useMediaSource = (folderPath: string) => {
  const { viewMode, selectedPlaylistId, selectedTagIds } = useUIStore();
  const { searchScope, debouncedQuery } = useSearchStore();

  const { syncMetadata } = useMediaCache();

  const isGlobalMode = viewMode === 'all-favorites';
  const isPlaylistMode = viewMode === 'playlist';
  const isTagMode = viewMode === 'tag-results';

  const isGlobalSearchScope = searchScope === 'global';

  const hasSearchQuery = debouncedQuery.length > 0;

  const shouldUseSearchApi = isGlobalSearchScope
    ? hasSearchQuery || selectedTagIds.length > 0
    : hasSearchQuery;

  const queryKey = shouldUseSearchApi
    ? [
        'search',
        debouncedQuery,
        selectedTagIds,
        searchScope,
        viewMode,
        selectedPlaylistId,
        folderPath,
      ]
    : isGlobalMode
      ? ['all-favorites-media']
      : isPlaylistMode && selectedPlaylistId
        ? ['playlist-media', selectedPlaylistId]
        : isTagMode && selectedTagIds.length > 0
          ? ['tag-media', selectedTagIds]
          : ['media-list', folderPath];

  const queryInfo = useQuery({
    queryKey,
    queryFn: () => {
      if (shouldUseSearchApi) {
        const options: SearchOptions = {};

        if (!isGlobalSearchScope) {
          if (isGlobalMode) {
            options.isFavorite = true;
          } else if (isPlaylistMode && selectedPlaylistId) {
            options.playlistId = selectedPlaylistId;
          } else if (isTagMode) {
            // No options
          } else {
            options.folderPath = folderPath;
          }
        }

        return api.media.search(debouncedQuery, selectedTagIds, options);
      }

      if (isGlobalMode) return api.favorites.getMedia();
      if (isPlaylistMode && selectedPlaylistId) return api.playlists.getMedia(selectedPlaylistId);
      if (isTagMode && selectedTagIds.length > 0) return api.tags.getMedia(selectedTagIds);

      return api.media.getAll(folderPath);
    },
    enabled: true,
    staleTime: 0,
    refetchOnMount: true,
    placeholderData: keepPreviousData,
  });

  useEffect(() => {
    if (queryInfo.isSuccess && !queryInfo.isFetching) {
      syncMetadata();
    }
  }, [queryInfo.isSuccess, queryInfo.isFetching, syncMetadata]);

  return {
    ...queryInfo,
    isGlobalMode,
    isPlaylistMode,
    isTagMode,
    isSearching: shouldUseSearchApi,
  };
};
