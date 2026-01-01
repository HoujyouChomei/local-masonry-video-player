// src/widgets/video-grid/lib/use-filtered-videos.ts

import { useMemo } from 'react';
import { VideoFile, SortOption } from '@/shared/types/video';
import { sortVideos } from '@/features/sort-videos/lib/utils';

interface UseFilteredVideosProps {
  videos: VideoFile[] | undefined;
  sortOption: SortOption;
  showFavoritesOnly: boolean;
  favorites: string[]; // IDのリスト
  isGlobalMode: boolean;
  isPlaylistMode: boolean;
  isTagMode: boolean;
  isSearching: boolean;
  customOrder?: string[];
}

export const useFilteredVideos = ({
  videos,
  sortOption,
  showFavoritesOnly,
  favorites,
  isGlobalMode,
  isPlaylistMode,
  isTagMode,
  isSearching,
  customOrder,
}: UseFilteredVideosProps) => {
  return useMemo(() => {
    if (!videos) return [];

    let result = videos;

    // 1. お気に入りフィルタ
    // GlobalMode/PlaylistMode以外で適用
    if (!isGlobalMode && !isPlaylistMode && showFavoritesOnly) {
      // ▼▼▼ 修正: v.path ではなく v.id で照合する ▼▼▼
      result = result.filter((v) => favorites.includes(v.id));
    }

    // 2. ソート
    if (isPlaylistMode && sortOption === 'custom') {
      return result;
    }

    // 検索モード、タグモード、Globalモード時はカスタムソート(D&D)を無効化
    const activeCustomOrder = !isGlobalMode && !isTagMode && !isSearching ? customOrder : undefined;

    return sortVideos(result, sortOption, activeCustomOrder);
  }, [
    videos,
    sortOption,
    showFavoritesOnly,
    favorites,
    isGlobalMode,
    isPlaylistMode,
    isTagMode,
    isSearching,
    customOrder,
  ]);
};