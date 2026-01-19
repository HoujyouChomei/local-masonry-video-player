// src/widgets/video-grid/model/types.ts

import { SortOption } from '@/shared/types/video';
import { GridStyle } from '@/shared/types/electron';

export interface VideoGridConfig {
  gridStyle: GridStyle;
  columnCount: number;
  layoutMode: 'masonry' | 'list';
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
