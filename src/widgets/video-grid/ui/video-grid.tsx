// src/widgets/video-grid/ui/video-grid.tsx

'use client';

import React from 'react';
import { useSettingsStore } from '@/shared/stores/settings-store';
import { useUIStore } from '@/shared/stores/ui-store';
import { VideoGridContainer } from './video-grid-container';

interface VideoGridProps {
  folderPath: string;
  columnCount?: number;
}

export const VideoGrid = ({ folderPath, columnCount = 4 }: VideoGridProps) => {
  // Selectors
  const sortOption = useSettingsStore((state) => state.sortOption);
  const chunkSize = useSettingsStore((state) => state.chunkSize);

  const showFavoritesOnly = useUIStore((state) => state.showFavoritesOnly);
  const viewMode = useUIStore((state) => state.viewMode);
  // ▼▼▼ 追加: プレイリストIDも監視する ▼▼▼
  const selectedPlaylistId = useUIStore((state) => state.selectedPlaylistId);

  // ▼▼▼ 修正: キーに selectedPlaylistId を追加 ▼▼▼
  // これにより、プレイリスト切り替え時もコンポーネントが完全にリセットされるため
  // 内部での useEffect による State リセットが不要になる。
  const componentKey = `${folderPath}-${sortOption}-${showFavoritesOnly}-${viewMode}-${selectedPlaylistId}-${chunkSize}`;

  return (
    <VideoGridContainer key={componentKey} folderPath={folderPath} columnCount={columnCount} />
  );
};
