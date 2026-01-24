// src/widgets/media-grid/model/use-media-grid-state.ts

import { useQuery } from '@tanstack/react-query';
import { useSettingsStore } from '@/shared/stores/settings-store';
import { useUIStore } from '@/shared/stores/ui-store';
import { useFavorites } from '@/features/toggle-favorite/model/use-favorite';
import { useMediaSource } from './use-media-source';
import { useMediaUpdates } from './use-media-updates';
import { useFilteredMedia } from '../lib/use-filtered-media';
import { api } from '@/shared/api';

export const useMediaGridState = (folderPath: string) => {
  const sortOption = useSettingsStore((s) => s.sortOption);
  const showFavoritesOnly = useUIStore((s) => s.showFavoritesOnly);
  const { favorites } = useFavorites();

  useMediaUpdates(folderPath);

  const {
    data: rawMedia,
    isLoading,
    isError,
    error,
    isGlobalMode,
    isPlaylistMode,
    isTagMode,
    isSearching,
  } = useMediaSource(folderPath);

  const { data: folderCustomOrder } = useQuery({
    queryKey: ['folder-order', folderPath],
    queryFn: () => api.sorting.getFolderOrder(folderPath),
    enabled:
      !isGlobalMode &&
      !isPlaylistMode &&
      !isTagMode &&
      !isSearching &&
      sortOption === 'custom' &&
      !!folderPath,
  });

  const allSortedMedia = useFilteredMedia({
    mediaItems: rawMedia,
    sortOption,
    showFavoritesOnly,
    favorites,
    isGlobalMode,
    isPlaylistMode,
    isTagMode,
    isSearching,
    customOrder: folderCustomOrder,
  });

  return {
    allSortedMedia,
    isLoading,
    isError,
    error,
    isGlobalMode,
    isPlaylistMode,
    isTagMode,
    showFavoritesOnly,
    sortOption,
  };
};
