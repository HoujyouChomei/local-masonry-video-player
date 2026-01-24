// src/widgets/media-grid/model/types.ts

import { SortOption } from '@/shared/schemas/settings';
import { GridStyle, LayoutMode } from '@/shared/types/electron';

export interface MediaGridConfig {
  gridStyle: GridStyle;
  columnCount: number;
  layoutMode: LayoutMode;
  sortOption: SortOption;
  searchQuery: string;

  isModalOpen: boolean;
  isSelectionMode: boolean;
  isGlobalMode: boolean;
  isPlaylistMode: boolean;
  isTagMode: boolean;
  folderPath: string;
  showFavoritesOnly: boolean;
}
