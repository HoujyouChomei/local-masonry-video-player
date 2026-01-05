// src/widgets/video-grid/ui/video-grid.tsx

import { useSettingsStore } from '@/shared/stores/settings-store';
import { useUIStore } from '@/shared/stores/ui-store';
import { VideoGridContainer } from './video-grid-container';
import { useIsMobile } from '@/shared/lib/use-is-mobile'; // Added

interface VideoGridProps {
  folderPath: string;
  columnCount?: number;
}

export const VideoGrid = ({ folderPath, columnCount = 4 }: VideoGridProps) => {
  // Selectors
  const sortOption = useSettingsStore((state) => state.sortOption);
  const chunkSize = useSettingsStore((state) => state.chunkSize);
  const mobileColumnCount = useSettingsStore((state) => state.mobileColumnCount); // Added

  const showFavoritesOnly = useUIStore((state) => state.showFavoritesOnly);
  const viewMode = useUIStore((state) => state.viewMode);
  const selectedPlaylistId = useUIStore((state) => state.selectedPlaylistId);

  const isMobile = useIsMobile(); // Added

  // ▼▼▼ 修正: キーに mobileColumnCount も含める ▼▼▼
  // これにより、スマホで列数を切り替えた際にグリッドが確実にリセット・再計算される
  const effectiveColumns = isMobile ? mobileColumnCount : columnCount;

  const componentKey = `${folderPath}-${sortOption}-${showFavoritesOnly}-${viewMode}-${selectedPlaylistId}-${chunkSize}-${effectiveColumns}`;

  return (
    <VideoGridContainer key={componentKey} folderPath={folderPath} columnCount={columnCount} />
  );
};
