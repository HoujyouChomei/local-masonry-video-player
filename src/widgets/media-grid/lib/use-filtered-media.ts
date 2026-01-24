// src/widgets/media-grid/lib/use-filtered-media.ts

import { useMemo } from 'react';
import { Media } from '@/shared/schemas/media';
import { SortOption } from '@/shared/schemas/settings';
import { sortMedia } from '@/features/sort-media/lib/utils';

interface useFilteredMediaProps {
  mediaItems: Media[] | undefined;
  sortOption: SortOption;
  showFavoritesOnly: boolean;
  favorites: string[];
  isGlobalMode: boolean;
  isPlaylistMode: boolean;
  isTagMode: boolean;
  isSearching: boolean;
  customOrder?: string[];
}

export const useFilteredMedia = ({
  mediaItems,
  sortOption,
  showFavoritesOnly,
  favorites,
  isGlobalMode,
  isPlaylistMode,
  isTagMode,
  isSearching,
  customOrder,
}: useFilteredMediaProps) => {
  return useMemo(() => {
    if (!mediaItems) return [];

    let result = mediaItems;

    if (!isGlobalMode && !isPlaylistMode && showFavoritesOnly) {
      result = result.filter((v) => favorites.includes(v.id));
    }

    if (isPlaylistMode && sortOption === 'custom') {
      return result;
    }

    const activeCustomOrder = !isGlobalMode && !isTagMode && !isSearching ? customOrder : undefined;

    return sortMedia(result, sortOption, activeCustomOrder);
  }, [
    mediaItems,
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
