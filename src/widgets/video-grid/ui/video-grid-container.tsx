// src/widgets/video-grid/ui/video-grid-container.tsx

import { useEffect, useMemo } from 'react';
import { useSettingsStore } from '@/shared/stores/settings-store';
import { useVideoPlayerStore } from '@/features/video-player/model/store';
import { useSearchStore } from '@/features/search-videos/model/store';
import { useSelectionStore } from '@/shared/stores/selection-store';
import { useUIStore } from '@/shared/stores/ui-store';
import { VideoGridLayout } from './video-grid-layout';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/shared/lib/use-is-mobile';
import { RenameVideoDialog } from '@/features/rename-video/ui/rename-video-dialog';
import { useVideoGridState } from '../model/use-video-grid-state';
import { useGridPagination } from '../model/use-grid-pagination';
import { useVideoGridInteractions } from '../model/use-video-grid-interactions';
import { useExternalDrop } from '../model/use-external-drop';
import { VideoGridItemInteractions } from './video-grid-item';
import { VideoGridConfig } from '../model/types';
import { ContextMenuRenderer } from '@/shared/types/ui';

interface VideoGridContainerProps {
  folderPath: string;
  columnCount: number;
  renderContextMenu?: ContextMenuRenderer;
}

export const VideoGridContainer = ({
  folderPath,
  columnCount,
  renderContextMenu,
}: VideoGridContainerProps) => {
  const layoutMode = useSettingsStore((s) => s.layoutMode);
  const gridStyle = useSettingsStore((s) => s.gridStyle);
  const mobileColumnCount = useSettingsStore((s) => s.mobileColumnCount);
  const isModalOpen = useVideoPlayerStore((state) => state.isOpen);
  const searchQuery = useSearchStore((state) => state.query);
  const debouncedQuery = useSearchStore((state) => state.debouncedQuery);
  const selectedTagIds = useUIStore((state) => state.selectedTagIds);
  const isSelectionMode = useSelectionStore((state) => state.isSelectionMode);
  const isMobile = useIsMobile();

  const showFavoritesOnly = useUIStore((state) => state.showFavoritesOnly);
  const isGlobalMode = useUIStore((state) => state.viewMode === 'all-favorites');
  const isPlaylistMode = useUIStore((state) => state.viewMode === 'playlist');
  const isTagMode = useUIStore((state) => state.viewMode === 'tag-results');

  const { dropHandlers } = useExternalDrop();

  const { allSortedVideos, isLoading, isError, error, sortOption } = useVideoGridState(folderPath);

  const effectiveColumnCount = isMobile ? mobileColumnCount : columnCount;

  const { visibleVideos, deferredColumnCount, deferredGridStyle, hasMore, handleFetchMore } =
    useGridPagination(allSortedVideos, effectiveColumnCount, gridStyle);

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
  } = useVideoGridInteractions(folderPath, allSortedVideos);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [folderPath, debouncedQuery, selectedTagIds]);

  const gridConfig = useMemo<VideoGridConfig>(
    () => ({
      gridStyle: deferredGridStyle,
      columnCount: deferredColumnCount,
      layoutMode,
      sortOption,
      searchQuery,
      isModalOpen,
      isSelectionMode,
      isGlobalMode,
      isPlaylistMode,
      isTagMode,
      folderPath,
      showFavoritesOnly,
    }),
    [
      deferredGridStyle,
      deferredColumnCount,
      layoutMode,
      sortOption,
      searchQuery,
      isModalOpen,
      isSelectionMode,
      isGlobalMode,
      isPlaylistMode,
      isTagMode,
      folderPath,
      showFavoritesOnly,
    ]
  );

  const containerPadding = layoutMode === 'masonry' && deferredGridStyle === 'tile' ? 'p-0' : 'p-4';

  const interactions: VideoGridItemInteractions = useMemo(
    () => ({
      onVideoClick: handleVideoClick,
      onRenameOpen: setVideoToRename,
      onDragStart: handleDragStart,
      onPointerDown: handlePointerDown,
      onPointerMove: handlePointerMove,
      onPointerUp: handlePointerUp,
      onPointerLeave: handlePointerLeave,
    }),
    [
      handleVideoClick,
      setVideoToRename,
      handleDragStart,
      handlePointerDown,
      handlePointerMove,
      handlePointerUp,
      handlePointerLeave,
    ]
  );

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
        config={gridConfig}
        onReorder={handleReorder}
        hasMore={hasMore}
        onFetchMore={handleFetchMore}
        interactions={interactions}
        renderContextMenu={renderContextMenu}
      />

      {videoToRename && (
        <RenameVideoDialog
          isOpen={!!videoToRename}
          onOpenChange={(isOpen) => !isOpen && handleRenameClose()}
          videoId={videoToRename.id}
          videoName={videoToRename.name}
        />
      )}
    </div>
  );
};
