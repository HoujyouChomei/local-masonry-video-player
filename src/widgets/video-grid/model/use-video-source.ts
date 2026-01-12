// src/widgets/video-grid/model/use-video-source.ts

import { useEffect } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query'; // useQueryClient 削除
import { useUIStore } from '@/shared/stores/ui-store';
import { useSearchStore } from '@/features/search-videos/model/store';
import {
  fetchVideos,
  fetchFavoriteVideos,
  fetchPlaylistVideosApi,
  fetchVideosByTagApi,
  searchVideosApi,
} from '@/shared/api/electron';
import { SearchOptions } from '@/shared/types/electron';
import { useVideoCache } from '@/shared/lib/use-video-cache'; // 追加

export const useVideoSource = (folderPath: string) => {
  const { viewMode, selectedPlaylistId, selectedTagIds } = useUIStore();
  const { searchScope, debouncedQuery } = useSearchStore();

  const { syncMetadata } = useVideoCache(); // 追加

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
      ? ['all-favorites-videos']
      : isPlaylistMode && selectedPlaylistId
        ? ['playlist-videos', selectedPlaylistId]
        : isTagMode && selectedTagIds.length > 0
          ? ['tag-videos', selectedTagIds]
          : ['videos', folderPath];

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

        return searchVideosApi(debouncedQuery, selectedTagIds, options);
      }

      if (isGlobalMode) return fetchFavoriteVideos();
      if (isPlaylistMode && selectedPlaylistId) return fetchPlaylistVideosApi(selectedPlaylistId);
      if (isTagMode && selectedTagIds.length > 0) return fetchVideosByTagApi(selectedTagIds);

      return fetchVideos(folderPath);
    },
    enabled: true,
    staleTime: 0,
    refetchOnMount: true,
    placeholderData: keepPreviousData,
  });

  useEffect(() => {
    if (queryInfo.isSuccess && !queryInfo.isFetching) {
      // 変更: 動画リスト取得完了時に、関連データ（お気に入りIDリスト等）も同期する
      // 直接キーを指定せず、useVideoCacheのメソッドを使用
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
