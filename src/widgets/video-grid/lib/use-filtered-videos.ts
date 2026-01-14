// src/widgets/video-grid/lib/use-filtered-videos.ts

import { useMemo } from 'react';
import { VideoFile, SortOption } from '@/shared/types/video';
import { sortVideos } from '@/features/sort-videos/lib/utils';

interface UseFilteredVideosProps {
  videos: VideoFile[] | undefined;
  sortOption: SortOption;
  showFavoritesOnly: boolean;
  favorites: string[];
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

    if (!isGlobalMode && !isPlaylistMode && showFavoritesOnly) {
      result = result.filter((v) => favorites.includes(v.id));
    }

    if (isPlaylistMode && sortOption === 'custom') {
      return result;
    }

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
