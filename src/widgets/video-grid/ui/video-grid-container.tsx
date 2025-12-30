// src/widgets/video-grid/ui/video-grid-container.tsx

import React, { useEffect } from 'react';
import { useSettingsStore } from '@/shared/stores/settings-store';
import { useVideoPlayerStore } from '@/features/video-player/model/store';
import { useSearchStore } from '@/features/search-videos/model/store';
import { useSelectionStore } from '@/shared/stores/selection-store';
import { VideoGridLayout } from './video-grid-layout';
import { cn } from '@/lib/utils';

import { useVideoGridState } from '../model/use-video-grid-state';
import { useGridPagination } from '../model/use-grid-pagination';
import { useVideoGridInteractions } from '../model/use-video-grid-interactions';
import { useExternalDrop } from '../model/use-external-drop';

interface VideoGridContainerProps {
  folderPath: string;
  columnCount: number;
}

export const VideoGridContainer = ({ folderPath, columnCount }: VideoGridContainerProps) => {
  const layoutMode = useSettingsStore((s) => s.layoutMode);
  const gridStyle = useSettingsStore((s) => s.gridStyle);
  const isModalOpen = useVideoPlayerStore((state) => state.isOpen);
  const searchQuery = useSearchStore((state) => state.query);
  const isSelectionMode = useSelectionStore((state) => state.isSelectionMode);

  const { dropHandlers } = useExternalDrop();

  const {
    allSortedVideos,
    isLoading,
    isError,
    error,
    isGlobalMode,
    isPlaylistMode,
    isTagMode,
    showFavoritesOnly,
    sortOption,
  } = useVideoGridState(folderPath);

  const { visibleVideos, deferredColumnCount, deferredGridStyle, hasMore, handleFetchMore } =
    useGridPagination(allSortedVideos, columnCount, gridStyle);

  const {
    videoToRename,
    setVideoToRename,
    handleRenameClose,
    handleVideoClick,
    handleReorder,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handlePointerLeave,
    handleDragStart,
    // ▼▼▼ 変更: allSortedVideos を渡す ▼▼▼
  } = useVideoGridInteractions(folderPath, allSortedVideos);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  const containerPadding =
    layoutMode === 'masonry' && deferredGridStyle === 'mosaic' ? 'p-0' : 'p-4';

  return (
    <div
      className={cn(
        'min-h-full transition-[padding] duration-300',
        containerPadding,
        isSelectionMode && 'is-selection-mode'
      )}
      {...dropHandlers}
    >
      <VideoGridLayout
        videos={visibleVideos}
        totalVideosCount={allSortedVideos.length}
        isLoading={isLoading}
        isError={isError}
        error={error}
        searchQuery={searchQuery}
        columnCount={deferredColumnCount}
        isGlobalMode={isGlobalMode}
        isPlaylistMode={isPlaylistMode}
        isTagMode={isTagMode}
        isModalOpen={isModalOpen}
        folderPath={folderPath}
        showFavoritesOnly={showFavoritesOnly}
        layoutMode={layoutMode}
        sortOption={sortOption}
        onReorder={handleReorder}
        videoToRename={videoToRename}
        onRenameClose={handleRenameClose}
        onRenameOpen={setVideoToRename}
        hasMore={hasMore}
        onFetchMore={handleFetchMore}
        // ▼▼▼ 変更: 関数を直接渡す (インライン関数を削除) ▼▼▼
        onVideoClick={handleVideoClick}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerLeave}
        onDragStart={handleDragStart}
      />
    </div>
  );
};
