// src/widgets/video-grid/ui/video-grid-layout.tsx

import React from 'react';
import InfiniteScroll from 'react-infinite-scroll-component';
import { VideoFile, SortOption } from '@/shared/types/video';
import { EmptyState } from './components/empty-state';
import { MasonryView } from './views/masonry-view';
import { ListView } from './views/list-view';
import { VideoGridItemInteractions } from './video-grid-item';
import './video-grid.css';

interface VideoGridLayoutProps {
  videos: VideoFile[];
  totalVideosCount: number;
  isLoading: boolean;
  isError: boolean;
  error: unknown;
  searchQuery: string;

  // View States
  columnCount: number;
  isGlobalMode: boolean;
  isPlaylistMode: boolean;
  isTagMode: boolean;
  folderPath: string;
  showFavoritesOnly: boolean;
  isModalOpen: boolean;
  isSelectionMode: boolean;

  layoutMode: 'masonry' | 'list';
  sortOption: SortOption;
  onReorder: (newVideos: VideoFile[]) => void;

  hasMore: boolean;
  onFetchMore: () => void;

  // Interactions Object
  interactions: VideoGridItemInteractions;
}

export const VideoGridLayout = React.memo(
  ({
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
    folderPath,
    showFavoritesOnly,
    isModalOpen,
    isSelectionMode,
    layoutMode,
    sortOption,
    onReorder,
    hasMore,
    onFetchMore,
    interactions,
  }: VideoGridLayoutProps) => {
    // データがなく、かつエラーまたは未選択状態の場合のみ EmptyState を表示
    if (
      totalVideosCount === 0 ||
      isError ||
      (!isGlobalMode && !isPlaylistMode && !isTagMode && !folderPath)
    ) {
      // ロード中でない、またはエラーがある、またはフォルダ未選択の場合は EmptyState
      if (!isLoading || isError || !folderPath) {
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
      // ▼▼▼ 修正: ロード中かつデータ0件でも、nullではなくローディング表示を行う ▼▼▼
      // これによりDOM上に要素が存在し続け、E2Eテストの待機が正しく機能するようになる
      return (
        <div className="flex h-64 items-center justify-center">
          <div className="bg-primary h-3 w-3 animate-ping rounded-full opacity-75"></div>
        </div>
      );
    }

    const isSortable =
      layoutMode === 'list' && sortOption === 'custom' && !searchQuery && !isSelectionMode;

    return (
      <InfiniteScroll
        dataLength={videos.length}
        next={onFetchMore}
        hasMore={hasMore}
        scrollThreshold="2000px"
        loader={null}
        style={{ overflow: 'visible' }}
      >
        {/* データがある場合の追加ロード中表示 */}
        {isLoading && videos.length > 0 && (
          <div className="fixed top-16 right-6 z-50">
            <div className="bg-primary h-2 w-2 animate-ping rounded-full opacity-75"></div>
          </div>
        )}

        {layoutMode === 'masonry' ? (
          <MasonryView
            videos={videos}
            columnCount={columnCount}
            isModalOpen={isModalOpen}
            isSelectionMode={isSelectionMode}
            interactions={interactions}
          />
        ) : (
          <ListView
            videos={videos}
            isSortable={isSortable}
            onReorder={onReorder}
            interactions={interactions}
          />
        )}
      </InfiniteScroll>
    );
  }
);

VideoGridLayout.displayName = 'VideoGridLayout';
