// src/widgets/video-grid/model/use-video-source.ts

import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
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

export const useVideoSource = (folderPath: string) => {
  const { viewMode, selectedPlaylistId, selectedTagIds } = useUIStore();
  const { searchScope, debouncedQuery } = useSearchStore();

  const queryClient = useQueryClient();

  const isGlobalMode = viewMode === 'all-favorites';
  const isPlaylistMode = viewMode === 'playlist';
  const isTagMode = viewMode === 'tag-results';

  const isGlobalSearchScope = searchScope === 'global';

  // 検索クエリがある場合、またはグローバルスコープでタグフィルタがある場合は検索APIを使用
  // ※ Folder Scope (Context Scope) でも検索クエリがあれば検索APIを使うように変更
  const hasSearchQuery = debouncedQuery.length > 0;

  // 検索APIを使用すべきかどうか
  // 1. Global Scope かつ (クエリあり OR タグ指定あり)
  // 2. Folder Scope かつ クエリあり
  const shouldUseSearchApi = isGlobalSearchScope
    ? hasSearchQuery || selectedTagIds.length > 0
    : hasSearchQuery;

  // クエリキーの決定
  // 検索条件やスコープが変わればリフェッチされるようにキーを構成
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
      // 1. Search API (Global or Context)
      if (shouldUseSearchApi) {
        const options: SearchOptions = {};

        // Scope = 'folder' (Context) の場合、現在のビューに応じた絞り込みを適用
        if (!isGlobalSearchScope) {
          if (isGlobalMode) {
            options.isFavorite = true;
          } else if (isPlaylistMode && selectedPlaylistId) {
            options.playlistId = selectedPlaylistId;
          } else if (isTagMode) {
            // タグモードの場合、コンテキストとしてのタグは第2引数(tagIds)に含める
            // (useUIStoreのselectedTagIdsは既にtagIds引数として渡されるので、ここで追加処理は不要)
            // ただし、Folderパスは指定しない（タグはフォルダ横断的だから）
          } else {
            // 通常フォルダモード
            options.folderPath = folderPath;
          }
        }

        return searchVideosApi(debouncedQuery, selectedTagIds, options);
      }

      // 2. Existing Modes (No Search Query)
      if (isGlobalMode) return fetchFavoriteVideos();
      if (isPlaylistMode && selectedPlaylistId) return fetchPlaylistVideosApi(selectedPlaylistId);
      if (isTagMode && selectedTagIds.length > 0) return fetchVideosByTagApi(selectedTagIds);

      // 3. Default Folder View
      return fetchVideos(folderPath);
    },
    enabled: true,
    staleTime: 0,
    refetchOnMount: true,
  });

  useEffect(() => {
    if (queryInfo.isSuccess && !queryInfo.isFetching) {
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
      queryClient.invalidateQueries({ queryKey: ['playlists'] });
    }
  }, [queryInfo.isSuccess, queryInfo.isFetching, queryClient]);

  return {
    ...queryInfo,
    isGlobalMode,
    isPlaylistMode,
    isTagMode,
    isSearching: shouldUseSearchApi,
  };
};
