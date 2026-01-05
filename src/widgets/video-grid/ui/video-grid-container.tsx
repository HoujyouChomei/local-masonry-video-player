// src/widgets/video-grid/ui/video-grid-container.tsx

import { useEffect } from 'react';
import { useSettingsStore } from '@/shared/stores/settings-store';
import { useVideoPlayerStore } from '@/features/video-player/model/store';
import { useSearchStore } from '@/features/search-videos/model/store';
import { useSelectionStore } from '@/shared/stores/selection-store';
import { useUIStore } from '@/shared/stores/ui-store';
import { VideoGridLayout } from './video-grid-layout';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/shared/lib/use-is-mobile'; // Added

import { useVideoGridState } from '../model/use-video-grid-state';
import { useGridPagination } from '../model/use-grid-pagination';
import { useVideoGridInteractions } from '../model/use-video-grid-interactions';
import { useExternalDrop } from '../model/use-external-drop';

interface VideoGridContainerProps {
  folderPath: string;
  columnCount: number; // PC value from props
}

export const VideoGridContainer = ({ folderPath, columnCount }: VideoGridContainerProps) => {
  const layoutMode = useSettingsStore((s) => s.layoutMode);
  const gridStyle = useSettingsStore((s) => s.gridStyle);
  const mobileColumnCount = useSettingsStore((s) => s.mobileColumnCount); // Added
  const isModalOpen = useVideoPlayerStore((state) => state.isOpen);

  // 検索入力値と、確定した検索クエリを取得
  const searchQuery = useSearchStore((state) => state.query);
  const debouncedQuery = useSearchStore((state) => state.debouncedQuery);

  // タグ選択状態を取得
  const selectedTagIds = useUIStore((state) => state.selectedTagIds);

  const isSelectionMode = useSelectionStore((state) => state.isSelectionMode);

  const isMobile = useIsMobile(); // Added

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

  // ▼▼▼ 修正: モバイル時は mobileColumnCount を優先 ▼▼▼
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

  // マウント時（フォルダ変更時など）のスクロールリセット
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  // ▼▼▼ 追加: 検索クエリやタグ選択が変更された時にスクロールをトップに戻す ▼▼▼
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [debouncedQuery, selectedTagIds]);

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
