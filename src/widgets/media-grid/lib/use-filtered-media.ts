// src/widgets/media-grid/lib/use-filtered-media.ts

import { useMemo, useRef } from 'react';
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
  const randomOrderRef = useRef<string[] | null>(null);

  return useMemo(() => {
    if (!mediaItems) return [];

    let result = mediaItems;

    if (!isGlobalMode && !isPlaylistMode && showFavoritesOnly) {
      result = result.filter((v) => favorites.includes(v.id));
    }

    if (sortOption === 'random') {
      const currentIds = new Set(result.map((m) => m.id));
      const cachedOrder = randomOrderRef.current;

      const isCacheValid =
        cachedOrder &&
        cachedOrder.length === currentIds.size &&
        cachedOrder.every((id) => currentIds.has(id));

      if (isCacheValid && cachedOrder) {
        const mediaMap = new Map(result.map((m) => [m.id, m]));
        return cachedOrder.map((id) => mediaMap.get(id)!);
      }

      const shuffled = sortMedia(result, 'random');
      randomOrderRef.current = shuffled.map((m) => m.id);
      return shuffled;
    }

    randomOrderRef.current = null;

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