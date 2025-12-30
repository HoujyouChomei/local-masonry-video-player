// src/widgets/video-grid/ui/video-grid-layout.tsx

'use client';

import React from 'react';
import InfiniteScroll from 'react-infinite-scroll-component';
import { VideoFile, SortOption } from '@/shared/types/video';
import { RenameVideoDialog } from '@/features/rename-video/ui/rename-video-dialog';
import { EmptyState } from './components/empty-state';
import { MasonryView } from './views/masonry-view';
import { ListView } from './views/list-view';
import { useSelectionStore } from '@/shared/stores/selection-store';
import './video-grid.css';

interface VideoGridLayoutProps {
  videos: VideoFile[];
  totalVideosCount: number;
  isLoading: boolean;
  isError: boolean;
  error: unknown;
  searchQuery: string;

  columnCount: number;
  isGlobalMode: boolean;
  isPlaylistMode: boolean;
  isTagMode: boolean;
  isModalOpen: boolean;
  folderPath: string;
  showFavoritesOnly: boolean;

  layoutMode: 'masonry' | 'list';
  sortOption: SortOption;
  onReorder: (newVideos: VideoFile[]) => void;

  videoToRename: VideoFile | null;
  onRenameClose: () => void;
  onRenameOpen: (video: VideoFile) => void;

  hasMore: boolean;
  onFetchMore: () => void;

  // Interactions
  // ▼▼▼ 変更: 型定義を更新 (video, e) のみ受け取る ▼▼▼
  onVideoClick: (video: VideoFile, e: React.MouseEvent) => void;
  onPointerDown: (video: VideoFile, e: React.PointerEvent) => void;
  onPointerMove: (e: React.PointerEvent) => void;
  onPointerUp: (e: React.PointerEvent) => void;
  onPointerLeave: (e: React.PointerEvent) => void;
  onDragStart: () => void;
}

export const VideoGridLayout = ({
  videos,
  totalVideosCount,
  isLoading,
  isError,
  error,
  searchQuery,
  columnCount,
  isGlobalMode,
  isPlaylistMode,
  isTagMode,
  isModalOpen,
  folderPath,
  showFavoritesOnly,
  layoutMode,
  sortOption,
  onReorder,
  videoToRename,
  onRenameClose,
  onRenameOpen,
  hasMore,
  onFetchMore,
  onVideoClick,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerLeave,
  onDragStart,
}: VideoGridLayoutProps) => {
  const isSelectionMode = useSelectionStore((state) => state.isSelectionMode);

  if (
    totalVideosCount === 0 ||
    isLoading ||
    isError ||
    (!isGlobalMode && !isPlaylistMode && !isTagMode && !folderPath)
  ) {
    return (
      <EmptyState
        isLoading={isLoading}
        isError={isError}
        error={error}
        totalVideosCount={totalVideosCount}
        searchQuery={searchQuery}
        isGlobalMode={isGlobalMode}
        isPlaylistMode={isPlaylistMode}
        isTagMode={isTagMode}
        folderPath={folderPath}
        showFavoritesOnly={showFavoritesOnly}
      />
    );
  }

  const isSortable =
    layoutMode === 'list' && sortOption === 'custom' && !searchQuery && !isSelectionMode;

  return (
    <>
      <InfiniteScroll
        dataLength={videos.length}
        next={onFetchMore}
        hasMore={hasMore}
        scrollThreshold="2000px"
        loader={null}
        style={{ overflow: 'visible' }}
      >
        {layoutMode === 'masonry' ? (
          <MasonryView
            videos={videos}
            columnCount={columnCount}
            onVideoClick={onVideoClick}
            isModalOpen={isModalOpen}
            onRenameOpen={onRenameOpen}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerLeave={onPointerLeave}
            onDragStart={onDragStart}
          />
        ) : (
          <ListView
            videos={videos}
            isSortable={isSortable}
            onReorder={onReorder}
            onVideoClick={onVideoClick}
            onRenameOpen={onRenameOpen}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerLeave={onPointerLeave}
            onDragStart={onDragStart}
          />
        )}
      </InfiniteScroll>

      {videoToRename && (
        <RenameVideoDialog
          isOpen={!!videoToRename}
          onOpenChange={(isOpen) => !isOpen && onRenameClose()}
          videoPath={videoToRename.path}
          videoName={videoToRename.name}
        />
      )}
    </>
  );
};
