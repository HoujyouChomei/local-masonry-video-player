// src/widgets/media-grid/ui/media-grid.tsx

import { useSettingsStore } from '@/shared/stores/settings-store';
import { useUIStore } from '@/shared/stores/ui-store';
import { MediaGridContainer } from './media-grid-container';
import { useIsMobile } from '@/shared/lib/use-is-mobile';
import { ContextMenuRenderer } from '@/shared/types/ui';

interface MediaGridProps {
  folderPath: string;
  columnCount?: number;
  renderContextMenu?: ContextMenuRenderer;
}

export const MediaGrid = ({ folderPath, columnCount = 4, renderContextMenu }: MediaGridProps) => {
  const sortOption = useSettingsStore((state) => state.sortOption);
  const chunkSize = useSettingsStore((state) => state.chunkSize);
  const mobileColumnCount = useSettingsStore((state) => state.mobileColumnCount);

  const showFavoritesOnly = useUIStore((state) => state.showFavoritesOnly);
  const viewMode = useUIStore((state) => state.viewMode);
  const selectedPlaylistId = useUIStore((state) => state.selectedPlaylistId);

  const isMobile = useIsMobile();

  const effectiveColumns = isMobile ? mobileColumnCount : columnCount;

  const componentKey = `${folderPath}-${sortOption}-${showFavoritesOnly}-${viewMode}-${selectedPlaylistId}-${chunkSize}-${effectiveColumns}`;

  return (
    <MediaGridContainer
      key={componentKey}
      folderPath={folderPath}
      columnCount={columnCount}
      renderContextMenu={renderContextMenu}
    />
  );
};
