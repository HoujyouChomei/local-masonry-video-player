// src/widgets/video-grid/model/use-video-grid-state.ts

import { useQuery } from '@tanstack/react-query';
import { useSettingsStore } from '@/shared/stores/settings-store';
import { useUIStore } from '@/shared/stores/ui-store';
import { useFavorites } from '@/features/toggle-favorite/model/use-favorite';
import { useVideoSource } from './use-video-source';
import { useVideoUpdates } from './use-video-updates';
import { useFilteredVideos } from '../lib/use-filtered-videos';
import { fetchFolderOrderApi } from '@/shared/api/electron';

export const useVideoGridState = (folderPath: string) => {
  const sortOption = useSettingsStore((s) => s.sortOption);
  const showFavoritesOnly = useUIStore((s) => s.showFavoritesOnly);
  const { favorites } = useFavorites();

  useVideoUpdates(folderPath);

  const {
    data: rawVideos,
    isLoading,
    isError,
    error,
    isGlobalMode,
    isPlaylistMode,
    isTagMode,
    isSearching,
  } = useVideoSource(folderPath);

  const { data: folderCustomOrder } = useQuery({
    queryKey: ['folder-order', folderPath],
    queryFn: () => fetchFolderOrderApi(folderPath),
    enabled:
      !isGlobalMode &&
      !isPlaylistMode &&
      !isTagMode &&
      !isSearching &&
      sortOption === 'custom' &&
      !!folderPath,
  });

  const allSortedVideos = useFilteredVideos({
    videos: rawVideos,
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
    allSortedVideos,
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
