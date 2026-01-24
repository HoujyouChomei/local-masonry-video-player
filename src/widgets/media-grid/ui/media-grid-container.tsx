// src/widgets/media-grid/ui/media-grid-container.tsx

import { useEffect, useMemo } from 'react';
import { useSettingsStore } from '@/shared/stores/settings-store';
import { useMediaPlayerStore } from '@/entities/player/model/store';
import { useSearchStore } from '@/features/search-media/model/store';
import { useSelectionStore } from '@/shared/stores/selection-store';
import { useUIStore } from '@/shared/stores/ui-store';
import { MediaGridLayout } from './media-grid-layout';
import { cn } from '@/shared/lib/utils';
import { useIsMobile } from '@/shared/lib/use-is-mobile';
import { RenameMediaDialog } from '@/features/rename-media/ui/rename-media-dialog';
import { useMediaGridState } from '../model/use-media-grid-state';
import { useGridPagination } from '../model/use-grid-pagination';
import { useMediaGridInteractions } from '../model/use-media-grid-interactions';
import { useExternalDrop } from '../model/use-external-drop';
import { MediaGridItemInteractions } from './media-grid-item';
import { MediaGridConfig } from '../model/types';
import { ContextMenuRenderer } from '@/shared/types/ui';

interface MediaGridContainerProps {
  folderPath: string;
  columnCount: number;
  renderContextMenu?: ContextMenuRenderer;
}

export const MediaGridContainer = ({
  folderPath,
  columnCount,
  renderContextMenu,
}: MediaGridContainerProps) => {
  const layoutMode = useSettingsStore((s) => s.layoutMode);
  const gridStyle = useSettingsStore((s) => s.gridStyle);
  const mobileColumnCount = useSettingsStore((s) => s.mobileColumnCount);
  const isModalOpen = useMediaPlayerStore((state) => state.isOpen);
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

  const { allSortedMedia, isLoading, isError, error, sortOption } = useMediaGridState(folderPath);

  const effectiveColumnCount = isMobile ? mobileColumnCount : columnCount;

  const { visibleMedia, deferredColumnCount, deferredGridStyle, hasMore, handleFetchMore } =
    useGridPagination(allSortedMedia, effectiveColumnCount, gridStyle);

  const {
    mediaToRename,
    setMediaToRename,
    handleRenameClose,
    handleMediaClick,
    handleReorder,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handlePointerLeave,
    handleDragStart,
  } = useMediaGridInteractions(folderPath, allSortedMedia);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [folderPath, debouncedQuery, selectedTagIds]);

  useEffect(() => {
    const handleSelectAll = () => {
      const allIds = allSortedMedia.map((media) => media.id);
      if (allIds.length > 0) {
        useSelectionStore.getState().selectAll(allIds);
      }
    };

    window.addEventListener('media-view:select-all', handleSelectAll);
    return () => {
      window.removeEventListener('media-view:select-all', handleSelectAll);
    };
  }, [allSortedMedia]);

  const gridConfig = useMemo<MediaGridConfig>(
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

  const interactions: MediaGridItemInteractions = useMemo(
    () => ({
      onMediaClick: handleMediaClick,
      onRenameOpen: setMediaToRename,
      onDragStart: handleDragStart,
      onPointerDown: handlePointerDown,
      onPointerMove: handlePointerMove,
      onPointerUp: handlePointerUp,
      onPointerLeave: handlePointerLeave,
    }),
    [
      handleMediaClick,
      setMediaToRename,
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
      <MediaGridLayout
        mediaItems={visibleMedia}
        totalMediaCount={allSortedMedia.length}
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

      {mediaToRename && (
        <RenameMediaDialog
          isOpen={!!mediaToRename}
          onOpenChange={(isOpen) => !isOpen && handleRenameClose()}
          mediaId={mediaToRename.id}
          mediaName={mediaToRename.name}
        />
      )}
    </div>
  );
};
