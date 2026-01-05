// src/widgets/video-grid/ui/video-grid-layout.tsx

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

  // ▼▼▼ 修正: isLoading を条件から除外 ▼▼▼
  // これにより、検索中やフォルダ切り替え中も、前の画面を表示し続ける（Stale-while-revalidate）
  if (
    totalVideosCount === 0 ||
    // isLoading ||  <-- 削除
    isError ||
    (!isGlobalMode && !isPlaylistMode && !isTagMode && !folderPath)
  ) {
    // データがない、かつロード中でもない場合にのみ EmptyState を出す
    // (ロード中は videos が空でも、初期ロードでなければ前のデータが残っているはずだが、
    // useVideoSource がデータをクリアする場合は空になる。その場合のみ EmptyState が出る)
    if (!isLoading) {
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
    // ロード中でデータが空の場合は、ちらつき防止のため何も表示しないか、
    // あるいはスケルトンを表示するのが理想だが、ここではnullを返してホワイトアウトを許容するか
    // EmptyState(Loading)を出すか。
    // useQueryの挙動として、キーが変わるとデータはundefinedになるため、
    // 厳密にはここでもローディング表示が必要になる場合がある。
    // ただし、検索クエリの変化(keepPreviousData相当)の場合はデータが残る。

    // データが本当に空で、ロード中の場合
    if (isLoading && videos.length === 0) {
      // 初回ロード時などはここに来る
      return null;
    }
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
        {/* ▼▼▼ 追加: ロード中であることを視覚的に示す（オプション） ▼▼▼ */}
        {isLoading && (
          <div className="fixed top-16 right-6 z-50">
            <div className="bg-primary h-2 w-2 animate-ping rounded-full opacity-75"></div>
          </div>
        )}

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
          videoId={videoToRename.id}
          videoName={videoToRename.name}
        />
      )}
    </>
  );
};
