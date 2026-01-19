// src/widgets/video-grid/ui/video-grid.tsx

import { useSettingsStore } from '@/shared/stores/settings-store';
import { useUIStore } from '@/shared/stores/ui-store';
import { VideoGridContainer } from './video-grid-container';
import { useIsMobile } from '@/shared/lib/use-is-mobile';
import { ContextMenuRenderer } from '@/shared/types/ui';

interface VideoGridProps {
  folderPath: string;
  columnCount?: number;
  renderContextMenu?: ContextMenuRenderer;
}

export const VideoGrid = ({ folderPath, columnCount = 4, renderContextMenu }: VideoGridProps) => {
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
    <VideoGridContainer
      key={componentKey}
      folderPath={folderPath}
      columnCount={columnCount}
      renderContextMenu={renderContextMenu}
    />
  );
};
